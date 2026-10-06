import { NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

export async function POST(_request: Request, { params }: { params: { courseId: string } }) {
  try {
    const { adminClient } = await requireAdminWithService();
    const courseId = Number(params.courseId);
    if (!Number.isInteger(courseId) || courseId <= 0) return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
    const { error } = await adminClient.from("courses").update({ is_published: false }).eq("id", courseId).eq("is_in_house", true);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); }
}
