import { specializations } from "@/lib/data";
import { specializationExtras } from "@/lib/specialization-extras";

export type AssessmentInput = {
  yearsExperience: number;
  clinicalBackground: string[];
  licenseStatus: string;
  careerGoal: string;
  workStyle: string; // a specialization slug — the nurse's direct preference
};

export type AssessmentResult =
  | {
      matched: true;
      slug: string;
      title: string;
      reasons: string[];
    }
  | {
      matched: false;
      blockedReasons: string[];
    };

const CASE_MGMT_BACKGROUNDS = ["ICU", "Emergency", "Public Health"];

const LICENSE_REQUIRED = new Set([
  "telehealth-nursing",
  "remote-patient-monitoring",
  "healthcare-data-ai",
  "medical-scribing",
  "case-management",
]);

const GLOBAL_STRONG = new Set(["medical-coding-billing", "medical-scribing", "healthcare-data-ai"]);
const NATIONAL_STRONG = new Set(["telehealth-nursing", "remote-patient-monitoring", "case-management"]);

const CATEGORY: Record<string, string> = {
  "telehealth-nursing": "clinical",
  "remote-patient-monitoring": "clinical",
  "case-management": "coordination",
  "telemedicine-coordination": "coordination",
  "medical-coding-billing": "admin",
  "virtual-assistance": "admin",
  "health-content-patient-education": "writing",
  "healthcare-data-ai": "tech",
  "medical-scribing": "documentation",
};

const TIER_SCORE: Record<string, number> = { strong: 2, moderate: 1, weak: 0, gated: 0 };

function isEligible(slug: string, input: AssessmentInput): { eligible: boolean; reason: string } {
  const licenseActive = input.licenseStatus === "active";

  if (LICENSE_REQUIRED.has(slug) && !licenseActive) {
    return { eligible: false, reason: "Requires an active NMCN license." };
  }

  if (slug === "case-management") {
    const hasBackground = input.clinicalBackground.some((b) => CASE_MGMT_BACKGROUNDS.includes(b));
    if (input.yearsExperience < 2) {
      return { eligible: false, reason: `Case Management needs 2–5 years post-qualification experience — you're at ${input.yearsExperience}.` };
    }
    if (!hasBackground) {
      return { eligible: false, reason: "Case Management most values ICU, Emergency, or Public Health background." };
    }
  }

  return { eligible: true, reason: "" };
}

function bestEvidenceTier(slug: string): string {
  const evidence = specializationExtras[slug]?.evidence || [];
  return evidence.reduce((best, e) => (TIER_SCORE[e.tier] > TIER_SCORE[best] ? e.tier : best), "weak");
}

function alignmentScore(slug: string, input: AssessmentInput, originalCategory: string): number {
  let score = 0;
  if (input.careerGoal === "go_international" && GLOBAL_STRONG.has(slug)) score += 2;
  if (input.careerGoal === "stay_nigeria" && NATIONAL_STRONG.has(slug)) score += 2;
  if (CATEGORY[slug] === originalCategory) score += 2;
  score += TIER_SCORE[bestEvidenceTier(slug)];
  return score;
}

export function getRecommendation(input: AssessmentInput): AssessmentResult {
  const originalPick = specializations.find((s) => s.slug === input.workStyle);
  if (!originalPick) {
    return { matched: false, blockedReasons: ["Select a work style to continue."] };
  }

  const originalEligibility = isEligible(originalPick.slug, input);
  if (originalEligibility.eligible) {
    const reasons: string[] = [`This is the work style you told us fits you best.`];
    if (LICENSE_REQUIRED.has(originalPick.slug)) {
      reasons.push("Your active NMCN license meets the core requirement.");
    }
    if (originalPick.slug === "case-management") {
      reasons.push(`Your ${input.yearsExperience}+ years in ${input.clinicalBackground.filter((b) => CASE_MGMT_BACKGROUNDS.includes(b)).join(", ")} meets the experience bar.`);
    }
    if (input.careerGoal === "go_international" && (originalPick.slug === "telehealth-nursing" || originalPick.slug === "remote-patient-monitoring")) {
      reasons.push("For live clinical roles abroad specifically, you'd also need a license valid in that country — not just NMCN.");
    }
    return { matched: true, slug: originalPick.slug, title: originalPick.title, reasons };
  }

  // Original pick isn't eligible yet — find the closest eligible alternative.
  const originalCategory = CATEGORY[originalPick.slug];
  const candidates = specializations
    .filter((s) => s.slug !== originalPick.slug)
    .map((s) => ({ spec: s, ...isEligible(s.slug, input) }))
    .filter((c) => c.eligible)
    .map((c) => ({ ...c, score: alignmentScore(c.spec.slug, input, originalCategory) }))
    .sort((a, b) => b.score - a.score || a.spec.slug.localeCompare(b.spec.slug));

  if (candidates.length === 0) {
    return {
      matched: false,
      blockedReasons: [
        `${originalPick.title} isn't accessible yet: ${originalEligibility.reason}`,
        "No other specialization is a fit yet either based on what you've shared — this usually means getting your NMCN license active first.",
      ],
    };
  }

  const best = candidates[0];
  return {
    matched: true,
    slug: best.spec.slug,
    title: best.spec.title,
    reasons: [
      `You picked ${originalPick.title}, but that's not accessible yet: ${originalEligibility.reason}`,
      `${best.spec.title} is the closest strong match to what you're looking for, and you meet its requirements today.`,
    ],
  };
}
