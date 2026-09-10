"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRecommendations, Recommendation } from "@/lib/assessment";

const backgroundOptions = ["ICU", "Emergency", "Public Health", "Pediatrics", "General Ward", "Other"];

const fitStyles: Record<string, string> = {
  strong: "bg-carinex-emerald/10 text-carinex-emerald",
  possible: "bg-amber-50 text-amber-700",
  not_yet: "bg-carinex-navy/5 text-carinex-navy/50",
};

const fitLabels: Record<string, string> = {
  strong: "Strong fit",
  possible: "Possible fit",
  not_yet: "Not yet",
};

const TOTAL_STEPS = 4;

export default function AssessmentForm({
  nurseId,
  initialLicenseStatus,
  initialCareerGoal,
}: {
  nurseId: string;
  initialLicenseStatus: string;
  initialCareerGoal: string;
}) {
  const [step, setStep] = useState(0);
  const [yearsExperience, setYearsExperience] = useState(0);
  const [background, setBackground] = useState<string[]>([]);
  const [licenseStatus, setLicenseStatus] = useState(initialLicenseStatus || "");
  const [careerGoal, setCareerGoal] = useState(initialCareerGoal || "");
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleBackground(option: string) {
    setBackground((prev) =>
      prev.includes(option) ? prev.filter((b) => b !== option) : [...prev, option]
    );
  }

  const canAdvance = [
    true, // years is a number, always valid
    background.length > 0,
    licenseStatus !== "",
    careerGoal !== "",
  ][step];

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
    await supabase.from("users").update({ years_experience: yearsExperience }).eq(
      "id",
      (await supabase.auth.getUser()).data.user?.id
    );

    setSaving(false);
    setResults(getRecommendations({ yearsExperience, clinicalBackground: background, careerGoal, licenseStatus }));
  }

  async function addInterest(slug: string) {
    const supabase = createClient();
    const { data: spec } = await supabase.from("specializations").select("id").eq("slug", slug).maybeSingle();
    if (spec) {
      await supabase
        .from("nurse_specializations")
        .upsert({ nurse_id: nurseId, specialization_id: spec.id }, { onConflict: "nurse_id,specialization_id" });
    }
  }

  if (results) {
    const strongCount = results.filter((r) => r.fit === "strong").length;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-carinex-emerald/10 px-4 py-3">
          <span className="text-lg">✨</span>
          <p className="text-sm font-semibold text-carinex-navy">
            {strongCount > 0
              ? `You're a strong fit for ${strongCount} pathway${strongCount > 1 ? "s" : ""} already.`
              : "Here's where you stand — and what closes the gap."}
          </p>
        </div>
        <p className="text-sm text-carinex-navy/60">
          Based on what you shared — no scores, just what the actual requirements say.
        </p>
        {results.map((r) => (
          <div key={r.slug} className="rounded-xl border border-carinex-navy/10 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-carinex-navy">{r.title}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${fitStyles[r.fit]}`}>
                {fitLabels[r.fit]}
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {r.reasons.map((reason, i) => (
                <li key={i} className="text-sm text-carinex-navy/70">
                  · {reason}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-3">
              <a href={`/pathways/${r.slug}`} className="text-sm font-semibold text-carinex-emerald hover:underline">
                View pathway →
              </a>
              {r.fit !== "not_yet" && (
                <button
                  onClick={() => addInterest(r.slug)}
                  className="text-sm font-semibold text-carinex-navy hover:underline"
                >
                  Add to my pathways
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-carinex-navy/10">
            <div
              className={`h-full rounded-full bg-carinex-emerald transition-all duration-300 ${
                i <= step ? "w-full" : "w-0"
              }`}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-carinex-navy/40">
        Step {step + 1} of {TOTAL_STEPS}
      </p>

      <div key={step} className="mt-6 animate-[fadeIn_0.25s_ease-out]">
        {step === 0 && (
          <div>
            <label className="text-lg font-bold text-carinex-navy">
              How many years of clinical experience do you have?
            </label>
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
            <label className="text-lg font-bold text-carinex-navy">
              What's your clinical background?
            </label>
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
            <label className="text-lg font-bold text-carinex-navy">
              What's your NMCN license status?
            </label>
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
      </div>

      <div className="mt-8 flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="text-sm font-semibold text-carinex-navy/60 hover:text-carinex-navy"
          >
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
            {saving ? "Thinking…" : "See my recommendations"}
          </button>
        )}
      </div>
    </div>
  );
}
