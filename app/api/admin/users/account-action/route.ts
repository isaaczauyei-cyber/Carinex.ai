import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const { supabase, adminClient } = await requireAdminWithService(["general_admin"]);
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    const body = await request.json();
    const userId = String(body.userId || "");
    const action = String(body.action || "");
    if (!userId || !["terminate", "restore", "delete"].includes(action)) return NextResponse.json({ error: "Invalid account action." }, { status: 400 });
    if (adminUser?.id === userId) return NextResponse.json({ error: "You cannot terminate or delete your own admin account here." }, { status: 400 });

    if (action === "terminate") {
      const { error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, status: "terminated" });
    }

    if (action === "restore") {
      const { error } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: "none" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, status: "active" });
    }

    // Auth deletion is the source of truth. Supabase cascades related records
    // when the project's foreign keys are configured with ON DELETE CASCADE.
    // We also remove the public user row as a fallback for projects where it is
    // not tied to auth.users by a cascading FK.
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    await adminClient.from("users").delete().eq("id", userId);
    return NextResponse.json({ success: true, status: "deleted" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}
