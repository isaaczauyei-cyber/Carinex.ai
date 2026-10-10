import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRole = "general_admin" | "customer_experience" | "financial" | "course_content";
export const ADMIN_ROLES: AdminRole[] = ["general_admin", "customer_experience", "financial", "course_content"];

export function roleHome(role: AdminRole) {
  if (role === "financial") return "/admin/enrollments";
  if (role === "course_content") return "/admin/course-content";
  return "/admin/users";
}

export async function getAdminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null as AdminRole | null };
  const { data: userRow } = await supabase.from("users").select("user_type, admin_role").eq("id", user.id).maybeSingle();
  if (userRow?.user_type !== "admin") return { supabase, user, role: null as AdminRole | null };
  const role = ADMIN_ROLES.includes(userRow.admin_role as AdminRole) ? userRow.admin_role as AdminRole : "general_admin";
  return { supabase, user, role };
}

export async function requireAdmin(allowedRoles: AdminRole[] = ["general_admin"]) {
  const { supabase, user, role } = await getAdminContext();
  if (!user) redirect("/login");
  if (!role) redirect("/dashboard");
  if (!allowedRoles.includes(role) && role !== "general_admin") redirect(roleHome(role));
  return supabase;
}

export async function requireAdminWithService(allowedRoles: AdminRole[] = ["general_admin"]) {
  const supabase = await requireAdmin(allowedRoles);
  const { role } = await getAdminContext();
  const adminClient = createAdminClient();
  return { supabase, adminClient, role: role || "general_admin" };
}
