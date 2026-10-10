import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminInHouseCoursesPage() {
  const supabase = await requireAdmin(["course_content"]);
  const { data: courses } = await supabase.from("courses")
    .select("id, title, specialization_id, price_course_only, price_course_plus_guide, is_published, specializations(name)")
    .eq("is_in_house", true).order("title");

  return (
    <main><Navbar /><section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-carinex-navy">In-House Courses</h1>
        <Link href="/admin/in-house-courses/new" className="shrink-0 rounded-lg bg-carinex-emerald px-4 py-2 text-sm font-semibold text-white hover:opacity-90">+ Add Course</Link>
      </div>
      <AdminTabs />
      <div className="mt-8 flex flex-col divide-y divide-carinex-navy/10 rounded-xl border border-carinex-navy/10">
        {(courses || []).map((c) => {
          const spec = c.specializations as unknown as { name: string } | null;
          return <Link key={c.id} href={`/admin/in-house-courses/${c.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-carinex-navy/5">
            <div><p className="font-semibold text-carinex-navy">{c.title}</p>{spec?.name && <p className="text-sm text-carinex-navy/50">{spec.name}</p>}{Number(c.price_course_only || 0) > 0 && <p className="text-sm text-carinex-emerald">₦{Number(c.price_course_only).toLocaleString()} {Number(c.price_course_plus_guide || 0) > 0 ? `/ ₦${Number(c.price_course_plus_guide).toLocaleString()} + guide` : ""}</p>}</div>
            <div className="flex shrink-0 items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.is_published ? "bg-carinex-emerald/10 text-carinex-emerald" : "bg-amber-50 text-amber-700"}`}>{c.is_published ? "Published" : "Private"}</span><span className="text-carinex-emerald">Edit →</span></div>
          </Link>;
        })}
        {(!courses || courses.length === 0) && <p className="px-5 py-8 text-center text-sm text-carinex-navy/50">No in-house courses yet.</p>}
      </div>
    </section><Footer /></main>
  );
}
