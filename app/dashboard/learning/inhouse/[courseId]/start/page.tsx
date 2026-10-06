import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCourseApproval } from "@/lib/course-access";

export default async function StartCoursePage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("nurse_profiles").select("id").eq("user_id", user.id).maybeSingle(); if (!profile) redirect("/onboarding");
  const courseId = Number(params.courseId); await requireCourseApproval(user.id, courseId); const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("id, title").eq("id", courseId).maybeSingle(); if (!course) redirect("/dashboard/learning");
  const { data: modules } = await admin.from("course_modules").select("id, title, order_index, quiz_passing_score").eq("course_id", courseId).order("order_index");
  const moduleIds = (modules || []).map((m) => m.id);
  const [{ data: sections }, { data: questions }, { data: progress }, { data: quizAttempts }] = await Promise.all([
    moduleIds.length ? admin.from("module_sections").select("id, module_id, order_index, title, is_required").in("module_id", moduleIds).order("order_index") : Promise.resolve({ data: [] as any[] }),
    moduleIds.length ? admin.from("assessment_questions").select("id, module_id").in("module_id", moduleIds) : Promise.resolve({ data: [] as any[] }),
    admin.from("nurse_section_progress").select("section_id, status").eq("nurse_id", profile.id),
    admin.from("nurse_quiz_attempts").select("module_id, passed").eq("nurse_id", profile.id).eq("course_id", courseId).eq("passed", true),
  ]);
  const doneSections = new Set((progress || []).filter((p) => p.status === "completed").map((p) => p.section_id));
  const passedModules = new Set((quizAttempts || []).map((q) => q.module_id));
  const questionsByModule = new Set((questions || []).map((q) => q.module_id));
  const ordered = (modules || []).flatMap((m) => [
    ...(sections || []).filter((s) => s.module_id === m.id).sort((a, b) => a.order_index - b.order_index).map((s) => ({ type: "section" as const, id: s.id, moduleId: m.id, done: doneSections.has(s.id), required: s.is_required })),
    ...(questionsByModule.has(m.id) ? [{ type: "quiz" as const, id: m.id, moduleId: m.id, done: passedModules.has(m.id), required: true }] : []),
  ]);
  const next = ordered.find((item) => !item.done && item.required) || ordered.find((item) => !item.done);
  if (next) redirect(next.type === "section" ? `/dashboard/learning/inhouse/${courseId}/section/${next.id}` : `/dashboard/learning/inhouse/${courseId}/quiz/${next.moduleId}`);

  const { data: existing } = await admin.from("nurse_course_completions").select("id").eq("nurse_id", profile.id).eq("course_id", courseId).maybeSingle();
  if (existing) await admin.from("nurse_course_completions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", existing.id); else await admin.from("nurse_course_completions").insert({ nurse_id: profile.id, course_id: courseId, status: "completed", completed_at: new Date().toISOString() });
  return <main><Navbar /><section className="mx-auto max-w-2xl px-6 py-24 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-carinex-emerald/10 text-4xl">✓</div><h1 className="mt-5 text-3xl font-bold text-carinex-navy">Course complete! 🎉</h1><p className="mt-3 text-carinex-navy/70">You completed {course.title}. Your matched opportunities can now appear in Opportunity Intelligence.</p><Link href="/dashboard/opportunities" className="mt-7 inline-block rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-white">View opportunities</Link></section></main>;
}
