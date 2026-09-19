"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const backgroundOptions = ["ICU", "Emergency", "Public Health", "Pediatrics", "General Ward", "Other"];

export default function OnboardingForm({
  userId,
  nurseId,
  initialFirstName,
  initialLastName,
}: {
  userId: string;
  nurseId: string;
  initialFirstName: string;
  initialLastName: string;
}) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [licenseStatus, setLicenseStatus] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [availability, setAvailability] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [background, setBackground] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleBackground(option: string) {
    setBackground((prev) =>
      prev.includes(option) ? prev.filter((b) => b !== option) : [...prev, option]
    );
  }

  async function saveBasics() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return false;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();
    const fullName = `${firstName} ${lastName}`.trim();

    const { error: userError } = await supabase
      .from("users")
      .update({ first_name: firstName, last_name: lastName, full_name: fullName, years_experience: yearsExperience })
      .eq("id", userId);

    if (userError) {
      setSaving(false);
      setError(userError.message);
      return false;
    }

    const { error: profileError } = await supabase
      .from("nurse_profiles")
      .update({
        license_status: licenseStatus || null,
        career_goal: careerGoal || null,
        availability: availability || null,
        clinical_background: background,
        onboarding_completed: true,
      })
      .eq("id", nurseId);

    setSaving(false);

    if (profileError) {
      setError(profileError.message);
      return false;
    }

    return true;
  }

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const ok = await saveBasics();
    if (ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleSkip() {
    const ok = await saveBasics();
    if (ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleContinue} className="flex flex-col gap-5">
      <div className="flex gap-3">
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          className="w-1/2 rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          className="w-1/2 rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
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

      <div>
        <label className="text-sm font-medium text-carinex-navy">Availability</label>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        >
          <option value="">Select one</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>

      <div className="border-t border-carinex-navy/10 pt-5">
        <p className="text-sm font-semibold text-carinex-navy">A couple more — helps us personalize your dashboard</p>

        <label className="mt-3 block text-sm font-medium text-carinex-navy">Years of experience</label>
        <input
          type="number"
          min={0}
          value={yearsExperience}
          onChange={(e) => setYearsExperience(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />

        <label className="mt-4 block text-sm font-medium text-carinex-navy">Clinical background (select any)</label>
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

        <p className="mt-4 text-sm text-carinex-navy/60">
          Once you&apos;re in, take the full career assessment from your dashboard to get
          matched to your single best-fit specialization.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-carinex-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue to dashboard"}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={saving}
          className="text-sm font-semibold text-carinex-navy/60 hover:text-carinex-navy disabled:opacity-60"
        >
          Skip for now
        </button>
      </div>
    </form>
  );
}
