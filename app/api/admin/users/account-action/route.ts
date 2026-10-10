import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const { supabase, adminClient } = await requireAdminWithService();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    const body = await request.json();
    const userId = String(body.userId || "");
    const action = String(body.action || "");

    if (!userId || !["terminate", "restore", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid account action." }, { status: 400 });
    }
    if (adminUser?.id === userId) {
      return NextResponse.json({ error: "You cannot terminate or delete your own admin account here." }, { status: 400 });
    }

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

    // The database migration configures course_enrollments.user_id to cascade from
    // public.users. Supabase Auth deletion removes the linked public.users row,
    // so the enrollment rows are cleaned up by PostgreSQL. Payment rows are not
    // explicitly deleted here and should remain available for reconciliation.
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) {
      const message = authError.message || "Supabase could not delete this account.";
      const constraintBlocked = /foreign key|constraint|23503|still referenced/i.test(message);
      return NextResponse.json({
        error: constraintBlocked
          ? "This account still has related records that prevent deletion. Check database foreign-key dependencies before retrying."
          : `Supabase could not delete this account: ${message}`,
      }, { status: 400 });
    }

    // Some deployments do not link public.users to auth.users with a cascade.
    // Keep this best-effort fallback, but surface failures rather than silently ignoring them.
    const { error: profileError } = await adminClient.from("users").delete().eq("id", userId);
    if (profileError && !/0 rows|no rows/i.test(profileError.message)) {
      return NextResponse.json({
        success: true,
        status: "deleted",
        warning: "The authentication account was deleted, but the public profile cleanup needs review.",
      });
    }

    return NextResponse.json({ success: true, status: "deleted" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}
