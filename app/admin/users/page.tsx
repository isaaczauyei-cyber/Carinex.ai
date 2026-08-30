import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function AdminUsersPage() {
  const supabase = await requireAdmin();

  const { data: nurses } = await supabase
    .from("nurse_profiles")
    .select("id, nurse_code, license_status, license_verified, user_id, users(full_name)")
    .order("nurse_code");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-4xl px-6 py-12">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">Users</h1>

        <AdminTabs />

        <div className="mt-8 flex flex-col divide-y divide-carinex-navy/10 rounded-xl border border-carinex-navy/10">
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
      </section>
      <Footer />
    </main>
  );
}
