import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";
import Link from "next/link";

export default async function AdminCourseModulesPage({ params }: { params: { courseId: string } }) {
  const supabase = await requireAdmin();
  const courseId = Number(params.courseId);

  const { data: course } = await supabase.from("courses").select("id, title").eq("id", courseId).maybeSingle();

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, order_index, title, quiz_passing_score")
    .eq("course_id", courseId)
    .order("order_index");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/admin/courses" className="text-sm font-semibold text-carinex-emerald hover:underline">
          ← All courses
        </Link>
        <span className="mt-4 block text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-carinex-navy">{course?.title}</h1>

        <AdminTabs />

        <div className="mt-8 flex flex-col gap-3">
          {(modules || []).map((m) => (
            <Link
              key={m.id}
              href={`/admin/courses/${courseId}/modules/${m.id}`}
              className="flex items-center justify-between rounded-xl border border-carinex-navy/10 p-5 transition hover:border-carinex-emerald/40 hover:shadow-sm"
            >
              <div>
                <p className="text-xs font-semibold text-carinex-navy/40">Module {m.order_index}</p>
                <p className="mt-0.5 font-semibold text-carinex-navy">{m.title}</p>
              </div>
              <span className="text-sm font-semibold text-carinex-emerald">Edit content →</span>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
