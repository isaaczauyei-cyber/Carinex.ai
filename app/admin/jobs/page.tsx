import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminJobsPage() {
  const supabase = await requireAdmin();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, status, posted_at, employer_profiles(company_name), specializations(name)")
    .order("posted_at", { ascending: false });

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-carinex-navy">Jobs</h1>
          <Link
            href="/admin/jobs/new"
            className="rounded-full bg-carinex-emerald px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-carinex-emerald/90"
          >
            + Add job
          </Link>
        </div>

        <AdminTabs />

        <div className="mt-8 flex flex-col divide-y divide-carinex-navy/10 rounded-xl border border-carinex-navy/10">
          {(jobs || []).map((j) => {
            const employer = j.employer_profiles as unknown as { company_name: string } | null;
            const spec = j.specializations as unknown as { name: string } | null;
            return (
              <div key={j.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-semibold text-carinex-navy">{j.title}</p>
                  <p className="text-sm text-carinex-navy/50">
                    {employer?.company_name || "Unknown employer"}
                    {spec?.name ? ` · ${spec.name}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    j.status === "open"
                      ? "bg-carinex-emerald/10 text-carinex-emerald"
                      : j.status === "pending_review"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-carinex-navy/5 text-carinex-navy/50"
                  }`}
                >
                  {j.status}
                </span>
              </div>
            );
          })}
          {(!jobs || jobs.length === 0) && (
            <p className="px-5 py-8 text-center text-sm text-carinex-navy/50">
              No jobs yet — click &quot;Add job&quot; to create your first one.
            </p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
