import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCourseApproval } from "@/lib/course-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseStructure, getProgress } from "@/lib/course-content";
import CoursePlayerHeader from "@/components/CoursePlayerHeader";
import QuizForm from "@/components/QuizForm";

export default async function ModuleQuizPage({
  params,
}: {
  params: { courseId: string; moduleId: string };
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

  const { data: course } = await admin.from("courses").select("title").eq("id", courseId).maybeSingle();
  const { data: courseModule } = await admin
    .from("course_modules")
    .select("id, title, quiz_passing_score")
    .eq("id", params.moduleId)
    .maybeSingle();
  if (!course || !courseModule) notFound();

  const { data: questions } = await admin
    .from("assessment_questions")
    .select("id, prompt, options")
    .eq("module_id", params.moduleId)
    .order("order_index");

  const safeQuestions = (questions || []).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: (q.options || []) as { id: string; text: string }[],
  }));

  const structure = await getCourseStructure(courseId);
  const { completedSectionIds, passedModuleIds } = await getProgress(profile.id, courseId);

  return (
    <main className="min-h-screen bg-white">
      <CoursePlayerHeader
        courseTitle={course.title}
        courseId={courseId}
        structure={structure}
        completedSectionIds={completedSectionIds}
        passedModuleIds={passedModuleIds}
        currentQuizModuleId={courseModule.id}
      />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Quiz</span>
        <h1 className="mt-1 text-2xl font-bold text-carinex-navy">{courseModule.title}</h1>
        <p className="mt-2 text-carinex-navy/70">
          You need {courseModule.quiz_passing_score}% or higher to pass.
        </p>

        <div className="mt-8">
          <QuizForm
            nurseId={profile.id}
            courseId={courseId}
            moduleId={courseModule.id}
            questions={safeQuestions}
          />
        </div>
      </div>
    </main>
  );
}
