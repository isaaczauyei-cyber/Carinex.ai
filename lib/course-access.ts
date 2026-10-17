import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function hasAdminCourseAccess(userId: string, courseId: number) {
  const admin = createAdminClient();
  const [{ data: userRow }, { data: grant }] = await Promise.all([
    admin.from("users").select("user_type").eq("id", userId).maybeSingle(),
    admin.from("course_admin_access_grants").select("course_id").eq("course_id", courseId).maybeSingle(),
  ]);
  return userRow?.user_type === "admin" && Boolean(grant);
}

export async function requireCourseApproval(userId: string, courseId: number) {
  const admin = createAdminClient();
  const [{ data: course }, { data: enrollment }, adminCourseAccess] = await Promise.all([
    admin.from("courses").select("id, is_in_house").eq("id", courseId).maybeSingle(),
    admin.from("course_enrollments").select("id, status, access_type, trial_expires_at").eq("user_id", userId).eq("course_id", courseId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    hasAdminCourseAccess(userId, courseId),
  ]);
  if (!course?.is_in_house) redirect(`/courses/${courseId}?access=pending`);
  if (adminCourseAccess) return;
  if (!enrollment || enrollment.status !== "approved") redirect(`/courses/${courseId}?access=pending`);
  if (enrollment.access_type === "trial" && enrollment.trial_expires_at && new Date(enrollment.trial_expires_at) <= new Date()) {
    redirect(`/courses/${courseId}?access=trial-expired`);
  }
}
