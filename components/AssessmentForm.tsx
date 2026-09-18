"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRecommendation, AssessmentResult } from "@/lib/assessment";

const backgroundOptions = ["ICU", "Emergency", "Public Health", "Pediatrics", "General Ward", "Other"];

const workStyleOptions = [
  { slug: "telehealth-nursing", label: "Direct virtual patient care (triage, consults)" },
  { slug: "remote-patient-monitoring", label: "Monitoring patient data & device readings" },
  { slug: "medical-coding-billing", label: "Detail-heavy admin work (coding, claims)" },
  { slug: "case-management", label: "Coordinating care plans across providers" },
  { slug: "health-content-patient-education", label: "Writing & health education content" },
  { slug: "healthcare-data-ai", label: "Working with health data, dashboards, or AI tools" },
  { slug: "telemedicine-coordination", label: "Scheduling & patient-liaison logistics" },
  { slug: "virtual-assistance", label: "Administrative support for a medical practice" },
  { slug: "medical-scribing", label: "Real-time documentation during patient visits" },
];

const TOTAL_STEPS = 5;

type AddState = "idle" | "adding" | "added";

export default function AssessmentForm({
  nurseId,
  initialLicenseStatus,
  initialCareerGoal,
  initialEnrolledSlugs = [],
}: {
  nurseId: string;
  initialLicenseStatus: string;
  initialCareerGoal: string;
  initialEnrolledSlugs?: string[];
}) {
  const [step, setStep] = useState(0);
  const [yearsExperience, setYearsExperience] = useState(0);
  const [background, setBackground] = useState<string[]>([]);
  const [licenseStatus, setLicenseStatus] = useState(initialLicenseStatus || "");
  const [careerGoal, setCareerGoal] = useState(initialCareerGoal || "");
  const [workStyle, setWorkStyle] = useState("");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [addState, setAddState] = useState<AddState>(
    result && result.matched && initialEnrolledSlugs.includes(result.slug) ? "added" : "idle"
  );

  function toggleBackground(option: string) {
    setBackground((prev) => (prev.includes(option) ? prev.filter((b) => b !== option) : [...prev, option]));
  }

  const canAdvance = [true, background.length > 0, licenseStatus !== "", careerGoal !== "", workStyle !== ""][step];

  function goNext() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }
  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("nurse_profiles")
      .update({ license_status: licenseStatus, career_goal: careerGoal, clinical_background: background })
      .eq("id", nurseId);
    await supabase
      .from("users")
      .update({ years_experience: yearsExperience })
      .eq("id", (await supabase.auth.getUser()).data.user?.id);

    setSaving(false);
    const rec = getRecommendation({ yearsExperience, clinicalBackground: background, licenseStatus, careerGoal, workStyle });
    setResult(rec);
    if (rec.matched && initialEnrolledSlugs.includes(rec.slug)) setAddState("added");
  }

  async function addInterest(slug: string) {
    setAddState("adding");
    const supabase = createClient();
    const { data: spec } = await supabase.from("specializations").select("id").eq("slug", slug).maybeSingle();

    if (!spec) {
      setAddState("idle");
      return;
    }

    const { error } = await supabase
      .from("nurse_specializations")
      .upsert({ nurse_id: nurseId, specialization_id: spec.id }, { onConflict: "nurse_id,specialization_id" });

    setAddState(error ? "idle" : "added");
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        {result.matched ? (
          <>
            <div className="flex items-center gap-2 rounded-xl bg-carinex-emerald/10 px-4 py-3">
              <span className="text-lg">✨</span>
              <p className="text-sm font-semibold text-carinex-navy">Your best-fit specialization</p>
            </div>
            <div className="rounded-xl border border-carinex-emerald/30 bg-carinex-emerald/5 p-6">
              <p className="text-xl font-bold text-carinex-navy">{result.title}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {result.reasons.map((reason, i) => (
                  <li key={i} className="text-sm text-carinex-navy/70">· {reason}</li>
                ))}
              </ul>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href={`/pathways/${result.slug}`}
                  className="rounded-full bg-carinex-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-carinex-navy/90"
                >
                  View pathway
                </a>
                <button
                  onClick={() => addInterest(result.slug)}
                  disabled={addState !== "idle"}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    addState === "added"
                      ? "bg-carinex-emerald/10 text-carinex-emerald"
                      : "border border-carinex-navy/20 text-carinex-navy hover:bg-carinex-navy/5"
                  } disabled:cursor-default`}
                >
                  {addState === "added" ? "Added ✓" : addState === "adding" ? "Adding…" : "Add to my pathways"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-lg font-bold text-amber-900">Not quite ready for a match yet</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {result.blockedReasons.map((reason, i) => (
                <li key={i} className="text-sm text-amber-900/80">· {reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-carinex-navy/10">
            <div className={`h-full rounded-full bg-carinex-emerald transition-all duration-300 ${i <= step ? "w-full" : "w-0"}`} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-carinex-navy/40">Step {step + 1} of {TOTAL_STEPS}</p>

      <div key={step} className="mt-6 animate-[fadeIn_0.25s_ease-out]">
        {step === 0 && (
          <div>
            <label className="text-lg font-bold text-carinex-navy">How many years of clinical experience do you have?</label>
            <p className="mt-1 text-sm text-carinex-navy/50">Count post-qualification, hands-on years.</p>
            <input
              type="number"
              min={0}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(Number(e.target.value))}
              className="mt-4 w-full rounded-lg border border-carinex-navy/20 px-4 py-3 text-lg focus:border-carinex-emerald focus:outline-none"
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <label className="text-lg font-bold text-carinex-navy">What's your clinical background?</label>
            <p className="mt-1 text-sm text-carinex-navy/50">Select all that apply.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {backgroundOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => toggleBackground(option)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                    background.includes(option)
                      ? "border-carinex-emerald bg-carinex-emerald/10 text-carinex-emerald"
                      : "border-carinex-navy/20 text-carinex-navy/70 hover:border-carinex-navy/40"
                  }`}
                >
                  {background.includes(option) ? "✓ " : ""}
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="text-lg font-bold text-carinex-navy">What's your NMCN license status?</label>
            <div className="mt-4 flex flex-col gap-2">
              {[
                { value: "active", label: "Active" },
                { value: "provisional", label: "Provisional" },
                { value: "backlog", label: "Backlog / in process" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setLicenseStatus(opt.value)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                    licenseStatus === opt.value
                      ? "border-carinex-emerald bg-carinex-emerald/10 text-carinex-emerald"
                      : "border-carinex-navy/20 text-carinex-navy/70 hover:border-carinex-navy/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="text-lg font-bold text-carinex-navy">What's your career goal?</label>
            <div className="mt-4 flex flex-col gap-2">
              {[
                { value: "stay_nigeria", label: "Stay in Nigeria" },
                { value: "go_international", label: "Go international" },
                { value: "not_sure", label: "Not sure yet" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setCareerGoal(opt.value)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                    careerGoal === opt.value
                      ? "border-carinex-emerald bg-carinex-emerald/10 text-carinex-emerald"
                      : "border-carinex-navy/20 text-carinex-navy/70 hover:border-carinex-navy/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <label className="text-lg font-bold text-carinex-navy">What kind of work appeals to you most?</label>
            <p className="mt-1 text-sm text-carinex-navy/50">Pick the one that sounds most like you.</p>
            <div className="mt-4 flex flex-col gap-2">
              {workStyleOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.slug}
                  onClick={() => setWorkStyle(opt.slug)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                    workStyle === opt.slug
                      ? "border-carinex-emerald bg-carinex-emerald/10 text-carinex-emerald"
                      : "border-carinex-navy/20 text-carinex-navy/70 hover:border-carinex-navy/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button type="button" onClick={goBack} className="text-sm font-semibold text-carinex-navy/60 hover:text-carinex-navy">
            ← Back
          </button>
        ) : (
          <span />
        )}

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvance}
            className="rounded-full bg-carinex-navy px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !canAdvance}
            className="rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Thinking…" : "See my recommendation"}
          </button>
        )}
      </div>
    </div>
  );
}
