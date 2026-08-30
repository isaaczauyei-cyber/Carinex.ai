"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();
    const fullName = `${firstName} ${lastName}`.trim();

    const { error: userError } = await supabase
      .from("users")
      .update({ first_name: firstName, last_name: lastName, full_name: fullName })
      .eq("id", userId);

    if (userError) {
      setSaving(false);
      setError(userError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from("nurse_profiles")
      .update({
        license_status: licenseStatus || null,
        career_goal: careerGoal || null,
        availability: availability || null,
        onboarding_completed: true,
      })
      .eq("id", nurseId);

    setSaving(false);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        <label className="text-sm font-medium text-carinex-navy">What&apos;s your career goal?</label>
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-carinex-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Continue to dashboard"}
      </button>
    </form>
  );
      }
