import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";
import AdminCourseReviewRow from "@/components/AdminCourseReviewRow";

export default async function AdminCourseReviewsPage() {
  const supabase = await requireAdmin();

  const { data: pending } = await supabase
    .from("nurse_course_completions")
    .select("id, proof_doc_url, courses(title), nurse_profiles(nurse_code, users(full_name))")
    .eq("status", "verification_pending")
    .order("id");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">Course Reviews</h1>
        <p className="mt-2 text-carinex-navy/70">
          Certificates submitted by nurses, waiting for approval or rejection.
        </p>

        <AdminTabs />

        <div className="mt-8 flex flex-col gap-4">
          {(!pending || pending.length === 0) && (
            <p className="rounded-xl border border-dashed border-carinex-navy/20 p-8 text-center text-sm text-carinex-navy/50">
              Nothing pending review right now.
            </p>
          )}

          {(pending || []).map((c) => {
            const course = c.courses as unknown as { title: string } | null;
            const nurseProfile = c.nurse_profiles as unknown as {
              nurse_code: string;
              users: { full_name: string } | null;
            } | null;

            return (
              <div key={c.id}>
                <p className="mb-1 text-xs font-mono text-carinex-navy/50">
                  {nurseProfile?.nurse_code} · {nurseProfile?.users?.full_name || "Unnamed"}
                </p>
                <AdminCourseReviewRow
                  completionId={c.id}
                  courseTitle={course?.title || "Course"}
                  proofDocUrl={c.proof_doc_url}
                />
              </div>
            );
          })}
        </div>
      </section>
      <Footer />
    </main>
  );
}
