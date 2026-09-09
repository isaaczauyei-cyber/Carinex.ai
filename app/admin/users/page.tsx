import Link from "next/link";
import { requireAdminWithService } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminUsersPage() {
  const { supabase, adminClient } = await requireAdminWithService();

  const { data: nurses } = await supabase
    .from("nurse_profiles")
    .select("id, nurse_code, license_status, license_verified, user_id, users(full_name)")
    .order("nurse_code");

  const nurseUserIds = new Set((nurses || []).map((n) => n.user_id));

  const { data: allUsers } = await supabase
    .from("users")
    .select("id, full_name, first_name, created_at")
    .order("created_at", { ascending: false });

  const incompleteUsers = (allUsers || []).filter((u) => !nurseUserIds.has(u.id));

  // Pull emails from auth.users for just the incomplete signups.
  let emailById = new Map<string, string>();
  if (incompleteUsers.length > 0) {
    const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    emailById = new Map((authData?.users || []).map((u) => [u.id, u.email || "—"]));
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">Users</h1>

        <AdminTabs />

        <h2 className="mt-8 text-lg font-bold text-carinex-navy">Nurses (onboarding complete)</h2>
        <div className="mt-3 flex flex-col divide-y divide-carinex-navy/10 rounded-xl border border-carinex-navy/10">
          {(nurses || []).map((n) => {
            const userInfo = n.users as unknown as { full_name: string } | null;
            return (
              <Link
                key={n.id}
                href={`/admin/users/${n.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-carinex-navy/5"
              >
                <div>
                  <p className="text-sm font-mono text-carinex-navy/50">{n.nurse_code}</p>
                  <p className="font-semibold text-carinex-navy">{userInfo?.full_name || "Unnamed"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {n.license_verified ? (
                    <span className="rounded-full bg-carinex-emerald/10 px-3 py-1 text-xs font-semibold text-carinex-emerald">
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      Unverified
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          {(!nurses || nurses.length === 0) && (
            <p className="px-5 py-8 text-center text-sm text-carinex-navy/50">No users yet.</p>
          )}
        </div>

        <h2 className="mt-10 text-lg font-bold text-carinex-navy">Incomplete signups</h2>
        <p className="mt-1 text-sm text-carinex-navy/50">
          Signed up but never finished onboarding — no nurse profile was created.
        </p>
        <div className="mt-3 flex flex-col divide-y divide-carinex-navy/10 rounded-xl border border-carinex-navy/10">
          {incompleteUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-semibold text-carinex-navy">{u.full_name || u.first_name || "Unnamed"}</p>
                <p className="text-sm text-carinex-navy/50">{emailById.get(u.id) || "—"}</p>
              </div>
              <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/60">
                {u.created_at ? new Date(u.created_at).toLocaleDateString() : ""}
              </span>
            </div>
          ))}
          {incompleteUsers.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-carinex-navy/50">No incomplete signups.</p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
