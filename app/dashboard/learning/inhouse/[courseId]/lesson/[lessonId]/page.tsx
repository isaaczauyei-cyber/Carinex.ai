import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCourseApproval } from "@/lib/course-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseStructure, getProgress, flattenSequence } from "@/lib/course-content";
import CoursePlayerHeader from "@/components/CoursePlayerHeader";
import LessonActions from "@/components/LessonActions";

export default async function LessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
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
  await requireCourseApproval(user.id, courseId);
  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("title")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) notFound();

  const { data: lesson } = await admin
    .from("course_lessons")
    .select("id, title, content")
    .eq("id", params.lessonId)
    .maybeSingle();
  if (!lesson) notFound();

  const structure = await getCourseStructure(courseId);
  const { completedLessonIds, passedModuleIds } = await getProgress(profile.id, courseId);
  const sequence = flattenSequence(structure);
  const currentIndex = sequence.findIndex((s) => s.type === "lesson" && s.id === lesson.id);
  const next = currentIndex >= 0 ? sequence[currentIndex + 1] : null;

  return (
    <main className="min-h-screen bg-white">
      <CoursePlayerHeader
        courseTitle={course.title}
        courseId={courseId}
        structure={structure}
        completedLessonIds={completedLessonIds}
        passedModuleIds={passedModuleIds}
        currentLessonId={lesson.id}
      />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold text-carinex-navy">{lesson.title}</h1>
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-carinex-navy/80">
          {lesson.content}
        </div>
      </div>

      <LessonActions
        nurseId={profile.id}
        lessonId={lesson.id}
        alreadyCompleted={completedLessonIds.has(lesson.id)}
        nextHref={
          next
            ? next.type === "lesson"
              ? `/dashboard/learning/inhouse/${courseId}/lesson/${next.id}`
              : `/dashboard/learning/inhouse/${courseId}/quiz/${next.moduleId}`
            : `/dashboard/learning`
        }
      />
    </main>
  );
}
