import { createAdminClient } from "@/lib/supabase/admin";

export type SectionSummary = {
  id: string;
  title: string;
  order_index: number;
  section_type: string;
  is_required: boolean;
  is_graded: boolean;
};

export type ModuleSummary = {
  id: string;
  title: string;
  order_index: number;
  quiz_passing_score: number;
  sections: SectionSummary[];
  hasQuiz: boolean;
};

export async function getCourseStructure(courseId: number) {
  const admin = createAdminClient();

  const { data: modules } = await admin
    .from("course_modules")
    .select("id, title, order_index, quiz_passing_score")
    .eq("course_id", courseId)
    .order("order_index");

  const moduleIds = (modules || []).map((m) => m.id);

  if (!moduleIds.length) {
    return [];
  }

  /*
   * Sections and quiz information are independent.
   * Fetch them together.
   */
  const [{ data: sections }, { data: quizModuleIds }] =
    await Promise.all([
      admin
        .from("module_sections")
        .select(
          "id, title, order_index, module_id, section_type, is_required, is_graded"
        )
        .in("module_id", moduleIds)
        .order("order_index"),

      admin
        .from("assessment_questions")
        .select("module_id")
        .in("module_id", moduleIds),
    ]);

  const modulesWithQuiz = new Set(
    (quizModuleIds || []).map((q) => q.module_id)
  );

  /*
   * Group sections once rather than repeatedly filtering
   * the entire sections array for every module.
   */
  const sectionsByModule = new Map<string, SectionSummary[]>();

  for (const section of sections || []) {
    const existing = sectionsByModule.get(section.module_id) || [];

    existing.push({
      id: section.id,
      title: section.title,
      order_index: section.order_index,
      section_type: section.section_type,
      is_required: section.is_required,
      is_graded: section.is_graded,
    });

    sectionsByModule.set(section.module_id, existing);
  }

  return (modules || []).map((module) => ({
    id: module.id,
    title: module.title,
    order_index: module.order_index,
    quiz_passing_score: module.quiz_passing_score,
    sections: sectionsByModule.get(module.id) || [],
    hasQuiz: modulesWithQuiz.has(module.id),
  }));
}

export async function getProgress(
  nurseId: string,
  courseId: number
) {
  const admin = createAdminClient();

  /*
   * Section IDs and quiz attempts are independent.
   */
  const [{ data: sectionRows }, { data: quizAttempts }] =
    await Promise.all([
      admin
        .from("module_sections")
        .select("id, course_modules!inner(course_id)")
        .eq("course_modules.course_id", courseId),

      admin
        .from("nurse_quiz_attempts")
        .select("module_id, passed")
        .eq("nurse_id", nurseId)
        .eq("course_id", courseId),
    ]);

  const sectionIds = (sectionRows || []).map((s) => s.id);

  /*
   * Only run the progress query if this course actually
   * contains sections.
   */
  const { data: progressRows } = sectionIds.length
    ? await admin
        .from("nurse_section_progress")
        .select("section_id, status")
        .eq("nurse_id", nurseId)
        .in("section_id", sectionIds)
    : { data: [] };

  return {
    completedSectionIds: new Set(
      (progressRows || [])
        .filter((p) => p.status === "completed")
        .map((p) => p.section_id)
    ),

    passedModuleIds: new Set(
      (quizAttempts || [])
        .filter((a) => a.passed)
        .map((a) => a.module_id)
    ),
  };
}

export function flattenSequence(
  structure: ModuleSummary[]
) {
  const sequence: {
    type: "section" | "quiz";
    id: string;
    moduleId: string;
  }[] = [];

  for (const mod of structure) {
    for (const section of mod.sections) {
      sequence.push({
        type: "section",
        id: section.id,
        moduleId: mod.id,
      });
    }

    if (mod.hasQuiz) {
      sequence.push({
        type: "quiz",
        id: mod.id,
        moduleId: mod.id,
      });
    }
  }

  return sequence;
}

export async function hasPassedEveryModule(
  nurseId: string,
  courseId: number
) {
  const admin = createAdminClient();

  /*
   * These are independent.
   */
  const [{ data: modules }, { data: passedAttempts }] =
    await Promise.all([
      admin
        .from("course_modules")
        .select("id")
        .eq("course_id", courseId),

      admin
        .from("nurse_quiz_attempts")
        .select("module_id")
        .eq("nurse_id", nurseId)
        .eq("course_id", courseId)
        .eq("passed", true),
    ]);

  if (!modules || modules.length === 0) {
    return false;
  }

  const passedModuleIds = new Set(
    (passedAttempts || []).map((attempt) => attempt.module_id)
  );

  return modules.every((module) =>
    passedModuleIds.has(module.id)
  );
}
