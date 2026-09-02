import { createClient } from "@/lib/supabase/server";
import { getSpecializationBySlug } from "@/lib/data";

export type PortfolioChecklistItem = {
  label: string;
  done: boolean;
};

export type SpecializationTechReadiness = {
  slug: string;
  title: string;
  techSkillDemonstrated: boolean;
};

const TECH_SKILL_TAGS = [
  "Digital Health Tools",
  "EHR Systems",
  "Clinical Documentation",
  "Healthcare Data",
  "Automation",
];

export async function getUnifiedPortfolio(nurseId: string) {
  const supabase = await createClient();

  const [
    { data: nurseProfile },
    { data: experience },
    { data: certifications },
    { data: references },
    { data: completions },
    { data: nurseSkillRows },
    { data: nurseSpecRows },
  ] = await Promise.all([
    supabase.from("nurse_profiles").select("bio, license_status").eq("id", nurseId).single(),
    supabase.from("nurse_experience").select("id").eq("nurse_id", nurseId),
    supabase.from("nurse_certifications").select("id").eq("nurse_id", nurseId),
    supabase.from("nurse_references").select("id").eq("nurse_id", nurseId),
    supabase.from("nurse_course_completions").select("status").eq("nurse_id", nurseId),
    supabase.from("nurse_skills").select("skills(name)").eq("nurse_id", nurseId),
    supabase.from("nurse_specializations").select("specializations(slug, name)").eq("nurse_id", nurseId),
  ]);

  const bioWritten = !!(nurseProfile?.bio && nurseProfile.bio.trim().length > 0);
  const licenseSubmitted = !!nurseProfile?.license_status;
  const hasExperience = (experience || []).length > 0;
  const hasCertOrCourse =
    (certifications || []).length > 0 ||
    (completions || []).some((c) => c.status === "completed");
  const hasReference = (references || []).length > 0;

  const sharedChecklist: PortfolioChecklistItem[] = [
    { label: "Professional summary written (bio)", done: bioWritten },
    { label: "At least one work experience logged", done: hasExperience },
    { label: "License documentation submitted", done: licenseSubmitted },
    { label: "At least one certification or completed course", done: hasCertOrCourse },
    { label: "At least one professional reference", done: hasReference },
  ];

  const nurseSkillNames = new Set(
    (nurseSkillRows || [])
      .map((r) => (r.skills as unknown as { name: string })?.name)
      .filter(Boolean)
  );

  const specializationReadiness: SpecializationTechReadiness[] = (nurseSpecRows || [])
    .map((r) => r.specializations as unknown as { slug: string; name: string })
    .filter(Boolean)
    .map((row) => {
      const spec = getSpecializationBySlug(row.slug);
      const specSkills = spec?.skills || [];
      const techSkillDemonstrated = specSkills.some(
        (s) => TECH_SKILL_TAGS.includes(s) && nurseSkillNames.has(s)
      );
      return {
        slug: row.slug,
        title: spec?.title || row.name,
        techSkillDemonstrated,
      };
    });

  return {
    sharedChecklist,
    specializationReadiness,
    sharedCompleteCount: sharedChecklist.filter((i) => i.done).length,
    sharedTotalCount: sharedChecklist.length,
  };
}
