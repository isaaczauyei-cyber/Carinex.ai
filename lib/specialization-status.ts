import { createClient } from "@/lib/supabase/server";

export type SpecializationStatus = "not_started" | "in_progress" | "unlocked";

export type SpecializationProgress = {
  specializationId: number;
  name: string;
  slug: string;
  status: SpecializationStatus;
  completedCourses: number;
  requiredCourses: number;
  meetsExperienceGate: boolean;
  minYearsExperience: number | null;
};

export async function getSpecializationProgress(
  nurseProfileId: string
): Promise<SpecializationProgress[]> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("license_status, years_experience")
    .eq("id", nurseProfileId)
    .single();

  const { data: nurseSpecs } = await supabase
    .from("nurse_specializations")
    .select(
      "specialization_id, specializations(id, name, slug, required_course_count, min_years_experience)"
    )
    .eq("nurse_id", nurseProfileId);

  if (!nurseSpecs || nurseSpecs.length === 0) return [];

  const results: SpecializationProgress[] = [];

  for (const row of nurseSpecs) {
    const spec = row.specializations as unknown as {
      id: number;
      name: string;
      slug: string;
      required_course_count: number | null;
      min_years_experience: number | null;
    };
    if (!spec) continue;

    const { count: completedCount } = await supabase
      .from("nurse_course_completions")
      .select("id, courses!inner(specialization_id)", { count: "exact", head: true })
      .eq("nurse_id", nurseProfileId)
      .eq("status", "completed")
      .eq("courses.specialization_id", spec.id);

    const completedCourses = completedCount || 0;
    const requiredCourses = spec.required_course_count || 0;

    const licenseActive = profile?.license_status === "active";
    const coursesComplete = requiredCourses > 0 && completedCourses >= requiredCourses;
    const meetsExperienceGate = spec.min_years_experience
      ? (profile?.years_experience || 0) >= spec.min_years_experience
      : true;

    let status: SpecializationStatus = "not_started";
    if (licenseActive && coursesComplete && meetsExperienceGate) {
      status = "unlocked";
    } else if (completedCourses > 0 || licenseActive) {
      status = "in_progress";
    }

    results.push({
      specializationId: spec.id,
      name: spec.name,
      slug: spec.slug,
      status,
      completedCourses,
      requiredCourses,
      meetsExperienceGate,
      minYearsExperience: spec.min_years_experience,
    });
  }

  return results;
}
