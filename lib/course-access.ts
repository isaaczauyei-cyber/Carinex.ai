import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function requireCourseApproval(userId: string, courseId: number) {
  if (courseId !== 23) return;

  const admin = createAdminClient();

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
