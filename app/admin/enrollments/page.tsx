import { requireAdminWithService } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import EnrollmentReviewActions from "@/components/EnrollmentReviewActions";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminEnrollmentsPage() {
  const { adminClient } = await requireAdminWithService(["financial"]);
  const { data: rows } = await adminClient.from("course_enrollments")
    .select("id, user_id, course_id, package_type, has_interview_guide, status, review_status, created_at, review_note, courses(title)")
    .order("created_at", { ascending: false });
  const userIds = [...new Set((rows || []).map((r) => r.user_id))];
  const { data: users } = userIds.length ? await adminClient.from("users").select("id, full_name, phone").in("id", userIds) : { data: [] };
  const userMap = new Map((users || []).map((u) => [u.id, u]));
  return <main className="min-h-screen"><Navbar /><section className="mx-auto max-w-4xl px-6 py-12">
    <p className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</p><h1 className="mt-2 text-3xl font-bold text-carinex-navy">Paid Enrolments</h1>
    <p className="mt-2 text-sm text-carinex-navy/60">Review verified payments and manually approve or reject course access.</p><AdminTabs />
    <div className="mt-8 flex flex-col gap-4">{(rows || []).map((r) => { const u = userMap.get(r.user_id); return <article key={r.id} className="rounded-xl border border-carinex-navy/10 p-5">
      <div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-bold text-carinex-navy">{u?.full_name || "Nurse"}</h2><p className="text-sm text-carinex-navy/60">{u?.phone || "No phone"} · {(r.courses as unknown as { title: string } | null)?.title || `Course #${r.course_id}`} · {r.package_type === "course_plus_guide" ? "Course + interview guide" : "Course only"}</p></div><span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold">{r.status.replaceAll("_", " ")}</span></div>
      <p className="mt-2 text-xs text-carinex-navy/50">Created {new Date(r.created_at).toLocaleString("en-NG")}</p>{r.review_note && <p className="mt-2 text-sm">Note: {r.review_note}</p>}
      <EnrollmentReviewActions enrollmentId={r.id} status={r.status} />
    </article>; })}{(!rows || rows.length === 0) && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-carinex-navy/60">No course enrolments yet.</p>}</div>
  </section></main>;
}
