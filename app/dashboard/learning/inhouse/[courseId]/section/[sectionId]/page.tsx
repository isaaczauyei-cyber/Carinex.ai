import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CourseSessionNavbar from "@/components/CourseSessionNavbar";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCourseApproval } from "@/lib/course-access";
import SectionActions from "@/components/SectionActions";

export default async function CourseSectionPage({ params }: { params: { courseId: string; sectionId: string } }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const { data: profile } = await supabase.from("nurse_profiles").select("id").eq("user_id", user.id).maybeSingle(); if (!profile) redirect("/onboarding");
  const courseId = Number(params.courseId); await requireCourseApproval(user.id, courseId); const admin = createAdminClient();
  const { data: course } = await admin.from("courses").select("id, title").eq("id", courseId).maybeSingle(); if (!course) notFound();
  const { data: section } = await admin.from("module_sections").select("id, module_id, order_index, section_type, title, instructions, config, is_required").eq("id", params.sectionId).maybeSingle(); if (!section) notFound();
  const { data: module } = await admin.from("course_modules").select("id, order_index, title").eq("id", section.module_id).eq("course_id", courseId).maybeSingle(); if (!module) notFound();
  const { data: allModules } = await admin.from("course_modules").select("id, order_index").eq("course_id", courseId).order("order_index");
  const moduleIds = (allModules || []).map((m) => m.id);
  const { data: allSections } = moduleIds.length ? await admin.from("module_sections").select("id, module_id, order_index").in("module_id", moduleIds).order("order_index") : { data: [] };
  const { data: quizQuestions } = await admin.from("assessment_questions").select("id, module_id").in("module_id", moduleIds);
  const { data: progress } = await admin.from("nurse_section_progress").select("section_id, status, submission_text, submission_file_url").eq("nurse_id", profile.id).eq("section_id", section.id).maybeSingle();
  const sequence = (allModules || []).flatMap((m) => [ ...(allSections || []).filter((s) => s.module_id === m.id).sort((a,b) => a.order_index-b.order_index).map((s) => ({ type: "section" as const, id: s.id, moduleId: m.id })), ...((quizQuestions || []).some((q) => q.module_id === m.id) ? [{ type: "quiz" as const, id: m.id, moduleId: m.id }] : []) ]);
  const currentIndex = sequence.findIndex((x) => x.type === "section" && x.id === section.id); const next = currentIndex >= 0 ? sequence[currentIndex + 1] : null;
  const nextHref = next ? next.type === "section" ? `/dashboard/learning/inhouse/${courseId}/section/${next.id}` : `/dashboard/learning/inhouse/${courseId}/quiz/${next.moduleId}` : `/dashboard/learning/inhouse/${courseId}/start`;
  return <main><CourseSessionNavbar courseId={courseId} /><section className="mx-auto max-w-4xl px-6 py-10"><Link href={`/dashboard/learning/inhouse/${courseId}/start`} className="text-sm font-semibold text-carinex-emerald hover:underline">← Course overview</Link><div className="mt-6"><span className="text-xs font-semibold uppercase tracking-wide text-carinex-emerald">{course.title} · Module {module.order_index}</span><h1 className="mt-2 text-3xl font-bold text-carinex-navy">{section.title}</h1>{section.instructions && <p className="mt-3 whitespace-pre-wrap leading-relaxed text-carinex-navy/70">{section.instructions}</p>}</div><div className="mt-8"><SectionActions nurseId={profile.id} section={section} initialProgress={progress as any} nextHref={nextHref} /></div></section></main>;
}
