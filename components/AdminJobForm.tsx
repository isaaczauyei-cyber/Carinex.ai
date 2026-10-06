"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Employer = { id: string; company_name: string };
type Specialization = { id: number; name: string };

type JobValues = {
  id?: string;
  employer_id?: string | null;
  title?: string;
  description?: string;
  track_type?: string | null;
  specialization_id?: number | null;
  work_mode?: string | null;
  currency?: string | null;
  pay_display?: string | null;
  eligibility_requirements?: string | null;
  location_restriction?: string | null;
  external_apply_url?: string;
  status?: string | null;
  requires_foreign_license?: boolean | null;
  foreign_license_country?: string | null;
};

export default function AdminJobForm({
  jobId,
  initialValues,
  employers,
  specializations,
}: {
  jobId?: string;
  initialValues?: JobValues;
  employers: Employer[];
  specializations: Specialization[];
}) {
  const router = useRouter();
  const editing = Boolean(jobId);

  const [employerMode, setEmployerMode] = useState<"existing" | "new">(
    initialValues?.employer_id ? "existing" : employers.length > 0 ? "existing" : "new"
  );
  const [employerId, setEmployerId] = useState(initialValues?.employer_id || employers[0]?.id || "");
  const [newEmployerName, setNewEmployerName] = useState("");
  const [newEmployerWebsite, setNewEmployerWebsite] = useState("");
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [trackType, setTrackType] = useState(initialValues?.track_type || "national");
  const [specializationId, setSpecializationId] = useState(
    initialValues?.specialization_id?.toString() || specializations[0]?.id?.toString() || ""
  );
  const [workMode, setWorkMode] = useState(initialValues?.work_mode || "async");
  const [currency, setCurrency] = useState(initialValues?.currency || "NGN");
  const [payDisplay, setPayDisplay] = useState(initialValues?.pay_display || "");
  const [eligibilityRequirements, setEligibilityRequirements] = useState(initialValues?.eligibility_requirements || "");
  const [locationRestriction, setLocationRestriction] = useState(initialValues?.location_restriction || "");
  const [externalApplyUrl, setExternalApplyUrl] = useState(initialValues?.external_apply_url || "");
  const [status, setStatus] = useState(initialValues?.status || "pending_review");
  const [requiresForeignLicense, setRequiresForeignLicense] = useState(Boolean(initialValues?.requires_foreign_license));
  const [foreignLicenseCountry, setForeignLicenseCountry] = useState(initialValues?.foreign_license_country || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialValues) return;
    setEmployerId(initialValues.employer_id || "");
    setTitle(initialValues.title || "");
    setDescription(initialValues.description || "");
    setTrackType(initialValues.track_type || "national");
    setSpecializationId(initialValues.specialization_id?.toString() || "");
    setWorkMode(initialValues.work_mode || "async");
    setCurrency(initialValues.currency || "NGN");
    setPayDisplay(initialValues.pay_display || "");
    setEligibilityRequirements(initialValues.eligibility_requirements || "");
    setLocationRestriction(initialValues.location_restriction || "");
    setExternalApplyUrl(initialValues.external_apply_url || "");
    setStatus(initialValues.status || "pending_review");
    setRequiresForeignLicense(Boolean(initialValues.requires_foreign_license));
    setForeignLicenseCountry(initialValues.foreign_license_country || "");
  }, [initialValues]);

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
    if (employerMode === "new" && !newEmployerName.trim() && !employerId) {
      setError("Enter the new employer's name.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    let finalEmployerId = employerId;

    if (employerMode === "new") {
      const { data: newEmployer, error: employerError } = await supabase
        .from("employer_profiles")
        .insert({ company_name: newEmployerName.trim(), company_website: newEmployerWebsite.trim() || null })
        .select("id")
        .single();
      if (employerError || !newEmployer) {
        setSaving(false);
        setError(employerError?.message || "Could not create employer.");
        return;
      }
      finalEmployerId = newEmployer.id;
    }

    const values = {
      employer_id: finalEmployerId,
      title: title.trim(),
      description: description.trim(),
      track_type: trackType,
      specialization_id: specializationId ? Number(specializationId) : null,
      work_mode: workMode,
      currency,
      pay_display: payDisplay.trim() || null,
      eligibility_requirements: eligibilityRequirements.trim() || null,
      location_restriction: locationRestriction.trim() || null,
      external_apply_url: externalApplyUrl.trim(),
      status,
      requires_foreign_license: requiresForeignLicense,
      foreign_license_country: requiresForeignLicense ? foreignLicenseCountry.trim() || null : null,
    };

    const result = editing
      ? await supabase.from("jobs").update(values).eq("id", jobId)
      : await supabase.from("jobs").insert(values);

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    router.push("/admin/jobs");
    router.refresh();
  }

  const input = "mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-xl border border-carinex-navy/10 p-5">
        <p className="text-sm font-bold text-carinex-navy">Employer</p>
        {!editing && <div className="mt-3 flex gap-2"><button type="button" onClick={() => setEmployerMode("existing")} className={`rounded-full px-4 py-2 text-sm font-semibold ${employerMode === "existing" ? "bg-carinex-navy text-white" : "border border-carinex-navy/20 text-carinex-navy/70"}`}>Use existing</button><button type="button" onClick={() => setEmployerMode("new")} className={`rounded-full px-4 py-2 text-sm font-semibold ${employerMode === "new" ? "bg-carinex-navy text-white" : "border border-carinex-navy/20 text-carinex-navy/70"}`}>Create new</button></div>}
        {employerMode === "existing" ? (
          <select value={employerId} onChange={(e) => setEmployerId(e.target.value)} className={input}>
            {employers.map((emp) => <option key={emp.id} value={emp.id}>{emp.company_name}</option>)}
          </select>
        ) : (
          <div className="mt-4 flex flex-col gap-3"><input value={newEmployerName} onChange={(e) => setNewEmployerName(e.target.value)} placeholder="Employer name" className={input.replace("mt-2", "")} /><input value={newEmployerWebsite} onChange={(e) => setNewEmployerWebsite(e.target.value)} placeholder="Website (optional)" className={input.replace("mt-2", "")} /></div>
        )}
      </div>

      <div><label className="text-sm font-medium text-carinex-navy">Job title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={input} /></div>
      <div><label className="text-sm font-medium text-carinex-navy">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={input} /></div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-carinex-navy">Track</label><select value={trackType} onChange={(e) => setTrackType(e.target.value)} className={input}><option value="national">National</option><option value="global">Global</option></select></div>
        <div><label className="text-sm font-medium text-carinex-navy">Specialization</label><select value={specializationId} onChange={(e) => setSpecializationId(e.target.value)} className={input}><option value="">Select specialization</option>{specializations.map((spec) => <option key={spec.id} value={spec.id}>{spec.name}</option>)}</select></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-carinex-navy">Work mode</label><select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className={input}><option value="sync">Sync (real-time)</option><option value="async">Async (flexible)</option><option value="onsite">Onsite</option></select></div>
        <div><label className="text-sm font-medium text-carinex-navy">Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className={input}><option value="NGN">NGN</option><option value="USD">USD</option><option value="GBP">GBP</option></select></div>
      </div>

      <div><label className="text-sm font-medium text-carinex-navy">Pay / compensation <span className="font-normal text-carinex-navy/50">(optional)</span></label><input value={payDisplay} onChange={(e) => setPayDisplay(e.target.value)} placeholder="e.g. ₦250,000/month or $25/hour" className={input} /><p className="mt-1 text-xs text-carinex-navy/50">Leave blank if the employer has not provided pay information.</p></div>
      <div><label className="text-sm font-medium text-carinex-navy">Eligibility requirements</label><textarea value={eligibilityRequirements} onChange={(e) => setEligibilityRequirements(e.target.value)} rows={3} className={input} /></div>
      <div><label className="text-sm font-medium text-carinex-navy">Location restriction</label><input value={locationRestriction} onChange={(e) => setLocationRestriction(e.target.value)} placeholder="e.g. Nigeria-based only" className={input} /></div>
      <div><label className="text-sm font-medium text-carinex-navy">Application link</label><input type="url" value={externalApplyUrl} onChange={(e) => setExternalApplyUrl(e.target.value)} placeholder="https://..." className={input} /></div>

      <div className="flex items-center gap-3"><input type="checkbox" id="foreignLicense" checked={requiresForeignLicense} onChange={(e) => setRequiresForeignLicense(e.target.checked)} /><label htmlFor="foreignLicense" className="text-sm text-carinex-navy">Requires a foreign nursing license</label></div>
      {requiresForeignLicense && <div><label className="text-sm font-medium text-carinex-navy">Which country&apos;s license?</label><input value={foreignLicenseCountry} onChange={(e) => setForeignLicenseCountry(e.target.value)} placeholder="e.g. United States" className={input} /></div>}

      <div><label className="text-sm font-medium text-carinex-navy">Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className={input}><option value="pending_review">Pending review</option><option value="live">Live</option><option value="rejected">Rejected</option><option value="closed">Closed</option></select></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : editing ? "Save changes" : "Create job"}</button>
    </form>
  );
}
