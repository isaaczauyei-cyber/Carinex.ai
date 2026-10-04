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

function validate(input: Record<string, unknown>) {
  if (!String(input.title || "").trim()) return "Course title is required.";
  if (!String(input.provider || "").trim()) return "Provider is required.";
  if (!String(input.affiliate_link || "").trim()) return "External course URL is required.";
  if (!Number.isInteger(Number(input.specialization_id)) || Number(input.specialization_id) <= 0) return "Choose a specialization.";
  if (!["national", "global"].includes(String(input.track_type))) return "Choose a track.";
  try { new URL(String(input.affiliate_link)); } catch { return "Enter a valid external URL including https://."; }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { adminClient } = await requireAdminWithService();
    const body = await request.json();
    const input = pickFields(body);
    const issue = validate(input);
    if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    const { data, error } = await adminClient.from("courses").insert({ ...input, is_in_house: false }).select("id").single();
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
    const input = pickFields(body);
    const issue = validate(input);
    if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    const { error } = await adminClient.from("courses").update(input).eq("id", id).or("is_in_house.is.null,is_in_house.eq.false");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}
