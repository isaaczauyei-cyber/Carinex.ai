import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasPassedEveryModule } from "@/lib/course-content";
import { requireCourseApproval } from "@/lib/course-access";

async function sendCourseCompletionEmail(args: {
  nurseId: string;
  courseId: number;
  email: string;
  courseTitle: string;
}) {
  const admin = createAdminClient();

  // A unique row per learner/course prevents repeated quiz submissions from
  // sending the same completion email again.
  const { data: existing, error: lookupError } = await admin
    .from("course_completion_email_events")
    .select("id,status")
    .eq("nurse_id", args.nurseId)
    .eq("course_id", args.courseId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing?.status === "sent" || existing?.status === "pending") return;

  if (existing?.id) {
    const { error } = await admin
      .from("course_completion_email_events")
      .update({ status: "pending", error_message: null })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("course_completion_email_events").insert({
      nurse_id: args.nurseId,
      course_id: args.courseId,
      email: args.email,
      status: "pending",
    });
    // A concurrent request may have inserted the unique row first.
    if (error) {
      if (error.code === "23505") return;
      throw error;
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    await admin.from("course_completion_email_events")
      .update({ status: "failed", error_message: "RESEND_API_KEY or EMAIL_FROM is not configured" })
      .eq("nurse_id", args.nurseId).eq("course_id", args.courseId);
    throw new Error("Email service is not configured");
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.carinex.info").replace(/\/$/, "");
  const safeTitle = args.courseTitle.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [args.email],
      subject: `Congratulations on completing ${args.courseTitle} | Carinex`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:600px;margin:auto"><h1 style="color:#087f70">Congratulations!</h1><p>You have successfully completed <strong>${safeTitle}</strong> on Carinex.</p><p>Thank you for learning with us. You can return to your learning dashboard to review your courses and next steps.</p><p style="margin:28px 0"><a href="${siteUrl}/dashboard/learning" style="background:#087f70;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Open learning dashboard</a></p><p>Keep learning and growing with Carinex.</p><p>Carinex Notifications</p></div>`,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof result?.message === "string" ? result.message : `Resend returned HTTP ${response.status}`;
    await admin.from("course_completion_email_events")
      .update({ status: "failed", error_message: message })
      .eq("nurse_id", args.nurseId).eq("course_id", args.courseId);
    throw new Error(message);
  }

  const { error: updateError } = await admin.from("course_completion_email_events")
    .update({ status: "sent", resend_id: result?.id || null, sent_at: new Date().toISOString(), error_message: null })
    .eq("nurse_id", args.nurseId).eq("course_id", args.courseId);
  if (updateError) throw updateError;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const { courseId, moduleId, answers } = await request.json();
  if (!courseId || !moduleId || !answers) return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

  const numericCourseId = Number(courseId);
  if (!Number.isSafeInteger(numericCourseId) || numericCourseId <= 0) return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("nurse_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Nurse profile not found." }, { status: 403 });

  await requireCourseApproval(user.id, numericCourseId);

  const { data: courseModule } = await admin
    .from("course_modules")
    .select("id, course_id, quiz_passing_score")
    .eq("id", moduleId)
    .eq("course_id", numericCourseId)
    .maybeSingle();
  if (!courseModule) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  const { data: questions } = await admin
    .from("assessment_questions")
    .select("id, correct_option_id, points")
    .eq("module_id", moduleId);
  if (!questions || questions.length === 0) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  const totalPoints = questions.reduce((sum, q) => sum + Number(q.points || 1), 0);
  const earnedPoints = questions.reduce((sum, q) => {
    const submitted = answers[q.id];
    return submitted === q.correct_option_id ? sum + Number(q.points || 1) : sum;
  }, 0);
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= (courseModule.quiz_passing_score || 70);

  const { error: attemptError } = await admin.from("nurse_quiz_attempts").insert({
    nurse_id: profile.id, course_id: numericCourseId, module_id: moduleId, score, passed, attempted_at: new Date().toISOString(),
  });
  if (attemptError) return NextResponse.json({ error: attemptError.message }, { status: 400 });

  let courseCompleted = false;
  let completionEmailSent = false;
  if (passed) {
    courseCompleted = await hasPassedEveryModule(profile.id, numericCourseId);
    if (courseCompleted) {
      const { data: previousCompletion, error: previousError } = await admin
        .from("nurse_course_completions")
        .select("status")
        .eq("nurse_id", profile.id)
        .eq("course_id", numericCourseId)
        .maybeSingle();
      if (previousError) console.error("Could not check prior course completion", previousError);

      const { error: completionError } = await admin.from("nurse_course_completions").upsert({
        nurse_id: profile.id,
        course_id: numericCourseId,
        status: "completed",
        completed_at: new Date().toISOString(),
      }, { onConflict: "nurse_id,course_id" });
      if (completionError) return NextResponse.json({ error: completionError.message }, { status: 500 });

      // Send only on the transition into completed; a prior completed row is not re-emailed.
      if (previousCompletion?.status !== "completed" && user.email) {
        const { data: course } = await admin.from("courses").select("title").eq("id", numericCourseId).maybeSingle();
        try {
          await sendCourseCompletionEmail({
            nurseId: profile.id,
            courseId: numericCourseId,
            email: user.email,
            courseTitle: course?.title || "your course",
          });
          const { data: event } = await admin.from("course_completion_email_events")
            .select("status").eq("nurse_id", profile.id).eq("course_id", numericCourseId).maybeSingle();
          completionEmailSent = event?.status === "sent";
        } catch (error) {
          console.error("Course completion email failed", error);
          // Completion remains saved even if the notification fails.
        }
      }
    }
  }

  return NextResponse.json({ score, passed, courseCompleted, completionEmailSent });
}
