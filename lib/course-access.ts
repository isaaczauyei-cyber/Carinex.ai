import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireCourseApproval(userId: string, courseId: number) {
  const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("id, is_in_house, is_published").eq("id", courseId).maybeSingle();
  if (!course) redirect("/dashboard/learning");

  if (course.is_in_house && course.is_published !== true) {
    redirect("/dashboard/learning?course=unavailable");
  }

  if (courseId !== 23) return;

  const { data } = await admin
    .from("course_enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  if (!data) redirect("/courses/23?access=pending");
}
