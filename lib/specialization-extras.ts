export type EvidenceTier = "strong" | "gated" | "moderate" | "weak";

type Extras = {
  evidence: { tier: EvidenceTier; label: string }[];
  globalCaveat?: string;
};

export const specializationExtras: Record<string, Extras> = {
  "telehealth-nursing": {
    evidence: [
      { tier: "strong", label: "Strong (National)" },
      { tier: "gated", label: "Gated (Global)" },
    ],
    globalCaveat:
      "Completing this roadmap prepares you for the work, but does not itself grant a foreign nursing license. Live clinical telehealth roles abroad require the patient's own country's nursing license — there is no international licensing compact. Guidance on foreign-licensing pathways (like the NCLEX-RN for the US) is planned as a future addition.",
  },
  "remote-patient-monitoring": {
    evidence: [
      { tier: "strong", label: "Strong (National)" },
      { tier: "gated", label: "Gated (Global)" },
    ],
    globalCaveat:
      "As with Telehealth Nursing, completing this roadmap does not grant a foreign nursing license. Global-track RPM roles involving direct clinical oversight require the patient's own country's license. National-track RPM is directly accessible with an active NMCN license.",
  },
  "medical-coding-billing": {
    evidence: [{ tier: "strong", label: "Strong" }],
  },
  "case-management": {
    evidence: [
      { tier: "strong", label: "Strong (National)" },
      { tier: "moderate", label: "Global — certification path accessible" },
    ],
    globalCaveat:
      "Direct employment with a US case management team requires the full US RN pathway (a nursing degree, the NCLEX-RN exam, and state licensure) — NMCN licensure doesn't substitute for this. However, the CMGT-BC certification that sits on top of that role has its own international application track that doesn't require a US license, which matters for a longer-horizon global strategy even while direct US employment stays out of reach for now.",
  },
  "health-content-patient-education": {
    evidence: [{ tier: "weak", label: "Weak — course-ready, employer leads still thin" }],
  },
  "healthcare-data-ai": {
    evidence: [{ tier: "moderate", label: "Moderate" }],
  },
  "telemedicine-coordination": {
    evidence: [{ tier: "weak", label: "Weak — certification path is solid, employer demand unconfirmed" }],
  },
  "virtual-assistance": {
    evidence: [{ tier: "moderate", label: "Moderate" }],
  },
  "medical-scribing": {
    evidence: [{ tier: "moderate", label: "Moderate" }],
  },
};

export const tierStyles: Record<EvidenceTier, string> = {
  strong: "bg-carinex-emerald/10 text-carinex-emerald",
  gated: "bg-amber-50 text-amber-700",
  moderate: "bg-sky-50 text-sky-700",
  weak: "bg-red-50 text-red-700",
};
