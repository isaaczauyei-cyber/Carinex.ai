import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import AdminTabs from "@/components/AdminTabs";
import AdminModuleEditor from "@/components/AdminModuleEditor";

export const dynamic = "force-dynamic";

export default async function AdminModulePage({ params }: { params: { courseId: string; moduleId: string } }) {
  const supabase = await requireAdmin();
  const courseId = Number(params.courseId);
  const { data: module } = await supabase.from("course_modules").select("id, course_id, order_index, title, summary, quiz_passing_score").eq("id", params.moduleId).eq("course_id", courseId).maybeSingle();
  if (!module) notFound();
  const [{ data: sections }, { data: questions }] = await Promise.all([
    supabase.from("module_sections").select("id, module_id, order_index, section_type, title, instructions, config, is_required, is_graded").eq("module_id", module.id).order("order_index"),
    supabase.from("assessment_questions").select("id, module_id, order_index, prompt, question_type, options, correct_option_id, points").eq("module_id", module.id).order("order_index"),
  ]);
  return <main><Navbar /><section className="mx-auto max-w-5xl px-6 py-12"><Link href={`/admin/in-house-courses/${courseId}`} className="text-sm font-semibold text-carinex-emerald hover:underline">← Back to course</Link><span className="mt-4 block text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Module {module.order_index}</span><h1 className="mt-1 text-3xl font-bold tracking-tight text-carinex-navy">{module.title}</h1><AdminTabs /><div className="mt-8"><AdminModuleEditor module={module} initialSections={(sections || []) as any} initialQuestions={(questions || []) as any} /></div></section><Footer /></main>;
}
