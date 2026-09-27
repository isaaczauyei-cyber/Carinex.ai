import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this into a "use client" file. Uses the service
// role key, which bypasses Row Level Security — needed here only to read
// quiz correct-answers for grading, since no public policy ever exposes them.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  if (userRow?.user_type !== "admin") {
    redirect("/dashboard");
  }

  return supabase;
}

// Same admin gate, but also returns a service-role client for pages that
// need data RLS can't reach (e.g. auth.users emails for incomplete signups).
export async function requireAdminWithService() {
  const supabase = await requireAdmin();
  const adminClient = createAdminClient();
  return { supabase, adminClient };
}
