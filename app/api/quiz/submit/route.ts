import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasPassedEveryModule } from "@/lib/course-content";
import { requireCourseApproval } from "@/lib/course-access";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const { courseId, moduleId, answers } = await request.json();
  if (!courseId || !moduleId || !answers) return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("nurse_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Nurse profile not found." }, { status: 403 });

  await requireCourseApproval(user.id, Number(courseId));

  const { data: courseModule } = await admin
    .from("course_modules")
    .select("id, course_id, quiz_passing_score")
    .eq("id", moduleId)
    .eq("course_id", Number(courseId))
    .maybeSingle();
  if (!courseModule) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  const { data: questions } = await admin
    .from("assessment_questions")
    .select("id, correct_option_id, points")
    .eq("module_id", moduleId);
  if (!questions || questions.length === 0) return NextResponse.json({ error: "Quiz not found." }, { status: 404 });

  const totalPoints = questions.reduce((sum, q) => sum + Number(q.points || 1), 0);
  const earnedPoints = questions.reduce((sum, q) => {
    const submitted = answers[q.id];
    return submitted === q.correct_option_id ? sum + Number(q.points || 1) : sum;
  }, 0);
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= (courseModule.quiz_passing_score || 70);

  const { error: attemptError } = await admin.from("nurse_quiz_attempts").insert({
    nurse_id: profile.id, course_id: Number(courseId), module_id: moduleId, score, passed, attempted_at: new Date().toISOString(),
  });
  if (attemptError) return NextResponse.json({ error: attemptError.message }, { status: 400 });

  let courseCompleted = false;
  if (passed) {
    courseCompleted = await hasPassedEveryModule(profile.id, Number(courseId));
    if (courseCompleted) {
      await admin.from("nurse_course_completions").upsert({ nurse_id: profile.id, course_id: Number(courseId), status: "completed", completed_at: new Date().toISOString() }, { onConflict: "nurse_id,course_id" });
    }
  }

  return NextResponse.json({ score, passed, courseCompleted });
}
