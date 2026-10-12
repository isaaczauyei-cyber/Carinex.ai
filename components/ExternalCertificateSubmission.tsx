"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  courseId: number;
  courseTitle: string;
  initialStatus: string;
  existingProofPath: string | null;
};

export default function ExternalCertificateSubmission({ courseId, courseTitle, initialStatus, existingProofPath }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(initialStatus === "verification_pending");

  async function submit() {
    if (!file) { setError("Choose a certificate file first."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("The certificate must be 10 MB or smaller."); return; }
    if (!/^application\/pdf$/.test(file.type) && !/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Upload a PDF, PNG, JPG, or WEBP certificate."); return;
    }
    setSaving(true); setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Please sign in again before submitting your certificate.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
      const path = `${user.id}/${courseId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("course-certificates").upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message || "Could not upload the certificate. Check storage permissions.");
      const response = await fetch(`/api/courses/${courseId}/certificate-submission`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proofPath: path })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The certificate uploaded but could not be submitted for review.");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the certificate.");
    } finally { setSaving(false); }
  }

  if (submitted) return <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
    <h2 className="font-bold text-sky-900">Certificate submitted for review</h2>
    <p className="mt-2 text-sm text-sky-800">Your certificate for {courseTitle} is awaiting admin review. You can return here to check the status.</p>
  </div>;

  return <section className="rounded-xl border border-carinex-emerald/25 bg-carinex-emerald/5 p-5">
    <h2 className="text-lg font-bold text-carinex-navy">Submit your certificate</h2>
    <p className="mt-2 text-sm text-carinex-navy/70">After completing this course with the external provider, upload your certificate here for Carinex to review.</p>
    {existingProofPath && <p className="mt-2 text-xs text-carinex-navy/60">A previous submission exists. Submitting a new certificate will replace the pending proof.</p>}
    <label className="mt-4 block text-sm font-semibold text-carinex-navy" htmlFor={`certificate-${courseId}`}>Certificate file (PDF, PNG, JPG, or WEBP; max 10 MB)</label>
    <input ref={inputRef} id={`certificate-${courseId}`} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2 block w-full rounded-lg border border-carinex-navy/20 bg-white p-3 text-sm" />
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <button type="button" onClick={submit} disabled={saving || !file} className="mt-4 rounded-full bg-carinex-emerald px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Uploading…" : "Submit certificate for review"}</button>
  </section>;
}
