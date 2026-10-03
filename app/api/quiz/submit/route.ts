import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { nurseId, courseId, moduleId, answers } = await request.json();

  if (!nurseId || !courseId || !moduleId || !answers) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: questions } = await admin
    .from("assessment_questions")
    .select("id, correct_option_id, points")
    .eq("module_id", moduleId);

  const { data: courseModule } = await admin
    .from("course_modules")
    .select("quiz_passing_score")
    .eq("id", moduleId)
    .maybeSingle();

  if (!questions || questions.length === 0 || !courseModule) {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  const totalPoints = questions.reduce((sum, q) => sum + Number(q.points || 1), 0);
  const earnedPoints = questions.reduce((sum, q) => {
    const submitted = answers[q.id];
    return submitted === q.correct_option_id ? sum + Number(q.points || 1) : sum;
  }, 0);

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= (courseModule.quiz_passing_score || 70);

  await admin.from("nurse_quiz_attempts").insert({
    nurse_id: nurseId,
    course_id: courseId,
    module_id: moduleId,
    score,
    passed,
    attempted_at: new Date().toISOString(),
  });

  return NextResponse.json({ score, passed });
}
