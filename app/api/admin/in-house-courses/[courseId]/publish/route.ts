import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const { adminClient } = await requireAdminWithService();
    const courseId = Number(params.courseId); const body = await request.json(); const published = Boolean(body.published);
    if (!Number.isInteger(courseId) || courseId <= 0) return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
    const { data: course } = await adminClient.from("courses").select("id, is_in_house").eq("id", courseId).maybeSingle();
    if (!course || !course.is_in_house) return NextResponse.json({ error: "In-house course not found." }, { status: 404 });
    const { error } = await adminClient.from("courses").update({ is_published: published }).eq("id", courseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ published });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); }
}
