import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

export async function PUT(request: NextRequest) {
  try {
    const { adminClient } = await requireAdminWithService(["course_content"]);
    const body = await request.json();
    const courseId = Number(body.courseId);
    const items = body.items;
    if (!Number.isInteger(courseId) || courseId <= 0 || !Array.isArray(items)) return NextResponse.json({ error: "Invalid syllabus payload." }, { status: 400 });
    const { data: course, error: courseError } = await adminClient.from("courses").select("id, is_in_house").eq("id", courseId).maybeSingle();
    if (courseError || !course || course.is_in_house) return NextResponse.json({ error: "External course not found." }, { status: 404 });
    const normalized = items.map((item: Record<string, unknown>, index: number) => ({ ...(item.id ? { id: item.id } : {}), course_id: courseId, order_index: index + 1, title: String(item.title || "").trim(), description: String(item.description || "").trim() || null }));
    if (normalized.some((item) => !item.title)) return NextResponse.json({ error: "Every syllabus item needs a title." }, { status: 400 });
    const { data: existing, error: readError } = await adminClient.from("course_syllabus_items").select("id").eq("course_id", courseId);
    if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });
    const keepIds = normalized.filter((item) => item.id).map((item) => item.id);
    const removeIds = (existing || []).map((item) => item.id).filter((id) => !keepIds.includes(id));
    if (removeIds.length) {
      const { error } = await adminClient.from("course_syllabus_items").delete().in("id", removeIds).eq("course_id", courseId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const { error: upsertError } = await adminClient.from("course_syllabus_items").upsert(normalized, { onConflict: "id" });
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}
