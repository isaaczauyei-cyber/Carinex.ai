import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireCourseApproval(userId: string, courseId: number) {
  const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("id, is_in_house, is_published").eq("id", courseId).maybeSingle();
  if (!course) redirect("/dashboard/learning");

  if (course.is_in_house && course.is_published === false) {
    redirect(`/courses/${courseId}?access=unpublished`);
  }

  if (course.is_in_house) {
    const { data: enrollment } = await admin
      .from("course_enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();
    if (!enrollment) redirect(`/courses/${courseId}?access=pending`);
  }
}
