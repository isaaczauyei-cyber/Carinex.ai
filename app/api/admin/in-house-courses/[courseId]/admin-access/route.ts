import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const { adminClient, supabase } = await requireAdminWithService(["general_admin", "course_content"]);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const courseId = Number(params.courseId);
    if (!Number.isInteger(courseId) || courseId <= 0) return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
    let body: { enabled?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
    if (typeof body.enabled !== "boolean") return NextResponse.json({ error: "Enabled must be true or false." }, { status: 400 });
    const { data: course, error: lookupError } = await adminClient.from("courses").select("id, is_in_house").eq("id", courseId).maybeSingle();
    if (lookupError) return NextResponse.json({ error: "Could not load course." }, { status: 500 });
    if (!course || course.is_in_house !== true) return NextResponse.json({ error: "In-house course not found." }, { status: 404 });
    if (body.enabled) {
      const { error } = await adminClient.from("course_admin_access_grants").upsert({ course_id: courseId, granted_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "course_id" });
      if (error) { console.error("Admin course access grant failed", error); return NextResponse.json({ error: "Could not enable access. Ensure the course admin access migration has been applied." }, { status: 500 }); }
    } else {
      const { error } = await adminClient.from("course_admin_access_grants").delete().eq("course_id", courseId);
      if (error) { console.error("Admin course access revoke failed", error); return NextResponse.json({ error: "Could not disable access. Ensure the course admin access migration has been applied." }, { status: 500 }); }
    }
    return NextResponse.json({ success: true, enabled: body.enabled });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 }); }
}
