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

  const { data: sections } = moduleIds.length
    ? await admin
        .from("module_sections")
        .select("id, title, order_index, module_id, section_type, is_required, is_graded")
        .in("module_id", moduleIds)
        .order("order_index")
    : { data: [] };

  const { data: quizModuleIds } = moduleIds.length
    ? await admin.from("assessment_questions").select("module_id").in("module_id", moduleIds)
    : { data: [] };

  const modulesWithQuiz = new Set((quizModuleIds || []).map((q) => q.module_id));

  const structure: ModuleSummary[] = (modules || []).map((m) => ({
    id: m.id,
    title: m.title,
    order_index: m.order_index,
    quiz_passing_score: m.quiz_passing_score,
    sections: (sections || [])
      .filter((s) => s.module_id === m.id)
      .map((s) => ({
        id: s.id,
        title: s.title,
        order_index: s.order_index,
        section_type: s.section_type,
        is_required: s.is_required,
        is_graded: s.is_graded,
      })),
    hasQuiz: modulesWithQuiz.has(m.id),
  }));

  return structure;
}

export async function getProgress(nurseId: string, courseId: number) {
  const admin = createAdminClient();

  const { data: sectionRows } = await admin
    .from("module_sections")
    .select("id, course_modules!inner(course_id)")
    .eq("course_modules.course_id", courseId);

  const sectionIds = (sectionRows || []).map((s) => s.id);

  const { data: progressRows } = sectionIds.length
    ? await admin
        .from("nurse_section_progress")
        .select("section_id, status")
        .eq("nurse_id", nurseId)
        .in("section_id", sectionIds)
    : { data: [] };

  const { data: quizAttempts } = await admin
    .from("nurse_quiz_attempts")
    .select("module_id, passed")
    .eq("nurse_id", nurseId)
    .eq("course_id", courseId);

  return {
    completedSectionIds: new Set(
      (progressRows || []).filter((p) => p.status === "completed").map((p) => p.section_id)
    ),
    passedModuleIds: new Set(
      (quizAttempts || []).filter((a) => a.passed).map((a) => a.module_id)
    ),
  };
}

// Builds a single ordered sequence across all modules — section, section,
// quiz, section, section, quiz — so "next" always has one clear meaning.
export function flattenSequence(structure: ModuleSummary[]) {
  const sequence: { type: "section" | "quiz"; id: string; moduleId: string }[] = [];
  for (const mod of structure) {
    for (const section of mod.sections) {
      sequence.push({ type: "section", id: section.id, moduleId: mod.id });
    }
    if (mod.hasQuiz) {
      sequence.push({ type: "quiz", id: mod.id, moduleId: mod.id });
    }
  }
  return sequence;
}
