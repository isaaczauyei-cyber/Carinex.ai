import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCourseEmail } from "@/lib/course-emails";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to enroll." }, { status: 401 });

  let body: { courseId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const courseId = Number(body.courseId);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return NextResponse.json({ error: "Invalid course." }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: course }] = await Promise.all([
    admin.from("nurse_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    admin.from("courses").select("id, title, is_in_house, is_published, is_free, trial_enabled, price_course_only, price_course_plus_guide").eq("id", courseId).maybeSingle(),
  ]);

  if (!profile) return NextResponse.json({ error: "Complete your nurse profile before enrolling." }, { status: 403 });
  if (!course || course.is_in_house !== true || course.is_published !== true) {
    return NextResponse.json({ error: "This in-house course is not available." }, { status: 404 });
  }

  const coursePrice = Number(course.price_course_only || 0);
  const guidePrice = course.price_course_plus_guide == null ? 0 : Number(course.price_course_plus_guide);
  if (course.is_free !== true && (coursePrice > 0 || guidePrice > 0)) {
    return NextResponse.json({ error: "This course requires payment. Please use the course payment option." }, { status: 400 });
  }

  // The existing access guard requires an approved enrollment record for course 23.
  const { data: existingEnrollment, error: lookupError } = await admin
    .from("course_enrollments")
    .select("id, status, trial_expires_at, access_type")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: "Could not verify your enrollment. Please try again." }, { status: 500 });

  if (!existingEnrollment) {
    const now = new Date();
    const trialEnabled = course.trial_enabled === true;
    const trialExpiresAt = trialEnabled ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
    const { data: createdEnrollment, error: enrollmentError } = await admin.from("course_enrollments").insert({
      user_id: user.id,
      course_id: courseId,
      package_type: "course_only",
      has_interview_guide: false,
      status: "approved",
      review_status: "resolved",
      review_note: trialEnabled ? "Automatically approved: 7-day course trial." : "Automatically approved: permanently free in-house course.",
      access_type: trialEnabled ? "trial" : "free",
      trial_started_at: trialEnabled ? now.toISOString() : null,
      trial_expires_at: trialExpiresAt ? trialExpiresAt.toISOString() : null,
    }).select("id").single();
    if (!enrollmentError && trialEnabled && createdEnrollment) {
      try { await sendCourseEmail(createdEnrollment.id, "trial_started"); }
      catch (emailError) { console.error("Trial-start email failed", emailError); }
    }
    if (enrollmentError) {
      console.error("Free course enrollment insert failed", enrollmentError);
      return NextResponse.json({ error: "Could not create course access. Please try again." }, { status: 500 });
    }
  } else if (existingEnrollment.status !== "approved") {
    return NextResponse.json({ error: "An existing enrollment is awaiting review. Please contact support before trying again." }, { status: 409 });
  } else if (existingEnrollment.access_type === "trial" && existingEnrollment.trial_expires_at && new Date(existingEnrollment.trial_expires_at) <= new Date()) {
    return NextResponse.json({ error: "Your 7-day trial has expired. Purchase this course to regain access." }, { status: 403 });
  }

  const { error: completionError } = await admin.from("nurse_course_completions").upsert(
    { nurse_id: profile.id, course_id: courseId, status: "in_progress" },
    { onConflict: "nurse_id,course_id", ignoreDuplicates: true },
  );
  if (completionError) {
    console.error("Free course progress insert failed", completionError);
    return NextResponse.json({ error: "Enrollment was created, but course progress could not be initialized. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
