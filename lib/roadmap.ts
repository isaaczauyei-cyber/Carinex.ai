import { createClient } from "@/lib/supabase/server";
import { getSpecializationBySlug } from "@/lib/data";

export type RoadmapMilestone = {
  label: string;
  done: boolean;
};

export async function getRoadmap(userId: string, nurseId: string, slug: string) {
  const supabase = await createClient();
  const spec = getSpecializationBySlug(slug);
  if (!spec) return null;

  const { data: dbSpec } = await supabase
    .from("specializations")
    .select("id, required_course_count, min_years_experience")
    .eq("slug", slug)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("license_status, license_verified")
    .eq("id", nurseId)
    .maybeSingle();

  const { data: userRow } = await supabase
    .from("users")
    .select("years_experience")
    .eq("id", userId)
    .maybeSingle();

  const { data: nurseSkillRows } = await supabase
    .from("nurse_skills")
    .select("skills(name)")
    .eq("nurse_id", nurseId);

  const nurseSkillNames = new Set(
    (nurseSkillRows || []).map((r) => (r.skills as unknown as { name: string })?.name).filter(Boolean)
  );

  const skillsHave = spec.skills.filter((s) => nurseSkillNames.has(s));
  const skillsGap = spec.skills.filter((s) => !nurseSkillNames.has(s));

  const { data: courses } = dbSpec
    ? await supabase.from("courses").select("*").eq("specialization_id", dbSpec.id)
    : { data: [] };

  const { data: completions } = await supabase
    .from("nurse_course_completions")
    .select("*")
    .eq("nurse_id", nurseId);

  const completionByCourseId = new Map((completions || []).map((c) => [c.course_id, c]));
  const completedCount = (courses || []).filter(
    (c) => completionByCourseId.get(c.id)?.status === "completed"
  ).length;

  const requiredCount = dbSpec?.required_course_count || 0;
  const coursesComplete = requiredCount > 0 && completedCount >= requiredCount;

  const { data: certifications } = await supabase
    .from("nurse_certifications")
    .select("*")
    .eq("nurse_id", nurseId);

  const licenseSubmitted = !!profile?.license_status;
  const licenseVerified = !!profile?.license_verified;

  const meetsExperience = dbSpec?.min_years_experience
    ? (userRow?.years_experience || 0) >= dbSpec.min_years_experience
    : true;

  const milestones: RoadmapMilestone[] = [
    { label: "Selected this pathway", done: true },
    { label: "License status submitted", done: licenseSubmitted },
    { label: "License verified by Carinex", done: licenseVerified },
  ];

  if (dbSpec?.min_years_experience) {
    milestones.push({
      label: `Meets experience requirement (${dbSpec.min_years_experience}+ years)`,
      done: meetsExperience,
    });
  }

  if (requiredCount > 0) {
    milestones.push({
      label: `Complete required courses (${completedCount} of ${requiredCount})`,
      done: coursesComplete,
    });
  }

  milestones.push({
    label: "Unlocked for opportunity matching",
    done: licenseVerified && coursesComplete && meetsExperience,
  });

  return {
    spec,
    skillsHave,
    skillsGap,
    courses: courses || [],
    completionByCourseId,
    certifications: certifications || [],
    milestones,
  };
}
