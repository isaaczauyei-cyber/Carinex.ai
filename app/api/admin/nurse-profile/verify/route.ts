import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const admin = createAdminClient();
  const { data: userRow, error: userError } = await admin.from("users")
    .select("user_type").eq("id", user.id).maybeSingle();
  if (userError || userRow?.user_type !== "admin") {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  let body: { nurseProfileId?: unknown; verified?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (typeof body.nurseProfileId !== "string" || typeof body.verified !== "boolean") {
    return NextResponse.json({ error: "A profile ID and boolean verification status are required." }, { status: 400 });
  }
  const { error } = await admin.from("nurse_profiles").update({
    license_verified: body.verified,
    license_verified_at: body.verified ? new Date().toISOString() : null,
  }).eq("id", body.nurseProfileId);
  if (error) return NextResponse.json({ error: "Could not update license verification." }, { status: 500 });
  return NextResponse.json({ success: true });
}
