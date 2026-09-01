import { specializations } from "@/lib/data";
import { specializationEligibility } from "@/lib/specialization-extras";

export type AssessmentInput = {
  yearsExperience: number;
  clinicalBackground: string[];
  careerGoal: string;
  licenseStatus: string;
};

export type Recommendation = {
  slug: string;
  title: string;
  fit: "strong" | "possible" | "not_yet";
  reasons: string[];
};

const highExperienceBackgrounds = ["ICU", "Emergency", "Public Health"];

export function getRecommendations(input: AssessmentInput): Recommendation[] {
  const results: Recommendation[] = [];

  for (const spec of specializations) {
    const elig = specializationEligibility[spec.slug];
    const reasons: string[] = [];
    const licenseActive = input.licenseStatus === "active";
    let fit: "strong" | "possible" | "not_yet" = "possible";

    if (spec.slug === "case-management") {
      const hasBackground = input.clinicalBackground.some((b) =>
        highExperienceBackgrounds.includes(b)
      );
      if (licenseActive && input.yearsExperience >= 2 && hasBackground) {
        fit = "strong";
        reasons.push(
          `You have ${input.yearsExperience}+ years in ${input.clinicalBackground.filter((b) => highExperienceBackgrounds.includes(b)).join(", ")}, meeting Case Management's experience bar.`
        );
      } else if (!licenseActive) {
        fit = "not_yet";
        reasons.push("Requires an active NMCN license.");
      } else if (input.yearsExperience < 2) {
        fit = "not_yet";
        reasons.push(`Requires 2-5 years post-qualification experience — you're at ${input.yearsExperience}.`);
      } else {
        fit = "possible";
        reasons.push("ICU, Emergency, or Public Health experience is most valued for this pathway.");
      }
    } else if (spec.slug === "telemedicine-coordination" || spec.slug === "virtual-assistance") {
      fit = "strong";
      reasons.push(elig?.license || "License preferred but not strictly required.");
      if (spec.slug === "virtual-assistance") {
        reasons.push("No course pathway exists for this specialization yet.");
      }
    } else if (spec.slug === "medical-coding-billing") {
      fit = licenseActive ? "strong" : "possible";
      reasons.push(elig?.license || "");
    } else {
      // telehealth-nursing, remote-patient-monitoring, healthcare-data-ai-automation, medical-scribing
      if (licenseActive) {
        fit = "strong";
        reasons.push("Active NMCN license meets the core requirement.");
      } else {
        fit = "not_yet";
        reasons.push("Requires an active NMCN license.");
      }
    }

    if (
      input.careerGoal === "go_international" &&
      (spec.slug === "telehealth-nursing" || spec.slug === "remote-patient-monitoring")
    ) {
      reasons.push(
        "For live clinical roles abroad specifically, you'd also need a license valid in that country — not just NMCN."
      );
    }

    results.push({ slug: spec.slug, title: spec.title, fit, reasons: reasons.filter(Boolean) });
  }

  const order = { strong: 0, possible: 1, not_yet: 2 };
  return results.sort((a, b) => order[a.fit] - order[b.fit]);
}
