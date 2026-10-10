import { requireAdminWithService } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import AdminTabs from "@/components/AdminTabs";
import AdminTeamManager from "@/components/AdminTeamManager";
export const dynamic = "force-dynamic";
export default async function AdminTeamPage() {
  const { adminClient } = await requireAdminWithService(["general_admin"]);
  const { data: users } = await adminClient.from("users").select("id, full_name, first_name, user_type, admin_role, created_at").order("created_at", { ascending: false });
  const { data: auth } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((auth?.users || []).map(u => [u.id, u.email || ""]));
  const rows = (users || []).map(u => ({ ...u, email: emailById.get(u.id) || "" }));
  return <main className="min-h-screen"><Navbar/><section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12"><p className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">General administration</p><h1 className="mt-2 text-3xl font-bold text-carinex-navy">Admin Team & Access</h1><p className="mt-2 max-w-2xl text-sm text-carinex-navy/60">Assign staff access by responsibility. Grant access only to trusted team members; all permissions are checked on the server.</p><AdminTabs/><div className="mt-8"><AdminTeamManager users={rows}/></div></section></main>;
}
