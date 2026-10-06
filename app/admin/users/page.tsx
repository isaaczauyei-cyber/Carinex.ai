import Link from "next/link";
import { requireAdminWithService } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";
import AdminUserActions from "@/components/AdminUserActions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { supabase, adminClient } = await requireAdminWithService();
  const { data: nurses } = await supabase.from("nurse_profiles").select("id, nurse_code, license_status, license_verified, user_id, users(full_name)").order("nurse_code");
  const nurseUserIds = new Set((nurses || []).map((n) => n.user_id));
  const { data: allUsers } = await supabase.from("users").select("id, full_name, first_name, created_at").order("created_at", { ascending: false });
  const incompleteUsers = (allUsers || []).filter((u) => !nurseUserIds.has(u.id));
  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const authById = new Map((authData?.users || []).map((u) => [u.id, u]));
  const isTerminated = (id: string) => { const bannedUntil = authById.get(id)?.banned_until; return Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now()); };

  return <main><Navbar /><section className="mx-auto max-w-5xl px-6 py-12"><span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span><h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">Users</h1><AdminTabs />
    <h2 className="mt-8 text-lg font-bold text-carinex-navy">Nurses (onboarding complete)</h2>
    <div className="mt-3 flex flex-col divide-y divide-carinex-navy/10 rounded-xl border border-carinex-navy/10">{(nurses || []).map((n) => { const info = n.users as unknown as { full_name: string } | null; const terminated = isTerminated(n.user_id); return <div key={n.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><Link href={`/admin/users/${n.id}`} className="min-w-0 hover:opacity-80"><p className="text-sm font-mono text-carinex-navy/50">{n.nurse_code}</p><p className="font-semibold text-carinex-navy">{info?.full_name || "Unnamed"}</p><p className="text-sm text-carinex-navy/50">{authById.get(n.user_id)?.email || "—"}</p></Link><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${terminated ? "bg-red-50 text-red-700" : n.license_verified ? "bg-carinex-emerald/10 text-carinex-emerald" : "bg-carinex-navy/5 text-carinex-navy/50"}`}>{terminated ? "Terminated" : n.license_verified ? "License verified" : "License pending"}</span><AdminUserActions userId={n.user_id} terminated={terminated} compact /></div></div>; })}{(!nurses || nurses.length === 0) && <p className="px-5 py-8 text-center text-sm text-carinex-navy/50">No users yet.</p>}</div>

    <h2 className="mt-10 text-lg font-bold text-carinex-navy">Incomplete signups</h2><p className="mt-1 text-sm text-carinex-navy/50">Signed up but never finished onboarding — no nurse profile was created.</p>
    <div className="mt-3 flex flex-col divide-y divide-carinex-navy/10 rounded-xl border border-carinex-navy/10">{incompleteUsers.map((u) => { const terminated = isTerminated(u.id); return <div key={u.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-carinex-navy">{u.full_name || u.first_name || "Unnamed"}</p><p className="text-sm text-carinex-navy/50">{authById.get(u.id)?.email || "—"}</p><p className="mt-1 text-xs text-carinex-navy/40">{u.created_at ? new Date(u.created_at).toLocaleDateString() : ""}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${terminated ? "bg-red-50 text-red-700" : "bg-carinex-navy/5 text-carinex-navy/60"}`}>{terminated ? "Terminated" : "Incomplete"}</span><AdminUserActions userId={u.id} terminated={terminated} compact /></div></div>; })}{incompleteUsers.length === 0 && <p className="px-5 py-8 text-center text-sm text-carinex-navy/50">No incomplete signups.</p>}</div>
  </section><Footer /></main>;
}
