import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
const roles = ["general_admin", "customer_experience", "financial", "course_content"] as const;
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data: actor } = await supabase.from("users").select("user_type, admin_role").eq("id", user.id).maybeSingle();
  if (actor?.user_type !== "admin" || (actor.admin_role && actor.admin_role !== "general_admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const userId = String(body.userId || "");
  const role = String(body.role || "");
  if (!userId || (role !== "member" && !(roles as readonly string[]).includes(role))) return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });
  if (userId === user.id && role !== "general_admin") return NextResponse.json({ error: "You cannot remove or downgrade your own general administrator access." }, { status: 400 });
  const admin = createAdminClient();
  const { data: target } = await admin.from("users").select("id, user_type").eq("id", userId).maybeSingle();
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const update = role === "member"
    ? { user_type: "nurse", admin_role: null }
    : { user_type: "admin", admin_role: role };
  const { error } = await admin.from("users").update(update).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
