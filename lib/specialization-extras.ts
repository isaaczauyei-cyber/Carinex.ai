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
