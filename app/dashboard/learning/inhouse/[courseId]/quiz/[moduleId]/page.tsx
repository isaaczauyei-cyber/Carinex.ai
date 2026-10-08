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
  params: {
    courseId: string;
    moduleId: string;
  };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  const courseId = Number(params.courseId);

  if (!Number.isInteger(courseId) || courseId <= 0) {
    notFound();
  }

  await requireCourseApproval(user.id, courseId);

  const admin = createAdminClient();

  /*
   * Get the course first.
   */
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, is_in_house, is_published")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) {
    notFound();
  }

  /*
   * Get the module ONLY if it belongs to this course.
   *
   * This prevents a module from another course being treated
   * as part of the current learner's course.
   */
  const { data: courseModule, error: moduleError } = await admin
    .from("course_modules")
    .select("id, course_id, title, quiz_passing_score")
    .eq("id", params.moduleId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (moduleError || !courseModule) {
    notFound();
  }

  /*
   * Only modules that actually contain assessment questions
   * should open the quiz page.
   */
  const { data: questions, error: questionsError } = await admin
    .from("assessment_questions")
    .select("id, prompt, options")
    .eq("module_id", courseModule.id)
    .order("order_index");

  if (questionsError) {
    console.error("Quiz questions error:", questionsError.message);
    notFound();
  }

  if (!questions || questions.length === 0) {
    notFound();
  }

  const safeQuestions = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: (question.options || []) as {
      id: string;
      text: string;
    }[],
  }));

  /*
   * Build the course TOC using the authenticated learner's
   * own progress.
   */
  const structure = await getCourseStructure(courseId);

  const { completedSectionIds, passedModuleIds } = await getProgress(
    profile.id,
    courseId
  );

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
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Quiz
        </span>

        <h1 className="mt-1 text-2xl font-bold text-carinex-navy">
          {courseModule.title}
        </h1>

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
