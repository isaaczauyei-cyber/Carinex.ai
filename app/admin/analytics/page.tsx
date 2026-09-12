import { requireAdminWithService } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";

function Bar({ pct, className = "bg-carinex-emerald" }: { pct: number; className?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-carinex-navy/10">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const { supabase, adminClient } = await requireAdminWithService();

  // --- Signup funnel ---
  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const totalSignups = authData?.users.length || 0;

  const { data: nurseProfiles } = await supabase
    .from("nurse_profiles")
    .select("id, license_status, onboarding_completed, created_at");

  const onboardedNurses = (nurseProfiles || []).filter((p) => p.onboarding_completed);
  const onboardingCompletedCount = onboardedNurses.length;
  const incompleteCount = Math.max(0, totalSignups - onboardingCompletedCount);
  const completionRate = totalSignups > 0 ? Math.round((onboardingCompletedCount / totalSignups) * 100) : 0;

  // --- Signup trend, last 14 days ---
  const { data: allUsers } = await supabase.from("users").select("created_at");
  const today = new Date();
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const signupsByDay = days.map((day) => ({
    day,
    count: (allUsers || []).filter((u) => u.created_at?.slice(0, 10) === day).length,
  }));
  const maxDaySignups = Math.max(1, ...signupsByDay.map((d) => d.count));

  // --- License status breakdown ---
  const licenseCounts: Record<string, number> = {};
  for (const p of nurseProfiles || []) {
    const key = p.license_status || "Not set";
    licenseCounts[key] = (licenseCounts[key] || 0) + 1;
  }

  // --- Specialization enrollment ---
  const { data: specRows } = await supabase
    .from("nurse_specializations")
    .select("specializations(name)");
  const specCounts: Record<string, number> = {};
  for (const row of specRows || []) {
    const name = (row.specializations as unknown as { name: string })?.name;
    if (name) specCounts[name] = (specCounts[name] || 0) + 1;
  }
  const sortedSpecs = Object.entries(specCounts).sort((a, b) => b[1] - a[1]);
  const maxSpecCount = Math.max(1, ...sortedSpecs.map(([, c]) => c));

  // --- Course completion status, deduped per nurse+title ---
  const { data: completions } = await supabase
    .from("nurse_course_completions")
    .select("nurse_id, status, courses(title)");

  const seen = new Set<string>();
  const statusCounts: Record<string, number> = { completed: 0, in_progress: 0, verification_pending: 0 };
  for (const c of completions || []) {
    const title = (c.courses as unknown as { title: string })?.title;
    const key = `${c.nurse_id}:${title}`;
    if (!title || seen.has(key)) continue;
    seen.add(key);
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  }
  const pendingReviewCount = statusCounts.verification_pending;

  // --- Active nurses, last 7 / 30 days ---
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: activity } = await supabase
    .from("nurse_activity_log")
    .select("nurse_id, activity_date");

  const activeLast7 = new Set(
    (activity || [])
      .filter((a) => new Date(a.activity_date) >= sevenDaysAgo)
      .map((a) => a.nurse_id)
  ).size;
  const activeLast30 = new Set(
    (activity || [])
      .filter((a) => new Date(a.activity_date) >= thirtyDaysAgo)
      .map((a) => a.nurse_id)
  ).size;

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">Analytics</h1>

        <AdminTabs />

        {/* Top-line stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-carinex-navy/10 p-4">
            <p className="text-2xl font-bold text-carinex-navy">{totalSignups}</p>
            <p className="mt-1 text-xs text-carinex-navy/50">Total signups</p>
          </div>
          <div className="rounded-xl border border-carinex-navy/10 p-4">
            <p className="text-2xl font-bold text-carinex-navy">{onboardingCompletedCount}</p>
            <p className="mt-1 text-xs text-carinex-navy/50">Onboarded ({completionRate}%)</p>
          </div>
          <div className="rounded-xl border border-carinex-navy/10 p-4">
            <p className="text-2xl font-bold text-carinex-navy">{activeLast7}</p>
            <p className="mt-1 text-xs text-carinex-navy/50">Active, last 7 days</p>
          </div>
          <div className="rounded-xl border border-carinex-navy/10 p-4">
            <p className="text-2xl font-bold text-carinex-navy">{activeLast30}</p>
            <p className="mt-1 text-xs text-carinex-navy/50">Active, last 30 days</p>
          </div>
        </div>

        {incompleteCount > 0 && (
          <div className="mt-4 rounded-xl bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              {incompleteCount} signup{incompleteCount > 1 ? "s" : ""} never finished onboarding
            </p>
            <a href="/admin/users" className="mt-1 inline-block text-sm font-semibold text-amber-700 hover:underline">
              View incomplete signups →
            </a>
          </div>
        )}

        {pendingReviewCount > 0 && (
          <div className="mt-4 rounded-xl bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-800">
              {pendingReviewCount} course completion{pendingReviewCount > 1 ? "s" : ""} awaiting review
            </p>
            <a href="/admin/courses" className="mt-1 inline-block text-sm font-semibold text-sky-700 hover:underline">
              Review submissions →
            </a>
          </div>
        )}

        {/* Signup trend */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">Signups, last 14 days</h2>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {signupsByDay.map((d) => (
              <div key={d.day} className="flex-1" title={`${d.day}: ${d.count}`}>
                <div
                  className="mx-auto w-full rounded-t bg-carinex-emerald"
                  style={{ height: `${(d.count / maxDaySignups) * 100}%`, minHeight: d.count > 0 ? "4px" : "1px" }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-carinex-navy/40">
            <span>{signupsByDay[0]?.day.slice(5)}</span>
            <span>{signupsByDay[signupsByDay.length - 1]?.day.slice(5)}</span>
          </div>
        </div>

        {/* Specialization enrollment */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">Specialization enrollment</h2>
          {sortedSpecs.length === 0 ? (
            <p className="mt-2 text-sm text-carinex-navy/50">No enrollments yet.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {sortedSpecs.map(([name, count]) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-carinex-navy">{name}</span>
                    <span className="text-carinex-navy/50">{count}</span>
                  </div>
                  <div className="mt-1">
                    <Bar pct={(count / maxSpecCount) * 100} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* License status */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">License status</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(licenseCounts).map(([status, count]) => (
              <div key={status} className="rounded-lg border border-carinex-navy/10 p-3">
                <p className="text-lg font-bold text-carinex-navy">{count}</p>
                <p className="text-xs capitalize text-carinex-navy/50">{status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Course completion status */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">Course completions</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-carinex-navy/10 p-3">
              <p className="text-lg font-bold text-carinex-emerald">{statusCounts.completed}</p>
              <p className="text-xs text-carinex-navy/50">Completed</p>
            </div>
            <div className="rounded-lg border border-carinex-navy/10 p-3">
              <p className="text-lg font-bold text-amber-600">{statusCounts.in_progress}</p>
              <p className="text-xs text-carinex-navy/50">In progress</p>
            </div>
            <div className="rounded-lg border border-carinex-navy/10 p-3">
              <p className="text-lg font-bold text-sky-600">{statusCounts.verification_pending}</p>
              <p className="text-xs text-carinex-navy/50">Pending review</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
    }
