import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

const fields = [
  "title", "provider", "specialization_id", "track_type", "price_display",
  "affiliate_link", "summary", "is_free", "description_long", "duration_display",
  "level", "image_url",
] as const;

function pickFields(input: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  for (const field of fields) if (field in input) output[field] = input[field];
  return output;
}

function validate(input: Record<string, unknown>, isInHouse: boolean) {
  if (!String(input.title || "").trim()) return "Course title is required.";
  if (!String(input.provider || "").trim()) return "Provider is required.";
  if (!isInHouse && (!Number.isInteger(Number(input.specialization_id)) || Number(input.specialization_id) <= 0)) return "Choose a specialization.";
  if (!["national", "global", "in_house"].includes(String(input.track_type))) return "Choose a track.";
  if (!isInHouse && !String(input.affiliate_link || "").trim()) return "External course URL is required.";
  if (!isInHouse && String(input.affiliate_link || "").trim()) {
    try { new URL(String(input.affiliate_link)); } catch { return "Enter a valid external URL including https://."; }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { adminClient } = await requireAdminWithService();
    const body = await request.json();
    const input = pickFields(body);
    const issue = validate(input, false);
    if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    const { data, error } = await adminClient.from("courses").insert({ ...input, is_in_house: false, is_published: false }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ id: data.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { adminClient } = await requireAdminWithService();
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });

    const { data: existing, error: lookupError } = await adminClient.from("courses").select("id, is_in_house, is_published").eq("id", id).maybeSingle();
    if (lookupError || !existing) return NextResponse.json({ error: lookupError?.message || "Course not found." }, { status: 404 });

    if (body.action === "publish" || body.action === "unpublish") {
      if (!existing.is_in_house) return NextResponse.json({ error: "Only in-house courses have publication state." }, { status: 400 });
      const { error } = await adminClient.from("courses").update({ is_published: body.action === "publish" }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, is_published: body.action === "publish" });
    }

    const input = pickFields(body);
    const issue = validate(input, !!existing.is_in_house);
    if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    // Any content edit to an in-house course makes its working copy private until republished.
    const update = existing.is_in_house ? { ...input, is_published: false } : input;
    const { error } = await adminClient.from("courses").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, is_published: existing.is_in_house ? false : existing.is_published });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}
