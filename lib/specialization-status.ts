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

  /*
   * These three pieces of information are independent,
   * so fetch them together.
   */
  const [{ data: profile }, { data: nurseSpecs }] = await Promise.all([
    supabase
      .from("nurse_profiles")
      .select("license_status, user_id")
      .eq("id", nurseProfileId)
      .single(),

    supabase
      .from("nurse_specializations")
      .select(
        "specialization_id, specializations(id, name, slug, required_course_count, min_years_experience)"
      )
      .eq("nurse_id", nurseProfileId),
  ]);

  if (!profile) {
    return [];
  }

  if (!nurseSpecs || nurseSpecs.length === 0) {
    return [];
  }

  /*
   * Only one user query instead of one query per specialization.
   */
  const { data: userRow } = await supabase
    .from("users")
    .select("years_experience")
    .eq("id", profile.user_id)
    .maybeSingle();

  const yearsExperience = userRow?.years_experience || 0;

  const specializationIds = nurseSpecs
    .map((row) => row.specialization_id)
    .filter((id): id is number => Number.isInteger(id));

  /*
   * ONE completion query for all of the learner's
   * selected specializations.
   *
   * Previously this was executed once per specialization.
   */
  const { data: allRows } = specializationIds.length
    ? await supabase
        .from("nurse_course_completions")
        .select(
          "status, course_id, courses!inner(specialization_id, title, is_in_house)"
        )
        .eq("nurse_id", nurseProfileId)
        .in("courses.specialization_id", specializationIds)
    : { data: [] };

  const completionRows = allRows || [];

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

    /*
     * Keep the exact existing completion logic,
     * but work from the single query above.
     */
    const specRows = completionRows.filter(
      (completion) =>
        (completion.courses as unknown as {
          specialization_id: number;
        })?.specialization_id === spec.id
    );

    const completedCourseTitles = new Set(
      specRows
        .filter((completion) => completion.status === "completed")
        .map(
          (completion) =>
            (completion.courses as unknown as { title: string })?.title
        )
        .filter(Boolean)
    );

    const completedCourses = completedCourseTitles.size;
    const requiredCourses = spec.required_course_count || 0;

    const licenseActive = profile.license_status === "active";

    const coursesComplete =
      requiredCourses > 0 && completedCourses >= requiredCourses;

    const meetsExperienceGate = spec.min_years_experience
      ? yearsExperience >= spec.min_years_experience
      : true;

    let status: SpecializationStatus = "not_started";

    if (licenseActive && coursesComplete && meetsExperienceGate) {
      status = "unlocked";
    } else if (completedCourses > 0 || licenseActive) {
      status = "in_progress";
    }

    /*
     * Preserve the existing primary-course selection order.
     */
    const startedRow =
      specRows.find((r) => r.status === "in_progress") ||
      specRows.find((r) => r.status === "verification_pending") ||
      specRows.find((r) => r.status === "completed");

    const primaryCourse: PrimaryCourseState = startedRow
      ? {
          courseId: startedRow.course_id,
          status: startedRow.status as
            | "in_progress"
            | "verification_pending"
            | "completed",
          isInHouse: !!(
            startedRow.courses as unknown as {
              is_in_house: boolean;
            }
          )?.is_in_house,
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
