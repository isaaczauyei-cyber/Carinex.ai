import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCourseApproval } from "@/lib/course-access";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCourseStructure,
  getProgress,
} from "@/lib/course-content";
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
   * Course and module are independent.
   */
  const [{ data: course }, { data: courseModule }] =
    await Promise.all([
      admin
        .from("courses")
        .select("id, title")
        .eq("id", courseId)
        .maybeSingle(),

      admin
        .from("course_modules")
        .select(
          "id, course_id, title, quiz_passing_score"
        )
        .eq("id", params.moduleId)
        .eq("course_id", courseId)
        .maybeSingle(),
    ]);

  if (!course) {
    notFound();
  }

  if (!courseModule) {
    notFound();
  }

  /*
   * Once we know the module, its questions can be loaded
   * while the learner's TOC/progress is loaded.
   */
  const [
    { data: questions, error: questionsError },
    structure,
    progress,
  ] = await Promise.all([
    admin
      .from("assessment_questions")
      .select("id, prompt, options")
      .eq("module_id", courseModule.id)
      .order("order_index"),

    getCourseStructure(courseId),

    getProgress(profile.id, courseId),
  ]);

  if (questionsError) {
    console.error(
      "Quiz questions error:",
      questionsError.message
    );

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

  const currentModuleIndex = structure.findIndex(
    (module) => module.id === courseModule.id
  );

  if (currentModuleIndex === -1) {
    notFound();
  }

  /*
   * Preserve the existing next-module behavior.
   */
  const nextModule =
    structure[currentModuleIndex + 1];

  let nextHref = "/dashboard/learning";

  if (nextModule) {
    if (nextModule.sections.length > 0) {
      nextHref =
        `/dashboard/learning/inhouse/${courseId}/section/` +
        nextModule.sections[0].id;
    } else if (nextModule.hasQuiz) {
      nextHref =
        `/dashboard/learning/inhouse/${courseId}/quiz/` +
        nextModule.id;
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <CoursePlayerHeader
        courseTitle={course.title}
        courseId={courseId}
        structure={structure}
        completedSectionIds={
          progress.completedSectionIds
        }
        passedModuleIds={
          progress.passedModuleIds
        }
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
          You need {courseModule.quiz_passing_score}% or
          higher to pass.
        </p>

        <div className="mt-8">
          <QuizForm
            nurseId={profile.id}
            courseId={courseId}
            moduleId={courseModule.id}
            questions={safeQuestions}
            nextHref={nextHref}
          />
        </div>
      </div>
    </main>
  );
}
