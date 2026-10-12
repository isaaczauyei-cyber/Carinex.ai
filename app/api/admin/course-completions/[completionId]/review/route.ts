import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest, { params }: { params: { completionId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data: userRow } = await supabase.from("users").select("user_type, admin_role").eq("id", user.id).maybeSingle();
  if (userRow?.user_type !== "admin" || !["general_admin", "course_content"].includes(userRow.admin_role || "general_admin")) {
    return NextResponse.json({ error: "You are not allowed to review course certificates." }, { status: 403 });
  }
  let body: { action?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!["approve", "reject"].includes(body.action || "")) return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });

  const admin = createAdminClient();
  const { data: completion, error: lookupError } = await admin.from("nurse_course_completions")
    .select("id, nurse_id, course_id, proof_doc_url, status, courses(title, provider)")
    .eq("id", params.completionId).maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!completion) return NextResponse.json({ error: "Certificate submission not found." }, { status: 404 });
  if (completion.status !== "verification_pending") return NextResponse.json({ error: "This certificate is no longer pending review." }, { status: 409 });

  const approved = body.action === "approve";
  const reviewedAt = new Date().toISOString();
  const { error: updateError } = await admin.from("nurse_course_completions").update({
    status: approved ? "completed" : "in_progress",
    completed_at: approved ? reviewedAt : null,
  }).eq("id", completion.id);
  if (updateError) return NextResponse.json({ error: `Could not update course completion: ${updateError.message}` }, { status: 500 });

  if (approved) {
    const course = completion.courses as unknown as { title: string; provider: string | null } | null;
    const title = course?.title || "Course certificate";
    const issuer = course?.provider || "External course provider";
    const credentialPath = completion.proof_doc_url ? `storage:course-certificates/${completion.proof_doc_url}` : null;
    const { data: existingCert, error: certLookupError } = await admin.from("nurse_certifications")
      .select("id").eq("nurse_id", completion.nurse_id).eq("title", title).eq("issuing_organization", issuer).maybeSingle();
    if (certLookupError) return NextResponse.json({ error: `Completion approved, but profile certification lookup failed: ${certLookupError.message}` }, { status: 500 });
    const certValues = { nurse_id: completion.nurse_id, title, issuing_organization: issuer, issue_date: reviewedAt.slice(0, 10), credential_url: credentialPath };
    const certResult = existingCert
      ? await admin.from("nurse_certifications").update(certValues).eq("id", existingCert.id)
      : await admin.from("nurse_certifications").insert(certValues);
    if (certResult.error) return NextResponse.json({ error: `Completion approved, but profile certification could not be saved: ${certResult.error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: approved ? "completed" : "in_progress" });
}
