// lib/data.ts
// Carinex — static data for Sprints 1–3 (frontend-only). Once Sprint 4 wires up
// Supabase, these arrays get replaced by queries against the `specializations`
// and `jobs` tables from the MVP Technical Spec — keep the field names aligned
// so that swap is a data-source change, not a component rewrite.

export type Track = "national" | "global" | "both";
export type WorkMode = "sync" | "async" | "mixed";

export interface Specialization {
  slug: string;
  title: string;
  whatItIs: string;
  whyItMatters: string;
  dayToDay: string;
  eligibilityGate: string;
  track: Track;
  workMode: WorkMode;
  skills: string[];
}

export const specializations: Specialization[] = [
  {
    slug: "telehealth-nursing",
    title: "Telehealth Nursing",
    whatItIs:
      "Delivering nursing care remotely through video, phone, or chat — triage, patient consults, follow-up care, and health education conducted virtually instead of at the bedside.",
    whyItMatters:
      "This is the most direct digital extension of clinical nursing skill — the care itself doesn't change, only the channel.",
    dayToDay:
      "Scheduled video/phone consultations, real-time symptom triage, documenting encounters in an EHR, coordinating with physicians on care plans.",
    eligibilityGate:
      "Active NMCN license required. Clinical experience in any setting is expected.",
    track: "both",
    workMode: "sync",
    skills: ["Patient Assessment", "Virtual Communication", "Digital Health Tools"],
  },
  {
    slug: "remote-patient-monitoring",
    title: "Remote Patient Monitoring",
    whatItIs:
      "Reviewing data streamed from connected medical devices and following up with patients whose readings fall outside safe ranges.",
    whyItMatters:
      "Chronic disease management is shifting toward continuous monitoring rather than periodic visits.",
    dayToDay:
      "Reviewing device dashboards, flagging abnormal readings, calling patients to check in, documenting trends over time.",
    eligibilityGate: "Active NMCN license. Comfort with digital dashboards matters here.",
    track: "both",
    workMode: "async",
    skills: ["Chronic Care", "Patient Education", "Monitoring Technology"],
  },
  {
    slug: "telemedicine-coordination",
    title: "Telemedicine Coordination",
    whatItIs:
      "The scheduling, logistics, and patient-liaison layer that makes telemedicine visits actually happen.",
    whyItMatters:
      "Every telehealth program needs someone managing the operational flow, not just the clinical encounter.",
    dayToDay:
      "Scheduling and confirming virtual appointments, pre-visit patient prep, post-visit follow-up coordination.",
    eligibilityGate: "Active NMCN license preferred; strong communication and organizational skills required.",
    track: "both",
    workMode: "async",
    skills: ["Scheduling", "Patient Liaison", "Care Team Coordination"],
  },
  {
    slug: "healthcare-data-ai",
    title: "Healthcare Data & AI Automation",
    whatItIs:
      "Using AI-assisted tools to manage clinical documentation, structure healthcare data, and support EHR workflows.",
    whyItMatters:
      "The fastest-growing specialization in terms of new tooling — a real differentiator in a crowded remote job market.",
    dayToDay:
      "Using AI tools to generate or clean up clinical documentation, structuring health data, quality-checking AI-generated notes.",
    eligibilityGate: "Active NMCN license. No AI/data background required to start.",
    track: "global",
    workMode: "async",
    skills: ["Healthcare Data", "AI Tools", "Automation"],
  },
  {
    slug: "medical-scribing",
    title: "Medical Scribing",
    whatItIs:
      "Real-time clinical documentation during a patient encounter, capturing the visit in the EHR.",
    whyItMatters:
      "One of the most established remote healthcare roles internationally, with a clear, recognized credentialing path.",
    dayToDay:
      "Documenting encounters in real time, structuring notes to EHR standards, flagging items for physician follow-up.",
    eligibilityGate: "Active NMCN license. Strong typing speed and medical terminology fluency matter most.",
    track: "global",
    workMode: "sync",
    skills: ["Medical Terminology", "Real-Time Documentation", "EHR Systems"],
  },
  {
    slug: "virtual-assistance",
    title: "Virtual Assistance",
    whatItIs:
      "Administrative and coordination support for healthcare practices — scheduling, patient communication, inbox management.",
    whyItMatters: "Lower barrier to entry than clinical-documentation-heavy roles.",
    dayToDay: "Managing appointment calendars, responding to patient inquiries, handling billing correspondence.",
    eligibilityGate: "Active NMCN license preferred — the most accessible specialization for nurses newer to remote work.",
    track: "both",
    workMode: "async",
    skills: ["Scheduling", "Patient Support", "EHR Systems"],
  },
  {
    slug: "medical-coding-billing",
    title: "Medical Coding & Billing",
    whatItIs:
      "Translating clinical documentation into standardized codes (ICD-10, CPT) for insurance claims and reimbursement.",
    whyItMatters: "A stable, well-defined back-office function with consistent demand from HMOs and international operations.",
    dayToDay: "Reviewing clinical notes and assigning codes, submitting claims, following up on denials.",
    eligibilityGate: "Active NMCN license preferred. Rewards attention to detail.",
    track: "both",
    workMode: "async",
    skills: ["Medical Coding", "Insurance Billing", "Compliance"],
  },
  {
    slug: "case-management",
    title: "Case Management",
    whatItIs:
      "Coordinating a patient's care plan across providers and tracking treatment compliance.",
    whyItMatters: "Named Nigerian employers and NGO programs are actively hiring for this today.",
    dayToDay: "HMO call-centre/QA case review, telephone-based patient assessment, or NGO disease-program tracking.",
    eligibilityGate: "Active NMCN license plus 2–5 years post-qualification clinical experience.",
    track: "national",
    workMode: "mixed",
    skills: ["Care Coordination", "Compliance Tracking", "Patient Assessment"],
  },
];

export function getSpecializationBySlug(slug: string) {
  return specializations.find((s) => s.slug === slug);
}

// --- Opportunities (lean "Opportunity Intelligence" preview) ---
// Illustrative sample data only — see Job Catalog doc. Do not treat these as
// real openings; replace with real listings before this leaves prototype stage.

export interface Opportunity {
  id: string;
  title: string;
  employer: string;
  specializationSlug: string;
  track: Track;
  workMode: WorkMode;
  locationRestriction: string;
  eligibilityRequirements: string[];
  status: "open" | "closed";
}

export const opportunities: Opportunity[] = [
  {
    id: "sample-1",
    title: "Call Centre Nurse — Case Management",
    employer: "Nigerian HMO",
    specializationSlug: "case-management",
    track: "national",
    workMode: "sync",
    locationRestriction: "Nigeria-based only",
    eligibilityRequirements: ["Active NMCN license", "2+ years clinical experience", "Reliable backup power/internet"],
    status: "open",
  },
  {
    id: "sample-2",
    title: "Remote Medical Scribe (Contract)",
    employer: "US-based telehealth staffing company",
    specializationSlug: "medical-scribing",
    track: "global",
    workMode: "sync",
    locationRestriction: "Open worldwide",
    eligibilityRequirements: ["Active NMCN license", "Strong typing speed", "Medical terminology fluency"],
    status: "open",
  },
  {
    id: "sample-3",
    title: "Care Coordinator — Disease Program Tracking",
    employer: "NGO",
    specializationSlug: "case-management",
    track: "national",
    workMode: "async",
    locationRestriction: "Nigeria-based only",
    eligibilityRequirements: ["Active NMCN license", "Public health experience preferred"],
    status: "open",
  },
];

/**
 * Lean eligibility check — a simple rule match, not a scoring engine.
 * Compares a nurse's license status against a job's stated requirements text.
 * See MVP Technical Spec Section 5, item 9.
 */
export function checkEligibility(
  nurseLicenseActive: boolean,
  opportunity: Opportunity
): "likely-eligible" | "check-requirements" {
  const requiresActiveLicense = opportunity.eligibilityRequirements.some((r) =>
    r.toLowerCase().includes("active nmcn license")
  );
  if (requiresActiveLicense && !nurseLicenseActive) return "check-requirements";
  return "likely-eligible";
}
