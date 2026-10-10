import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Resend email configuration is missing.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}.`);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userRow } = await supabase.from("users").select("user_type").eq("id", user.id).maybeSingle();
  if (userRow?.user_type !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { jobId?: string | number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (body.jobId === undefined || body.jobId === null || String(body.jobId).length > 100) {
    return NextResponse.json({ error: "A valid jobId is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("id,title,specialization_id,status,external_apply_url,employer_profiles(company_name),specializations(name)")
    .eq("id", body.jobId)
    .maybeSingle();
  if (jobError) return NextResponse.json({ error: "Could not load job." }, { status: 500 });
  if (!job || job.status !== "live") return NextResponse.json({ error: "Only live jobs can trigger notifications." }, { status: 400 });
  if (!job.specialization_id) return NextResponse.json({ sent: 0, skipped: 0, reason: "Job has no specialization." });

  const { data: completions, error: completionError } = await admin
    .from("nurse_course_completions")
    .select("nurse_id,courses!inner(specialization_id)")
    .eq("status", "completed");
  if (completionError) return NextResponse.json({ error: "Could not load eligible learners." }, { status: 500 });

  const eligibleNurseIds = Array.from(new Set((completions || []).filter((row: any) => {
    const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    return course?.specialization_id === job.specialization_id;
  }).map((row: any) => row.nurse_id).filter(Boolean)));
  if (!eligibleNurseIds.length) return NextResponse.json({ sent: 0, skipped: 0, reason: "No eligible learners for this specialization." });

  const { data: profiles, error: profilesError } = await admin
    .from("nurse_profiles")
    .select("id,user_id,users(full_name)")
    .in("id", eligibleNurseIds);
  if (profilesError) return NextResponse.json({ error: "Could not load learner profiles." }, { status: 500 });

  const employer = Array.isArray((job as any).employer_profiles) ? (job as any).employer_profiles[0] : (job as any).employer_profiles;
  const specialization = Array.isArray((job as any).specializations) ? (job as any).specializations[0] : (job as any).specializations;
  let sent = 0, skipped = 0, failed = 0;

  for (const profile of profiles || []) {
    if (!profile.user_id) { skipped++; continue; }
    const { data: previous, error: previousError } = await admin
      .from("opportunity_email_events")
      .select("status")
      .eq("job_id", String(job.id))
      .eq("user_id", profile.user_id)
      .maybeSingle();
    if (previousError) { failed++; console.error("Could not check opportunity email event", previousError); continue; }
    if (previous?.status === "sent") { skipped++; continue; }

    const { error: reserveError } = await admin.from("opportunity_email_events").upsert({
      job_id: String(job.id), user_id: profile.user_id, status: "processing", updated_at: new Date().toISOString(),
    }, { onConflict: "job_id,user_id" });
    if (reserveError) { failed++; console.error("Could not reserve opportunity email event", reserveError); continue; }

    try {
      const { data: authResult, error: authError } = await admin.auth.admin.getUserById(profile.user_id);
      const email = authResult?.user?.email;
      if (authError || !email) throw new Error("Learner has no registered email address.");
      const userData = Array.isArray((profile as any).users) ? (profile as any).users[0] : (profile as any).users;
      const learnerName = userData?.full_name || "there";
      await sendEmail(email,
        `A new ${specialization?.name || "career"} opportunity is available | Carinex`,
        `Hello ${learnerName},

A new opportunity matching a specialization you completed is now available on Carinex.

Role: ${job.title}
Employer: ${employer?.company_name || "Employer"}
Specialization: ${specialization?.name || "Your specialization"}

Review the opportunity and eligibility details here:
${process.env.NEXT_PUBLIC_SITE_URL || "https://www.carinex.info"}/dashboard/opportunities

Application link: ${job.external_apply_url || "Open the opportunity from your dashboard."}

You are receiving this notification because you completed a course in the matching specialization.

Carinex Notifications`);
      await admin.from("opportunity_email_events").update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("job_id", String(job.id)).eq("user_id", profile.user_id);
      sent++;
    } catch (error) {
      failed++;
      await admin.from("opportunity_email_events").update({ status: "failed", updated_at: new Date().toISOString() }).eq("job_id", String(job.id)).eq("user_id", profile.user_id);
      console.error("Opportunity notification failed", profile.user_id, error);
    }
  }

  return NextResponse.json({ sent, skipped, failed, eligible: profiles?.length || 0 });
}
