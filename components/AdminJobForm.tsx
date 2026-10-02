"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Employer = { id: string; company_name: string };
type Specialization = { id: number; name: string };

export default function AdminJobForm({
  employers,
  specializations,
}: {
  employers: Employer[];
  specializations: Specialization[];
}) {
  const router = useRouter();

  const [employerMode, setEmployerMode] = useState<"existing" | "new">(
    employers.length > 0 ? "existing" : "new"
  );
  const [employerId, setEmployerId] = useState(employers[0]?.id || "");
  const [newEmployerName, setNewEmployerName] = useState("");
  const [newEmployerWebsite, setNewEmployerWebsite] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trackType, setTrackType] = useState("national");
  const [specializationId, setSpecializationId] = useState(specializations[0]?.id?.toString() || "");
  const [workMode, setWorkMode] = useState("async");
  const [currency, setCurrency] = useState("NGN");
  const [eligibilityRequirements, setEligibilityRequirements] = useState("");
  const [locationRestriction, setLocationRestriction] = useState("");
  const [externalApplyUrl, setExternalApplyUrl] = useState("");
  const [status, setStatus] = useState("pending_review");
  const [requiresForeignLicense, setRequiresForeignLicense] = useState(false);
  const [foreignLicenseCountry, setForeignLicenseCountry] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim() || !externalApplyUrl.trim()) {
      setError("Title, description, and application link are required.");
      return;
    }
    if (employerMode === "existing" && !employerId) {
      setError("Select an employer, or switch to creating a new one.");
      return;
    }
    if (employerMode === "new" && !newEmployerName.trim()) {
      setError("Enter the new employer's name.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    let finalEmployerId = employerId;

    if (employerMode === "new") {
      const { data: newEmployer, error: employerError } = await supabase
        .from("employer_profiles")
        .insert({
          company_name: newEmployerName.trim(),
          company_website: newEmployerWebsite.trim() || null,
        })
        .select("id")
        .single();

      if (employerError || !newEmployer) {
        setSaving(false);
        setError(employerError?.message || "Could not create employer.");
        return;
      }
      finalEmployerId = newEmployer.id;
    }

    const { error: jobError } = await supabase.from("jobs").insert({
      employer_id: finalEmployerId,
      title: title.trim(),
      description: description.trim(),
      track_type: trackType,
      specialization_id: specializationId ? Number(specializationId) : null,
      work_mode: workMode,
      currency,
      eligibility_requirements: eligibilityRequirements.trim() || null,
      location_restriction: locationRestriction.trim() || null,
      external_apply_url: externalApplyUrl.trim(),
      status,
      requires_foreign_license: requiresForeignLicense,
      foreign_license_country: requiresForeignLicense ? foreignLicenseCountry.trim() || null : null,
    });

    setSaving(false);

    if (jobError) {
      setError(jobError.message);
      return;
    }

    router.push("/admin/jobs");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-xl border border-carinex-navy/10 p-5">
        <p className="text-sm font-bold text-carinex-navy">Employer</p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setEmployerMode("existing")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              employerMode === "existing"
                ? "bg-carinex-navy text-white"
                : "border border-carinex-navy/20 text-carinex-navy/70"
            }`}
          >
            Use existing
          </button>
          <button
            type="button"
            onClick={() => setEmployerMode("new")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              employerMode === "new"
                ? "bg-carinex-navy text-white"
                : "border border-carinex-navy/20 text-carinex-navy/70"
            }`}
          >
            Create new
          </button>
        </div>

        {employerMode === "existing" ? (
          employers.length > 0 ? (
            <select
              value={employerId}
              onChange={(e) => setEmployerId(e.target.value)}
              className="mt-4 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
            >
              {employers.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.company_name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-3 text-sm text-carinex-navy/50">
              No employers yet — switch to &quot;Create new&quot;.
            </p>
          )
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Employer name"
              value={newEmployerName}
              onChange={(e) => setNewEmployerName(e.target.value)}
              className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
            />
            <input
              type="text"
              placeholder="Website (optional)"
              value={newEmployerWebsite}
              onChange={(e) => setNewEmployerWebsite(e.target.value)}
              className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">Job title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-carinex-navy">Track</label>
          <select
            value={trackType}
            onChange={(e) => setTrackType(e.target.value)}
            className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
          >
            <option value="national">National</option>
            <option value="global">Global</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-carinex-navy">Specialization</label>
          <select
            value={specializationId}
            onChange={(e) => setSpecializationId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
          >
            {specializations.map((spec) => (
              <option key={spec.id} value={spec.id}>
                {spec.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div>
          <label className="text-sm font-medium text-carinex-navy">Work mode</label>
          <select
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
            className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
          >
            <option value="sync">Sync (real-time)</option>
            <option value="async">Async (flexible)</option>
            <option value="onsite">Onsite</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-carinex-navy">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
          >
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">Eligibility requirements</label>
        <textarea
          value={eligibilityRequirements}
          onChange={(e) => setEligibilityRequirements(e.target.value)}
          rows={3}
          placeholder="e.g. Active NMCN license · 2+ years clinical experience"
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">Location restriction</label>
        <input
          type="text"
          value={locationRestriction}
          onChange={(e) => setLocationRestriction(e.target.value)}
          placeholder="e.g. Nigeria-based only"
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">Application link</label>
        <input
          type="url"
          value={externalApplyUrl}
          onChange={(e) => setExternalApplyUrl(e.target.value)}
          placeholder="https://..."
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="foreignLicense"
          checked={requiresForeignLicense}
          onChange={(e) => setRequiresForeignLicense(e.target.checked)}
        />
        <label htmlFor="foreignLicense" className="text-sm text-carinex-navy">
          Requires a foreign nursing license
        </label>
      </div>

      {requiresForeignLicense && (
        <div>
          <label className="text-sm font-medium text-carinex-navy">Which country&apos;s license?</label>
          <input
            type="text"
            value={foreignLicenseCountry}
            onChange={(e) => setForeignLicenseCountry(e.target.value)}
            placeholder="e.g. United States"
            className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-carinex-navy">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        >
          <option value="pending_review">Pending review</option>
          <option value="live">Live</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Create job"}
      </button>
    </form>
  );
}
