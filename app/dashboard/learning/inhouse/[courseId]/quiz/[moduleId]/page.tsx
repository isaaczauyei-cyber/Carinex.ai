import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCourseApproval } from "@/lib/course-access";
import QuizForm from "@/components/QuizForm";

export default async function ModuleQuizPage({ params }: { params: { courseId: string; moduleId: string } }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("nurse_profiles").select("id").eq("user_id", user.id).maybeSingle(); if (!profile) redirect("/onboarding");
  const courseId = Number(params.courseId); await requireCourseApproval(user.id, courseId); const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("title").eq("id", courseId).maybeSingle();
  const { data: courseModule } = await admin.from("course_modules").select("id, title, quiz_passing_score, order_index").eq("id", params.moduleId).eq("course_id", courseId).maybeSingle(); if (!course || !courseModule) notFound();
  const { data: assessmentQuestions } = await admin.from("assessment_questions").select("id, prompt, options, order_index").eq("module_id", params.moduleId).order("order_index");
  const safeQuestions = (assessmentQuestions || []).map((q) => ({ id: q.id, prompt: q.prompt, options: Array.isArray(q.options) ? q.options.map((o: any) => ({ id: String(o.id), text: String(o.text || "") })) : [] }));
  return <main><section className="mx-auto max-w-2xl px-6 py-10"><Link href={`/dashboard/learning/inhouse/${courseId}/start`} className="text-sm font-semibold text-carinex-emerald hover:underline">← Course</Link><span className="mt-6 block text-xs font-semibold uppercase tracking-wide text-carinex-emerald">Module {courseModule.order_index} quiz</span><h1 className="mt-2 text-3xl font-bold text-carinex-navy">{courseModule.title}</h1><p className="mt-2 text-carinex-navy/70">You need {courseModule.quiz_passing_score ?? 70}% or higher to pass.</p>{safeQuestions.length ? <div className="mt-8"><QuizForm nurseId={profile.id} courseId={courseId} moduleId={courseModule.id} questions={safeQuestions} /></div> : <div className="mt-8 rounded-xl border border-dashed border-carinex-navy/20 p-8 text-center"><p className="font-semibold text-carinex-navy">No quiz has been added to this module yet.</p><Link href={`/dashboard/learning/inhouse/${courseId}/start`} className="mt-4 inline-block text-sm font-semibold text-carinex-emerald">Return to course →</Link></div>}</section></main>;
}
