import { createAdminClient } from "@/lib/supabase/admin";

export type JobEligibility = { eligible: boolean; reason: string };

export async function getJobEligibility(userId: string, job: { specialization_id: number | null; track_type: string | null; requires_foreign_license?: boolean | null }): Promise<JobEligibility> {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("nurse_profiles").select("id, license_status, track_national, track_global").eq("user_id", userId).maybeSingle();
  if (!profile) return { eligible: false, reason: "Complete your nurse profile first." };
  if (profile.license_status !== "active") return { eligible: false, reason: "An active nursing license is required for opportunities." };

  if (job.track_type === "national" && !profile.track_national) return { eligible: false, reason: "This opportunity is for your National track." };
  if (job.track_type === "global" && !profile.track_global) return { eligible: false, reason: "This opportunity is for your Global track." };

  const { data: specs } = await admin.from("nurse_specializations").select("specialization_id, specializations(id, name, required_course_count, min_years_experience)").eq("nurse_id", profile.id);
  const rows = specs || [];
  const targetRows = job.specialization_id ? rows.filter(r => r.specialization_id === job.specialization_id) : rows;
  if (targetRows.length === 0) return { eligible: false, reason: "You are not enrolled in the specialization required for this role." };

  const { data: userRow } = await admin.from("users").select("years_experience").eq("id", userId).maybeSingle();
  const years = Number(userRow?.years_experience || 0);

  for (const row of targetRows) {
    const spec = row.specializations as unknown as { id: number; name: string; required_course_count: number | null; min_years_experience: number | null } | null;
    if (!spec) continue;
    const { data: completions } = await admin.from("nurse_course_completions").select("course_id, status, courses!inner(specialization_id)").eq("nurse_id", profile.id).eq("courses.specialization_id", spec.id);
    const completed = new Set((completions || []).filter(c => c.status === "completed").map(c => c.course_id));
    const required = Number(spec.required_course_count || 0);
    const experienceOk = !spec.min_years_experience || years >= spec.min_years_experience;
    const coursesOk = required > 0 ? completed.size >= required : completed.size > 0;
    if (coursesOk && experienceOk) return { eligible: true, reason: "Eligible" };
  }

  return { eligible: false, reason: "Complete and have the required course(s) approved for this specialization before applying." };
}
