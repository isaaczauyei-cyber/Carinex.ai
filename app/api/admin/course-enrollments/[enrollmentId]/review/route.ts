import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: { enrollmentId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data: userRow } = await supabase.from("users").select("user_type").eq("id", user.id).maybeSingle();
  if (userRow?.user_type !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  if (!(["approved", "rejected", "under_review"] as string[]).includes(body.action)) return NextResponse.json({ error: "Invalid review action" }, { status: 400 });
  const admin = createAdminClient();
  const update = body.action === "under_review"
    ? { review_status: "under_review", review_note: typeof body.note === "string" ? body.note.slice(0, 1000) : null }
    : { status: body.action, review_status: body.action === "rejected" ? "pending_review" : "resolved", review_note: typeof body.note === "string" ? body.note.slice(0, 1000) : null, reviewed_by: user.id, reviewed_at: new Date().toISOString() };
  const { error } = await admin.from("course_enrollments").update(update).eq("id", params.enrollmentId);
  if (error) return NextResponse.json({ error: "Could not update enrolment" }, { status: 500 });
  return NextResponse.json({ success: true });
}
