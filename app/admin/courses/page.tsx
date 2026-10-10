import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";
import AdminCourseReviewRow from "@/components/AdminCourseReviewRow";

export const dynamic = "force-dynamic";

export default async function AdminCourseReviewsPage() {
  const supabase = await requireAdmin(["general_admin"]);

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
        <p className="mt-1 text-sm text-carinex-navy/50">
          External course certificates submitted by nurses, awaiting your review.
        </p>

        <AdminTabs />

        <div className="mt-8 flex flex-col gap-4">
          {(pending || []).map((c) => {
            const course = c.courses as unknown as { title: string } | null;
            const nurse = c.nurse_profiles as unknown as {
              nurse_code: string;
              users: { full_name: string } | null;
            } | null;
            return (
              <div key={c.id}>
                <p className="mb-2 text-xs font-semibold text-carinex-navy/50">
                  {nurse?.nurse_code} · {nurse?.users?.full_name || "Unnamed"}
                </p>
                <AdminCourseReviewRow
                  completionId={c.id}
                  courseTitle={course?.title || "Course"}
                  proofDocUrl={c.proof_doc_url}
                />
              </div>
            );
          })}
          {(!pending || pending.length === 0) && (
            <p className="rounded-xl border border-dashed border-carinex-navy/20 p-8 text-center text-sm text-carinex-navy/50">
              Nothing pending review right now.
            </p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
