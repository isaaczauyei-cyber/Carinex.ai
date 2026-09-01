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

export default function AssessmentForm({
  nurseId,
  initialLicenseStatus,
  initialCareerGoal,
}: {
  nurseId: string;
  initialLicenseStatus: string;
  initialCareerGoal: string;
}) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    await supabase
      .from("nurse_profiles")
      .update({ license_status: licenseStatus, career_goal: careerGoal, clinical_background: background })
      .eq("id", nurseId);
    await supabase.auth.updateUser({ data: {} }); // no-op, keeps session fresh
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
    return (
      <div className="flex flex-col gap-4">
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="text-sm font-medium text-carinex-navy">Years of experience</label>
        <input
          type="number"
          min={0}
          value={yearsExperience}
          onChange={(e) => setYearsExperience(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">Clinical background (select any)</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {backgroundOptions.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => toggleBackground(option)}
              className={`rounded-full border px-4 py-2 text-sm ${
                background.includes(option)
                  ? "border-carinex-emerald bg-carinex-emerald/10 text-carinex-emerald"
                  : "border-carinex-navy/20 text-carinex-navy/70"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">NMCN license status</label>
        <select
          value={licenseStatus}
          onChange={(e) => setLicenseStatus(e.target.value)}
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        >
          <option value="">Select one</option>
          <option value="active">Active</option>
          <option value="provisional">Provisional</option>
          <option value="backlog">Backlog / in process</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">Career goal</label>
        <select
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        >
          <option value="">Select one</option>
          <option value="stay_nigeria">Stay in Nigeria</option>
          <option value="go_international">Go international</option>
          <option value="not_sure">Not sure yet</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-carinex-white disabled:opacity-60"
      >
        {saving ? "Thinking…" : "See my recommendations"}
      </button>
    </form>
  );
      }
