import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCourseEmail } from "@/lib/course-emails";

export async function POST(
  req: NextRequest,
  { params }: { params: { enrollmentId: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  if (userRow?.user_type !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { action?: string; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!( ["approved", "rejected", "under_review"] as string[]).includes(body.action || "")) {
    return NextResponse.json({ error: "Invalid review action" }, { status: 400 });
  }

  const admin = createAdminClient();
  const note = typeof body.note === "string" ? body.note.slice(0, 1000) : null;
  const update = body.action === "under_review"
    ? { review_status: "under_review", review_note: note }
    : {
        status: body.action,
        review_status: body.action === "rejected" ? "pending_review" : "resolved",
        review_note: note,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };

  const { data: enrollment, error } = await admin
    .from("course_enrollments")
    .update(update)
    .eq("id", params.enrollmentId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Could not update course enrollment review", error);
    return NextResponse.json({ error: "Could not update enrolment" }, { status: 500 });
  }
  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  // Send only after the review update succeeds. Under-review updates are not final decisions.
  if (body.action === "approved" || body.action === "rejected") {
    const eventType = body.action === "approved" ? "enrollment_approved" : "enrollment_rejected";
    try {
      const emailResult = await sendCourseEmail(params.enrollmentId, eventType);
      return NextResponse.json({ success: true, emailSent: emailResult.sent, emailDuplicate: Boolean(emailResult.duplicate) });
    } catch (emailError) {
      // Keep the admin's successful decision even if the email provider temporarily fails.
      console.error("Enrollment decision saved, but notification email failed", {
        enrollmentId: params.enrollmentId,
        eventType,
        error: emailError,
      });
      return NextResponse.json({ success: true, emailSent: false, emailError: "Enrollment was updated, but the notification email could not be sent." });
    }
  }

  return NextResponse.json({ success: true });
}
