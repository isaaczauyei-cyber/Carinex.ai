import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";
import Link from "next/link";
import AddModuleButton from "@/components/AddModuleButton";
import InHouseCoursePricingEditor from "@/components/InHouseCoursePricingEditor";
import InHousePublishToggle from "@/components/InHousePublishToggle";

export const dynamic = "force-dynamic";

export default async function AdminCourseModulesPage({ params }: { params: { courseId: string } }) {
  const supabase = await requireAdmin();
  const courseId = Number(params.courseId);

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, price_course_only, price_course_plus_guide, is_published, trial_enabled")
    .eq("id", courseId)
    .maybeSingle();

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, order_index, title, quiz_passing_score")
    .eq("course_id", courseId)
    .order("order_index");

  return <main><Navbar /><section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/admin/in-house-courses" className="text-sm font-semibold text-carinex-emerald hover:underline">← All courses</Link>
    <span className="mt-4 block text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
    <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <h1 className="text-3xl font-bold tracking-tight text-carinex-navy">{course?.title}</h1>
      <div className="flex flex-wrap items-center gap-2"><InHousePublishToggle courseId={courseId} initialPublished={Boolean(course?.is_published)} /><AddModuleButton courseId={courseId} /></div>
    </div>
    <AdminTabs />

    <div className="mt-8">
      <InHouseCoursePricingEditor
        courseId={courseId}
        initialCourseOnly={Number(course?.price_course_only || 0)}
        initialCoursePlusGuide={course?.price_course_plus_guide == null ? null : Number(course.price_course_plus_guide)}
        initialTrialEnabled={Boolean(course?.trial_enabled)}
      />
    </div>

    <div className="mt-8 flex flex-col gap-3">
      {(modules || []).map(m => <Link key={m.id} href={`/admin/in-house-courses/${courseId}/modules/${m.id}`}
        className="flex items-center justify-between rounded-xl border border-carinex-navy/10 p-5 transition hover:border-carinex-emerald/40 hover:shadow-sm">
        <div><p className="text-xs font-semibold text-carinex-navy/40">Module {m.order_index}</p><p className="mt-0.5 font-semibold text-carinex-navy">{m.title}</p></div>
        <span className="text-sm font-semibold text-carinex-emerald">Edit content →</span>
      </Link>)}
      {(!modules || modules.length === 0) && <div className="rounded-xl border border-dashed border-carinex-navy/15 px-5 py-10 text-center">
        <p className="font-semibold text-carinex-navy">No modules yet</p>
        <p className="mt-1 text-sm text-carinex-navy/50">Click “Add Module” to create the first module for this course.</p>
      </div>}
    </div>
  </section><Footer /></main>;
}
