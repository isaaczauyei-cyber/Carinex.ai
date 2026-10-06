import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithService } from "@/lib/admin";

const fields = ["title", "provider", "specialization_id", "track_type", "price_display", "affiliate_link", "summary", "is_free", "description_long", "duration_display", "level", "image_url"] as const;
function pickFields(input: Record<string, unknown>) { const output: Record<string, unknown> = {}; for (const field of fields) if (field in input) output[field] = input[field]; return output; }
function baseValidate(input: Record<string, unknown>) {
  if (!String(input.title || "").trim()) return "Course title is required.";
  if (!String(input.provider || "").trim()) return "Provider is required.";
  if (input.specialization_id != null && (!Number.isInteger(Number(input.specialization_id)) || Number(input.specialization_id) <= 0)) return "Choose a valid specialization.";
  if (!['national', 'global'].includes(String(input.track_type))) return "Choose a track.";
  if (input.level && !['Beginner', 'Intermediate', 'Advanced'].includes(String(input.level))) return "Choose a valid level.";
  return null;
}
function externalValidate(input: Record<string, unknown>) {
  const base = baseValidate(input); if (base) return base;
  if (!String(input.affiliate_link || "").trim()) return "External course URL is required.";
  try { new URL(String(input.affiliate_link)); } catch { return "Enter a valid external URL including https://."; }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { adminClient } = await requireAdminWithService();
    const input = pickFields(await request.json());
    const issue = externalValidate(input); if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    const { data, error } = await adminClient.from("courses").insert({ ...input, is_in_house: false, is_published: false }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ id: data.id });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { adminClient } = await requireAdminWithService();
    const body = await request.json(); const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
    const { data: existing, error: readError } = await adminClient.from("courses").select("id, is_in_house").eq("id", id).maybeSingle();
    if (readError || !existing) return NextResponse.json({ error: readError?.message || "Course not found." }, { status: 404 });
    const input = pickFields(body); const issue = existing.is_in_house ? baseValidate(input) : externalValidate(input);
    if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    const update = existing.is_in_house ? { ...input, is_published: false } : input;
    const { error } = await adminClient.from("courses").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); }
}
