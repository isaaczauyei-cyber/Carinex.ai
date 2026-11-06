import { requireAdminWithService } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import EnrollmentReviewActions from "@/components/EnrollmentReviewActions";
import AdminTabs from "@/components/AdminTabs";

// Always read fresh rows. Without this, Next.js can serve an older copy of the
// list, so new trial sign-ups do not appear.
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  user_id: string;
  course_id: number;
  package_type: string;
  status: string;
  review_status: string | null;
  created_at: string;
  review_note: string | null;
  access_type: string | null;
  trial_expires_at: string | null;
  courses: { title: string } | null;
};

export default async function AdminEnrollmentsPage() {
  const { adminClient } = await requireAdminWithService(["financial"]);
  const { data } = await adminClient
    .from("course_enrollments")
    .select("id, user_id, course_id, package_type, status, review_status, created_at, review_note, access_type, trial_expires_at, courses(title)")
    .order("created_at", { ascending: false });
  const rows = (data || []) as unknown as Row[];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: users } = userIds.length
    ? await adminClient.from("users").select("id, full_name, phone").in("id", userIds)
    : { data: [] };
  const userMap = new Map((users || []).map((u) => [u.id, u]));

  const now = Date.now();
  const trials = rows.filter((r) => r.access_type === "trial");
  const paid = rows.filter((r) => r.access_type !== "trial");
  const activeTrials = trials.filter((r) => r.trial_expires_at && new Date(r.trial_expires_at).getTime() > now);

  function Card({ r }: { r: Row }) {
    const u = userMap.get(r.user_id);
    const isTrial = r.access_type === "trial";
    const expired = isTrial && r.trial_expires_at ? new Date(r.trial_expires_at).getTime() <= now : false;
    return (
      <article className="rounded-xl border border-carinex-navy/10 p-5">
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            <h2 className="font-bold text-carinex-navy">{u?.full_name || "Nurse"}</h2>
            <p className="text-sm text-carinex-navy/60">
              {u?.phone || "No phone"} · {r.courses?.title || `Course #${r.course_id}`} ·{" "}
              {isTrial ? "Free trial" : r.package_type === "course_plus_guide" ? "Course + interview guide" : "Course only"}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            {isTrial && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${expired ? "bg-amber-100 text-amber-900" : "bg-carinex-emerald/10 text-carinex-emerald"}`}>
                {expired ? "Trial expired" : "Trial active"}
              </span>
            )}
            <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold">{r.status.replaceAll("_", " ")}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-carinex-navy/50">
          Created {new Date(r.created_at).toLocaleString("en-NG")}
          {isTrial && r.trial_expires_at ? ` · Trial ends ${new Date(r.trial_expires_at).toLocaleString("en-NG")}` : ""}
        </p>
        {r.review_note && <p className="mt-2 text-sm">Note: {r.review_note}</p>}
        {!isTrial && <EnrollmentReviewActions enrollmentId={r.id} status={r.status} />}
      </article>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-carinex-navy">Enrolments</h1>
        <p className="mt-2 text-sm text-carinex-navy/60">
          Review verified payments and manually approve or reject course access. Free trials are listed separately below.
        </p>
        <AdminTabs />

        <h2 className="mt-8 text-lg font-bold text-carinex-navy">Paid enrolments ({paid.length})</h2>
        <div className="mt-4 flex flex-col gap-4">
          {paid.map((r) => <Card key={r.id} r={r} />)}
          {paid.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-carinex-navy/60">No paid enrolments yet.</p>}
        </div>

        <h2 className="mt-10 text-lg font-bold text-carinex-navy">
          Free trials ({trials.length}, {activeTrials.length} active)
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {trials.map((r) => <Card key={r.id} r={r} />)}
          {trials.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-carinex-navy/60">No trial sign-ups yet.</p>}
        </div>
      </section>
    </main>
  );
}
