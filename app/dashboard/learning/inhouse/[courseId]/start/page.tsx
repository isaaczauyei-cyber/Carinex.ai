import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCourseStructure, getProgress, flattenSequence } from "@/lib/course-content";

export default async function StartCoursePage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");

  const courseId = Number(params.courseId);
  const structure = await getCourseStructure(courseId);
  const { completedLessonIds, passedModuleIds } = await getProgress(profile.id, courseId);
  const sequence = flattenSequence(structure);

  const firstUnfinished = sequence.find((s) =>
    s.type === "lesson" ? !completedLessonIds.has(s.id) : !passedModuleIds.has(s.id)
  );
  const target = firstUnfinished || sequence[0];

  if (!target) redirect("/dashboard/learning");

  redirect(
    target.type === "lesson"
      ? `/dashboard/learning/inhouse/${courseId}/lesson/${target.id}`
      : `/dashboard/learning/inhouse/${courseId}/quiz/${target.moduleId}`
  );
}
