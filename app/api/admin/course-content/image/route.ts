import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const { adminClient } = await requireAdminWithService(["course_content"]);
    const form = await request.formData();
    const file = form.get("file");
    const courseId = String(form.get("courseId") || "new");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `external/${courseId}/${Date.now()}-${safeName}`;
    const bytes = await file.arrayBuffer();
    const { error } = await adminClient.storage.from("course-images").upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const { data } = adminClient.storage.from("course-images").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}
