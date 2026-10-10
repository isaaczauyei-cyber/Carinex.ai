import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    admin.from("courses").select("id, is_in_house, is_published, is_free, price_course_only, price_course_plus_guide").eq("id", courseId).maybeSingle(),
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
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: "Could not verify your enrollment. Please try again." }, { status: 500 });

  if (!existingEnrollment) {
    // course_enrollments.payment_id is NOT NULL. Free enrollment gets a linked
    // zero-value payment record; it never calls Paystack or the paid finalizer.
    const { data: freePayment, error: paymentError } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        type: "course_purchase",
        amount: 0,
        currency: "NGN",
        paystack_ref: null,
        status: "success",
      })
      .select("id")
      .single();

    if (paymentError || !freePayment) {
      console.error("Free course payment record insert failed", paymentError);
      return NextResponse.json({ error: "Could not create free course access. Please try again." }, { status: 500 });
    }

    const { error: enrollmentError } = await admin.from("course_enrollments").insert({
      user_id: user.id,
      course_id: courseId,
      payment_id: freePayment.id,
      package_type: "course_only",
      has_interview_guide: false,
      status: "approved",
      review_status: "resolved",
      review_note: "Automatically approved: free in-house course.",
    });
    if (enrollmentError) {
      // Avoid leaving an orphaned zero-value payment if enrollment creation fails.
      await admin.from("payments").delete().eq("id", freePayment.id);
      console.error("Free course enrollment insert failed", enrollmentError);
      return NextResponse.json({ error: "Could not create course access. Please try again." }, { status: 500 });
    }
  } else if (existingEnrollment.status !== "approved") {
    return NextResponse.json({ error: "An existing enrollment is awaiting review. Please contact support before trying again." }, { status: 409 });
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
