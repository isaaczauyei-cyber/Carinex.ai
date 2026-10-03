import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminInHouseCoursesPage() {
  const supabase = await requireAdmin();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, specialization_id, specializations(name)")
    .eq("is_in_house", true)
    .order("title");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">In-House Courses</h1>

        <AdminTabs />

        <div className="mt-8 flex flex-col divide-y divide-carinex-navy/10 rounded-xl border border-carinex-navy/10">
          {(courses || []).map((c) => {
            const spec = c.specializations as unknown as { name: string } | null;
            return (
              <Link
                key={c.id}
                href={`/admin/in-house-courses/${c.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-carinex-navy/5"
              >
                <div>
                  <p className="font-semibold text-carinex-navy">{c.title}</p>
                  {spec?.name && <p className="text-sm text-carinex-navy/50">{spec.name}</p>}
                </div>
                <span className="text-carinex-emerald">Edit →</span>
              </Link>
            );
          })}
          {(!courses || courses.length === 0) && (
            <p className="px-5 py-8 text-center text-sm text-carinex-navy/50">No in-house courses yet.</p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
