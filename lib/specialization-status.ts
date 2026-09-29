import { createClient } from "@/lib/supabase/server";

export type SpecializationStatus = "not_started" | "in_progress" | "unlocked";

export type PrimaryCourseState = {
  courseId: number;
  status: "in_progress" | "verification_pending" | "completed";
  isInHouse: boolean;
} | null;

export type SpecializationProgress = {
  specializationId: number;
  name: string;
  slug: string;
  status: SpecializationStatus;
  completedCourses: number;
  requiredCourses: number;
  meetsExperienceGate: boolean;
  minYearsExperience: number | null;
  primaryCourse: PrimaryCourseState;
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

    const { data: allRows } = await supabase
      .from("nurse_course_completions")
      .select("status, course_id, courses!inner(specialization_id, title, is_in_house)")
      .eq("nurse_id", nurseProfileId)
      .eq("courses.specialization_id", spec.id);

    const completedCourseTitles = new Set(
      (allRows || [])
        .filter((r) => r.status === "completed")
        .map((r) => (r.courses as unknown as { title: string })?.title)
        .filter(Boolean)
    );
    const completedCourses = completedCourseTitles.size;
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

    const startedRow = (allRows || []).find((r) => r.status === "in_progress")
      || (allRows || []).find((r) => r.status === "verification_pending")
      || (allRows || []).find((r) => r.status === "completed");

    const primaryCourse: PrimaryCourseState = startedRow
      ? {
          courseId: startedRow.course_id,
          status: startedRow.status as "in_progress" | "verification_pending" | "completed",
          isInHouse: !!(startedRow.courses as unknown as { is_in_house: boolean })?.is_in_house,
        }
      : null;

    results.push({
      specializationId: spec.id,
      name: spec.name,
      slug: spec.slug,
      status,
      completedCourses,
      requiredCourses,
      meetsExperienceGate,
      minYearsExperience: spec.min_years_experience,
      primaryCourse,
    });
  }

  return results;
}
