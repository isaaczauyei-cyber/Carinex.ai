// lib/data.ts
// Rebuilt from the Carinex Source Pathway Document — main-body content only.
// Nothing from that document's Appendix ("Pending Founder Verification")
// appears here. No field uses the words "verified" or "unverified" — that's
// an internal research-audit distinction, not nurse-facing language.

export type Track = "national" | "global" | "both";
export type WorkMode = "sync" | "async" | "mixed";

export interface Certification {
  name: string;
  body: string;
  note: string;
}

export interface GlobalEmployer {
  name: string;
  note: string;
}

export interface Specialization {
  slug: string;
  title: string;
  track: Track;
  trackDescription: string;
  workMode: WorkMode;
  skills: string[];
  teaser: string;
  whatItIs: string;
  whyItMatters: string;
  dayToDay: string[];
  eligibilityNational: string[];
  eligibilityGlobal: string[];
  certifications: Certification[];
  coursePathway: string[];
  salaryNational: string;
  salaryGlobalRealistic: string;
  salaryGlobalAspirational: string;
  employersNational: string[];
  employersGlobal: GlobalEmployer[];
}

const SALARY_NATIONAL_GAP =
  "Nigeria-specific salary data isn't available yet for this specialization — a real gap we're still researching, so we won't estimate a number until we have one.";

export const specializations: Specialization[] = [
  {
    slug: "telehealth-nursing",
    title: "Telehealth Nursing",
    track: "both",
    trackDescription: "National (strong) + Global (gated by foreign licensure)",
    workMode: "sync",
    skills: ["Patient Assessment", "Virtual Communication", "Digital Health Tools"],
    teaser:
      "Delivering nursing care remotely through video, phone, or chat — the clinical judgment doesn't change, only the channel.",
    whatItIs:
      "Telehealth Nursing is the delivery of nursing care remotely through video, phone, or secure chat — triage, patient consultations, follow-up care, and health education conducted virtually instead of at the bedside. The clinical judgment, the assessment process, and the scope of practice are unchanged; only the channel through which care is delivered changes. Hospital systems increasingly use telehealth nursing to reduce unnecessary emergency room visits and extend specialist reach into underserved areas.",
    whyItMatters:
      "This is the most direct digital extension of clinical nursing skill. For a Nigerian NMCN-licensed nurse, it's the natural first specialization on the National track — it requires no new legal scope of practice, and real Nigerian employers are already hiring for it today.",
    dayToDay: [
      "Conduct virtual triage via phone or secure video, taking systematic symptom histories",
      "Cross-reference clinical guidelines to determine care urgency — emergency dispatch vs. routine scheduling",
      "Handle post-discharge follow-ups and virtual medication reconciliation",
      "Coordinate with physicians on care plans arising from virtual encounters",
    ],
    eligibilityNational: [
      "Active NMCN license",
      "Clinical experience in any setting — no minimum years strictly required",
    ],
    eligibilityGlobal: [
      "NMCN's 2-year post-qualification experience rule applies for any foreign verification",
      "Employers commonly prefer 2–3 years' acute bedside experience (ER/ICU) for confident non-visual assessment",
      "Direct clinical work additionally requires licensure in the patient's own country",
    ],
    certifications: [
      {
        name: "BLS/BCLS (Basic Life Support)",
        body: "American Heart Association / Red Cross",
        note: "A near-universal employer requirement across almost all remote healthcare roles, not just this one.",
      },
    ],
    coursePathway: [
      "Telehealth: Essentials, Teamwork, and Musculoskeletal Exam — Duke (Coursera)",
      "Telehealth Best Practices and Uses — UC Davis Health (Coursera)",
      "Special Communication Situations in Healthcare — Lecturio (Coursera)",
    ],
    salaryNational: SALARY_NATIONAL_GAP,
    salaryGlobalRealistic:
      "The National track is the realistic entry point for now — direct clinical Global-track roles are gated by foreign licensure, not a wage-tier the way non-clinical roles are.",
    salaryGlobalAspirational:
      "US-based/licensed: $85,000–$97,000/year ($38–$52/hr) — requires full US licensure, not accessible from an NMCN license alone.",
    employersNational: ["Reliance Health", "MetroHealth HMO", "Mediplan Healthcare", "LifeBank"],
    employersGlobal: [],
  },
  {
    slug: "remote-patient-monitoring",
    title: "Remote Patient Monitoring (RPM)",
    track: "both",
    trackDescription: "National (strong) + Global (gated by foreign licensure)",
    workMode: "async",
    skills: ["Chronic Care", "Patient Education", "Monitoring Technology"],
    teaser:
      "Reviewing data streamed from connected medical devices and following up with patients whose readings fall outside safe ranges.",
    whatItIs:
      "Remote Patient Monitoring involves reviewing data streamed continuously from connected medical devices — blood pressure cuffs, glucose monitors, pulse oximeters, and wearables — and following up with patients whose readings fall outside safe ranges. It sits at the intersection of clinical judgment and data literacy, reflecting a broader shift in chronic disease management toward continuous, data-driven oversight rather than periodic in-person visits.",
    whyItMatters:
      "As more health systems adopt RPM programs, demand for this skill set is growing structurally. This is a genuinely strong National-track option, with real hiring already confirmed among Nigerian HMOs and health-tech platforms.",
    dayToDay: [
      "Track incoming biometric streams — blood pressure, glucose, heart rhythm, pulse oximetry",
      "Review computer-generated alerts and distinguish real physiological spikes from device errors",
      "Report significant health trends to supervising physicians",
    ],
    eligibilityNational: ["Active NMCN license", "Comfort with digital dashboards and data interpretation"],
    eligibilityGlobal: [
      "Same foreign-licensure gate as Telehealth Nursing",
      "Background as CMA, LPN, or RN depending on the employer's required clinical interpretation depth",
    ],
    certifications: [],
    coursePathway: [
      "Patient Care Technician – Remote Services — University of Florida",
      "Data and Electronic Health Records — Coursera",
    ],
    salaryNational: SALARY_NATIONAL_GAP,
    salaryGlobalRealistic:
      "Not yet confirmed at an entry level accessible from Nigeria — a genuine open gap we're prioritizing.",
    salaryGlobalAspirational:
      "US-based entry-level monitoring technical assistant: $55,000–$65,000/year; a specialized RPM Registered Nurse: $80,000–$95,000/year.",
    employersNational: ["Reliance Health", "LifeBank", "Nigerian HMOs generally"],
    employersGlobal: [],
  },
  {
    slug: "medical-coding-billing",
    title: "Medical Coding & Billing",
    track: "both",
    trackDescription: "National + Global — no clinical license required, the most internationally accessible pathway",
    workMode: "async",
    skills: ["Medical Coding", "Insurance Billing", "Compliance"],
    teaser:
      "Translating clinical documentation into standardized codes for insurance claims — no nursing license required anywhere.",
    whatItIs:
      "Medical Coding & Billing translates clinical documentation into standardized codes (ICD-10-CM for diagnoses, CPT for procedures, HCPCS Level II for supplies) so healthcare services can be billed to insurers. Coders audit medical records, assign the correct codes, compile and submit claims, and manage the administrative follow-up when claims are denied. Unlike every clinical specialization Carinex offers, no nursing or medical license is required to practice — this is structurally the most internationally accessible pathway available.",
    whyItMatters:
      "Most people entering the field start in physician-based (\"pro-fee\") or outpatient coding, not inpatient or specialty coding. Realistic expectations matter here: average training time to become job-ready is around six months, and a first job often involves pre-authorizations, charge entry, or working coding denials before moving into a preferred specialty — a normal on-ramp, not a setback.",
    dayToDay: [
      "Audit medical records and assign standardized diagnostic/procedural codes",
      "Compile and format digital insurance claims for submission",
      "Manage administrative follow-up on claim denials",
      "As experience grows, increasingly involves auditing documentation for completeness",
    ],
    eligibilityNational: ["No clinical license required", "Attention to detail and comfort with rules-based, detail-heavy work"],
    eligibilityGlobal: [
      "No clinical license required internationally either",
      "US employers require training in US-modified code systems (ICD-10-CM/PCS) — confirm which system a target employer uses before assuming direct transferability",
    ],
    certifications: [
      {
        name: "CPC (Certified Professional Coder)",
        body: "AAPC",
        note: "A dedicated international program, with exams offered in 60+ countries via online proctoring or testing centers. Two eligibility paths: 2 years' coding experience, or completion of an AAPC-recognized training program. Sitting the exam with under 2 years' experience earns CPC-A (\"apprentice\") status immediately, upgradeable to full CPC via 2 years' experience or 1 year plus 80 contact hours of a coding course.",
      },
    ],
    coursePathway: [
      "Medical Billing and Coding Fundamentals — MedCerts (Coursera)",
      "Medical Billing and Coding Essentials — Coursera",
    ],
    salaryNational: SALARY_NATIONAL_GAP,
    salaryGlobalRealistic:
      "$6,000–$14,000/year is the international BPO-hub benchmark (Philippines/India) — a Nigeria-specific figure isn't confirmed yet, but this is the right order of magnitude to expect at entry.",
    salaryGlobalAspirational:
      "US median $51,140/year; certified specialists with multiple credentials: $65,000–$81,000+/year. Certified coders earn about 8.5% more on average than non-certified colleagues — real, but a modest premium, not a dramatic jump.",
    employersNational: ["Nigerian HMOs generally", "Active listings confirmed via Himalayas"],
    employersGlobal: [
      {
        name: "Intuitive Global Healthcare",
        note: "A West Africa-based BPO/hospital-management company (operating since 2012, 300+ facilities) explicitly offering medical coding and charge-entry services — the strongest single employer lead found for any specialization.",
      },
      { name: "Himalayas job board", note: "Real, active Nigeria-based coding/billing/EHR talent already found directly on this platform." },
    ],
  },
  {
    slug: "case-management",
    title: "Case Management",
    track: "national",
    trackDescription: "National (strong) + Global (certification path accessible, employment more gated)",
    workMode: "mixed",
    skills: ["Care Coordination", "Compliance Tracking", "Patient Assessment"],
    teaser:
      "Coordinating a patient's care plan across providers, tracking treatment compliance, and preventing costly hospital readmissions.",
    whatItIs:
      "Case Management is the coordination of a patient's care plan across providers — reviewing inpatient admissions criteria (utilization review), authorizing equipment or therapies with insurers, building post-hospital discharge frameworks, and running telephonic follow-up audits to prevent costly hospital readmissions. In the Nigerian context, this typically means working within an HMO's quality-assurance/call-centre function, or an NGO's disease-tracking program.",
    whyItMatters:
      "Named Nigerian employers and NGO programs are actively hiring for this today. The certification layer on top of this role is also more internationally accessible than it might look at first glance — see certifications below.",
    dayToDay: [
      "Review inpatient admissions criteria (Utilization Review)",
      "Coordinate with insurers to authorize equipment or therapies",
      "Build post-hospital discharge frameworks and run telephonic barriers-to-care audits",
    ],
    eligibilityNational: [
      "Active NMCN license",
      "2–5 years post-qualification clinical experience — ICU, emergency, or public health experience most valued",
    ],
    eligibilityGlobal: [
      "Direct US employment requires the full US RN pathway (a nursing degree, NCLEX-RN, state licensure)",
      "The CMGT-BC certification has a separate, genuinely accessible international pathway — see certifications below",
    ],
    certifications: [
      {
        name: "CMGT-BC (Nursing Case Management)",
        body: "ANCC",
        note: "Explicitly allows nurses holding \"the professional, legally recognized equivalent [license] in another country,\" with a dedicated outside-the-U.S. application track. Requires 2 years' experience, 2,000 case-management practice hours, and 30 CE hours — a real bar, but not a nationality or licensing bar. The strongest international certification pathway found for any specialization in this catalog.",
      },
      {
        name: "CCM (Certified Case Manager)",
        body: "CCMC",
        note: "Official eligibility language requires \"current, active, unrestricted licensure in a health or human services discipline\" — doesn't explicitly require a US license, but doesn't explicitly confirm NMCN acceptance either. Worth a direct call to CCMC before treating this as a confirmed option.",
      },
    ],
    coursePathway: [
      "Introduction to Healthcare Management — University of Michigan (Coursera)",
      "GenAI for Patient Care Coordinators and Case Management — Coursera",
      "Epidemics – the Dynamics of Infectious Diseases (or similar) — Coursera",
    ],
    salaryNational: SALARY_NATIONAL_GAP,
    salaryGlobalRealistic:
      "Not yet confirmed at an internationally accessible entry level — a priority follow-up, since the licensing landscape for entry-level roles is still being mapped.",
    salaryGlobalAspirational:
      "US-based: average $47.53/hour (about $98,869/year). Premium cross-border roles with global expat insurers: $70,000–$95,000/year — accessibility to these specific roles from Nigeria isn't confirmed yet.",
    employersNational: ["Reliance Health", "MetroHealth HMO", "Mediplan Healthcare (HMO/QA)", "eHealth Africa", "IHVN (NGO, disease-tracking)"],
    employersGlobal: [],
  },
  {
    slug: "health-content-patient-education",
    title: "Health Content & Patient Education",
    track: "both",
    trackDescription: "National + Global — no clinical license required",
    workMode: "async",
    skills: ["Health Writing", "Patient Education", "Content Strategy"],
    teaser:
      "Writing and producing health education material for patients and digital health platforms — a communication-first role, not a direct-care one.",
    whatItIs:
      "Health Content & Patient Education involves writing and producing health education material for patients and digital health platforms — handouts, app curricula, post-op instruction packets, patient video scripts, and public health campaign content. It's not a licensed field anywhere; what distinguishes a hireable candidate is portfolio quality and, for corporate roles, sometimes a relevant degree.",
    whyItMatters:
      "This lets a nurse use clinical knowledge in a writing/communication-first role, at a genuinely different pace of work than any other specialization in this catalog.",
    dayToDay: [
      "Research, outline, and write consumer-facing healthcare materials",
      "Author app curricula, post-op instruction packets, and patient video scripts",
      "Adapt medical research into digestible public health campaigns",
    ],
    eligibilityNational: [
      "Active NMCN license preferred",
      "Strong written communication skills matter more here than in any other specialization",
    ],
    eligibilityGlobal: [
      "No clinical license required for pure content/writing roles",
      "A bachelor's degree helps for corporate roles; a strong portfolio matters more for freelance work",
    ],
    certifications: [],
    coursePathway: [
      "Foundational Skills for Communicating About Health — University of Michigan (Coursera)",
      "Patient-Centered Care Essentials — Coursera",
    ],
    salaryNational: SALARY_NATIONAL_GAP,
    salaryGlobalRealistic:
      "Freelance: $0.30–$1.00+/word or $50–$100+/hour — genuinely the more realistic entry channel via platforms like Upwork, rather than a corporate role.",
    salaryGlobalAspirational:
      "Corporate roles: $75,000–$105,000/year (US-based) — Nigeria-remote accessibility to these specific corporate roles isn't confirmed yet.",
    employersNational: [],
    employersGlobal: [
      { name: "Freelance platforms (Upwork, health blogs)", note: "Genuinely the most realistic near-term channel — open by design, no geographic gate." },
    ],
  },
  {
    slug: "healthcare-data-ai",
    title: "Healthcare Data & AI Automation",
    track: "global",
    trackDescription: "Primarily Global / tech — no clinical license required for pure data/tech roles",
    workMode: "async",
    skills: ["Healthcare Data", "AI Tools", "Automation"],
    teaser:
      "Using AI-assisted tools to manage clinical documentation, structure healthcare data, and support EHR workflows — a clinical background is an advantage here, not a gap to overcome.",
    whatItIs:
      "This covers using AI-assisted tools to manage clinical documentation, structure healthcare data, and support EHR workflows — querying databases with SQL, building predictive models in Python, designing operational dashboards, and building automation bots. For a nurse, the natural entry point isn't becoming a software engineer — it's Nursing Informatics or a Clinical AI Liaison role, ensuring AI tools genuinely help clinicians instead of creating extra burden.",
    whyItMatters:
      "Tech companies can hire coders easily, but struggle to find people who understand real hospital workflows and charting — that's the real advantage a nursing background brings here. It's also possible to start positioning for this without leaving a current clinical role, by volunteering as a technology \"super user\" or joining a hospital's informatics committee.",
    dayToDay: [
      "Query health databases using SQL",
      "Build predictive clinical models in Python",
      "Design operational hospital dashboards and automation bots to reduce manual entry errors",
      "Evaluate AI tools for clinical safety, usability, and workflow fit — not just technical function",
    ],
    eligibilityNational: ["Active NMCN license", "No AI/data background required to start — the course pathway builds this from a clinical foundation"],
    eligibilityGlobal: [
      "No clinical license required for pure data/tech roles",
      "A degree in health informatics, data science, or computer science is preferred by employers but not always mandatory",
    ],
    certifications: [
      {
        name: "CAHIMS",
        body: "HIMSS",
        note: "The genuinely entry-level HIMSS credential, positioned explicitly \"for early careerists.\" No work-experience requirement if the education route is used — a high school diploma plus 45 hours of relevant continuing education is enough for one eligibility path.",
      },
      {
        name: "AWS Certified AI Practitioner / Azure AI Engineer Associate",
        body: "AWS / Microsoft",
        note: "Globally standardized commercial certifications, with testing infrastructure already present in Nigeria (Lagos Pearson VUE centers). No license or country restriction.",
      },
      {
        name: "Google Advanced Data Analytics Professional Certificate",
        bod
