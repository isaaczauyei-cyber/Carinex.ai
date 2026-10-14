import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// User-scoped profile operations. The service-role client is used only after
// validating the caller's session and deriving the profile owner from that session.
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin
    .from("nurse_profiles").select("id, user_id, onboarding_completed")
    .eq("user_id", user.id).maybeSingle();
  if (readError) return NextResponse.json({ error: "Could not load nurse profile." }, { status: 500 });
  if (existing) return NextResponse.json({ profile: existing });

  const { data: profile, error } = await admin
    .from("nurse_profiles").insert({ user_id: user.id }).select("id, user_id, onboarding_completed").single();
  if (error) {
    // Handle a concurrent request if the user_id column is unique.
    const { data: concurrent } = await admin.from("nurse_profiles")
      .select("id, user_id, onboarding_completed").eq("user_id", user.id).maybeSingle();
    if (concurrent) return NextResponse.json({ profile: concurrent });
    return NextResponse.json({ error: "Could not create nurse profile." }, { status: 500 });
  }
  return NextResponse.json({ profile }, { status: 201 });
}

const editableFields = new Set([
  "license_status", "career_goal", "availability", "clinical_background",
  "onboarding_completed", "bio", "track_national", "track_global",
  "nmcn_registration_no", "license_doc_url", "license_expiry_date",
]);

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected a profile update object." }, { status: 400 });
  }
  const updates = Object.fromEntries(Object.entries(body as Record<string, unknown>).filter(([key]) => editableFields.has(key)));
  if (!Object.keys(updates).length || Object.keys(updates).length !== Object.keys(body as Record<string, unknown>).length) {
    return NextResponse.json({ error: "Update contains no editable fields or includes protected fields." }, { status: 400 });
  }

  // Validate enums and basic field types before using the privileged client.
  const allowedValues: Record<string, string[]> = {
    license_status: ["active", "provisional", "backlog"],
    career_goal: ["stay_nigeria", "go_international", "not_sure"],
    availability: ["full_time", "part_time", "flexible"],
  };
  for (const [key, values] of Object.entries(allowedValues)) {
    if (key in updates && updates[key] !== null &&
        (typeof updates[key] !== "string" || !values.includes(updates[key] as string))) {
      return NextResponse.json({ error: `Invalid value for ${key}.` }, { status: 400 });
    }
  }
  for (const key of ["license_status", "career_goal", "availability", "bio", "nmcn_registration_no", "license_doc_url", "license_expiry_date"]) {
    if (key in updates && updates[key] !== null && typeof updates[key] !== "string") {
      return NextResponse.json({ error: `Invalid value for ${key}.` }, { status: 400 });
    }
  }
  for (const key of ["track_national", "track_global"]) {
    if (key in updates && typeof updates[key] !== "boolean") return NextResponse.json({ error: `Invalid value for ${key}.` }, { status: 400 });
  }
  // Users may finish their own onboarding, but cannot reset or manipulate this
  // workflow flag through the generic profile endpoint.
  if ("onboarding_completed" in updates && updates.onboarding_completed !== true) {
    return NextResponse.json({ error: "Onboarding can only be marked complete from this endpoint." }, { status: 400 });
  }
  if ("clinical_background" in updates && updates.clinical_background !== null &&
      (!Array.isArray(updates.clinical_background) || !updates.clinical_background.every((v) => typeof v === "string"))) {
    return NextResponse.json({ error: "Invalid clinical background." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from("nurse_profiles")
    .update(updates).eq("user_id", user.id).select("id").maybeSingle();
  if (profileError) return NextResponse.json({ error: "Could not save nurse profile." }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "Nurse profile not found. Create it first." }, { status: 404 });
  return NextResponse.json({ success: true });
}
