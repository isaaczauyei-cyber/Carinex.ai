import { createAdminClient } from "@/lib/supabase/admin";

export type LessonSummary = { id: string; title: string; order_index: number };
export type ModuleSummary = {
  id: string;
  title: string;
  order_index: number;
  quiz_passing_score: number;
  lessons: LessonSummary[];
  hasQuiz: boolean;
};

export async function getCourseStructure(courseId: number) {
  const admin = createAdminClient();

  const { data: modules } = await admin
    .from("course_modules")
    .select("id, title, order_index, quiz_passing_score")
    .eq("course_id", courseId)
    .order("order_index");

  const { data: lessons } = await admin
    .from("course_lessons")
    .select("id, title, order_index, module_id")
    .eq("course_id", courseId)
    .order("order_index");

  const { data: quizModuleIds } = await admin
    .from("course_quiz_questions")
    .select("module_id")
    .in("module_id", (modules || []).map((m) => m.id));

  const modulesWithQuiz = new Set((quizModuleIds || []).map((q) => q.module_id));

  const structure: ModuleSummary[] = (modules || []).map((m) => ({
    id: m.id,
    title: m.title,
    order_index: m.order_index,
    quiz_passing_score: m.quiz_passing_score,
    lessons: (lessons || [])
      .filter((l) => l.module_id === m.id)
      .map((l) => ({ id: l.id, title: l.title, order_index: l.order_index })),
    hasQuiz: modulesWithQuiz.has(m.id),
  }));

  return structure;
}

export async function getProgress(nurseId: string, courseId: number) {
  const admin = createAdminClient();

  const { data: lessonRows } = await admin
    .from("course_lessons")
    .select("id, course_modules!inner(course_id)")
    .eq("course_modules.course_id", courseId);

  const lessonIds = (lessonRows || []).map((l) => l.id);

  const { data: completions } = lessonIds.length
    ? await admin
        .from("nurse_lesson_completions")
        .select("lesson_id")
        .eq("nurse_id", nurseId)
        .in("lesson_id", lessonIds)
    : { data: [] };

  const { data: quizAttempts } = await admin
    .from("nurse_quiz_attempts")
    .select("module_id, passed")
    .eq("nurse_id", nurseId)
    .eq("course_id", courseId);

  return {
    completedLessonIds: new Set((completions || []).map((c) => c.lesson_id)),
    passedModuleIds: new Set(
      (quizAttempts || []).filter((a) => a.passed).map((a) => a.module_id)
    ),
  };
}

// Builds a single ordered sequence across all modules — lesson, lesson,
// quiz, lesson, lesson, quiz — so "next" always has one clear meaning.
export function flattenSequence(structure: ModuleSummary[]) {
  const sequence: { type: "lesson" | "quiz"; id: string; moduleId: string }[] = [];
  for (const mod of structure) {
    for (const lesson of mod.lessons) {
      sequence.push({ type: "lesson", id: lesson.id, moduleId: mod.id });
    }
    if (mod.hasQuiz) {
      sequence.push({ type: "quiz", id: mod.id, moduleId: mod.id });
    }
  }
  return sequence;
}
