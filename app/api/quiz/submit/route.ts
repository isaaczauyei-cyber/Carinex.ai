import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { nurseId, courseId, moduleId, answers } = await request.json();

  if (!nurseId || !moduleId || !answers) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: courseModule } = await admin
    .from("course_modules")
    .select("quiz_passing_score")
    .eq("id", moduleId)
    .maybeSingle();

  const { data: questions } = await admin
    .from("course_quiz_questions")
    .select("id, course_quiz_options(id, is_correct)")
    .eq("module_id", moduleId);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  let correctCount = 0;
  for (const q of questions) {
    const submittedOptionId = answers[q.id];
    const correctOption = (q.course_quiz_options || []).find(
      (o: { is_correct: boolean }) => o.is_correct
    );
    if (correctOption && submittedOptionId === (correctOption as { id: string }).id) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / questions.length) * 100);
  const passingScore = courseModule?.quiz_passing_score ?? 70;
  const passed = score >= passingScore;

  await admin.from("nurse_quiz_attempts").insert({ nurse_id: nurseId, course_id: courseId, module_id: moduleId, score, passed });

  // Course-level completion now means: every module's quiz has been passed.
  if (passed) {
    const { data: allModules } = await admin
      .from("course_modules")
      .select("id")
      .eq("course_id", courseId);

    const { data: passedAttempts } = await admin
      .from("nurse_quiz_attempts")
      .select("module_id")
      .eq("nurse_id", nurseId)
      .eq("course_id", courseId)
      .eq("passed", true);

    const passedModuleIds = new Set((passedAttempts || []).map((a) => a.module_id));
    const allPassed = (allModules || []).every((m) => passedModuleIds.has(m.id));

    if (allPassed) {
      const { data: existing } = await admin
        .from("nurse_course_completions")
        .select("id")
        .eq("nurse_id", nurseId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (existing) {
        await admin
          .from("nurse_course_completions")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await admin.from("nurse_course_completions").insert({
          nurse_id: nurseId,
          course_id: courseId,
          status: "completed",
          completed_at: new Date().toISOString(),
        });
      }
    }
  }

  return NextResponse.json({ score, passed });
}
