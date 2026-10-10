import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireCourseApproval(userId: string, courseId: number) {
  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("id, is_in_house, is_published, is_free, price_course_only")
    .eq("id", courseId)
    .maybeSingle();

  if (!course || course.is_in_house !== true || course.is_published !== true) {
    redirect("/dashboard/learning");
  }

  const { data: enrollment } = await admin
    .from("course_enrollments")
    .select("id, status, payment_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment) redirect(`/courses/${courseId}?access=pending`);

  const courseIsCurrentlyPaid = course.is_free !== true && Number(course.price_course_only || 0) > 0;
  if (courseIsCurrentlyPaid) {
    const { data: payment } = await admin
      .from("payments")
      .select("amount, status")
      .eq("id", enrollment.payment_id)
      .maybeSingle();

    // Free enrollment is not a paid entitlement. Require a successful positive-value payment.
    if (!payment || payment.status !== "success" || Number(payment.amount) <= 0) {
      redirect(`/courses/${courseId}?access=payment_required`);
    }
  }
}
