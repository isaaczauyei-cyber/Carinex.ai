import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireCourseApproval(userId: string, courseId: number) {
  const admin = createAdminClient();
  const [{ data: course }, { data: enrollment }] = await Promise.all([
    admin.from("courses").select("id, is_in_house, trial_enabled").eq("id", courseId).maybeSingle(),
    admin.from("course_enrollments").select("id, status, access_type, trial_expires_at").eq("user_id", userId).eq("course_id", courseId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!course?.is_in_house || !enrollment || enrollment.status !== "approved") {
    redirect(`/courses/${courseId}?access=pending`);
  }
  if (course.trial_enabled === true && enrollment.access_type === "trial" && enrollment.trial_expires_at && new Date(enrollment.trial_expires_at) <= new Date()) {
    redirect(`/courses/${courseId}?access=trial-expired`);
  }
}
