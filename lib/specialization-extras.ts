export type EvidenceTier = "strong" | "gated" | "moderate" | "weak";

type Extras = {
  evidence: { tier: EvidenceTier; label: string }[];
  globalCaveat?: string;
};

export const specializationExtras: Record<string, Extras> = {
  "telehealth-nursing": {
    evidence: [
      { tier: "gated", label: "Gated (Global)" },
      { tier: "strong", label: "Strong (National)" },
    ],
    globalCaveat:
      "Completing this roadmap prepares you for the work, but does not itself grant a foreign nursing license. Live clinical telehealth roles abroad (e.g. with Teladoc, Amwell, MDLIVE) require the patient's own country's nursing license — there is no international licensing compact. Look into that country's own licensing pathway (e.g. NCLEX-RN for the US) before applying to clinical roles specifically.",
  },
  "remote-patient-monitoring": {
    evidence: [
      { tier: "gated", label: "Gated (Global)" },
      { tier: "strong", label: "Strong (National)" },
    ],
    globalCaveat:
      "As with Telehealth Nursing, completing this roadmap does not grant a foreign nursing license. Global-track RPM roles involving direct clinical oversight require the patient's own country's license. National-track RPM (Nigerian HMOs/health-tech) is directly accessible with an active NMCN license.",
  },
  "telemedicine-coordination": {
    evidence: [{ tier: "weak", label: "Weak — needs employer outreach" }],
  },
  "healthcare-data-ai-automation": {
    evidence: [{ tier: "moderate", label: "Moderate" }],
  },
  "medical-scribing": {
    evidence: [{ tier: "moderate", label: "Moderate" }],
  },
  "virtual-assistance": {
    evidence: [{ tier: "moderate", label: "Moderate" }],
  },
  "medical-coding-billing": {
    evidence: [{ tier: "strong", label: "Strong" }],
  },
  "case-management": {
    evidence: [{ tier: "strong", label: "Strong (National)" }],
  },
};

export const tierStyles: Record<EvidenceTier, string> = {
  strong: "bg-carinex-emerald/10 text-carinex-emerald",
  gated: "bg-amber-50 text-amber-700",
  moderate: "bg-sky-50 text-sky-700",
  weak: "bg-red-50 text-red-700",
};
export type Eligibility = {
  license: string;
  experience: string | null;
  keyTraits: string;
};

export const specializationEligibility: Record<string, Eligibility> = {
  "telehealth-nursing": {
    license: "Active NMCN license required.",
    experience: "No prior remote-work experience needed, but clinical experience in any setting is expected.",
    keyTraits: "Comfort with video/phone consultations and real-time triage decisions.",
  },
  "remote-patient-monitoring": {
    license: "Active NMCN license required.",
    experience: null,
    keyTraits: "Comfort with digital dashboards and data interpretation matters more here than in bedside-equivalent roles.",
  },
  "telemedicine-coordination": {
    license: "Active NMCN license preferred, not strictly required.",
    experience: null,
    keyTraits: "Strong communication and organizational skills are the core requirement — this role is coordination-first.",
  },
  "healthcare-data-ai-automation": {
    license: "Active NMCN license required.",
    experience: null,
    keyTraits: "No AI/data background required to start — the course pathway is designed to build this from a clinical foundation.",
  },
  "medical-scribing": {
    license: "Active NMCN license required.",
    experience: null,
    keyTraits: "Strong typing speed and medical terminology fluency matter more here than in most other specializations.",
  },
  "virtual-assistance": {
    license: "Active NMCN license preferred — adds credibility even though the role itself is non-clinical.",
    experience: null,
    keyTraits: "This is the most accessible specialization for nurses newer to remote work generally.",
  },
  "medical-coding-billing": {
    license: "Active NMCN license preferred.",
    experience: null,
    keyTraits: "Rewards attention to detail and comfort with rules-based, detail-heavy work.",
  },
  "case-management": {
    license: "Active NMCN license required.",
    experience: "2–5 years post-qualification clinical experience — ICU, emergency, or public health experience most valued.",
    keyTraits: "This is a stricter experience gate than most other specializations — worth confirming you meet it before starting the courses below.",
  },
};
