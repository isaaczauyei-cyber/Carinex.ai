import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const { adminClient } = await requireAdminWithService();
    const courseId = Number(params.courseId);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
    }

    let body: { enabled?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "Trial enabled must be true or false." }, { status: 400 });
    }

    const { data: course, error: lookupError } = await adminClient
      .from("courses")
      .select("id, is_in_house")
      .eq("id", courseId)
      .maybeSingle();
    if (lookupError) return NextResponse.json({ error: "Could not load course." }, { status: 500 });
    if (!course || course.is_in_house !== true) {
      return NextResponse.json({ error: "In-house course not found." }, { status: 404 });
    }

    const { error } = await adminClient
      .from("courses")
      .update({ trial_enabled: body.enabled })
      .eq("id", courseId);
    if (error) {
      console.error("Could not update in-house course trial setting", { courseId, error });
      return NextResponse.json({ error: "Could not save the trial setting." }, { status: 500 });
    }

    return NextResponse.json({ success: true, trialEnabled: body.enabled, trialDays: 3 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
  }
}
