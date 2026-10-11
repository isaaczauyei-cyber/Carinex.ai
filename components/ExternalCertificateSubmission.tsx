"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ExternalCertificateSubmission({
  courseId,
  nurseId,
  courseTitle,
  affiliateLink,
}: {
  courseId: number;
  nurseId: string;
  courseTitle: string;
  affiliateLink: string | null;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submitCertificate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!file) {
      setError("Choose your course certificate before submitting.");
      return;
    }
    if (!(file.type === "application/pdf" || file.type.startsWith("image/"))) {
      setError("Upload a PDF or image of your certificate.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("The certificate must be 10 MB or smaller.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again before submitting your certificate.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${courseId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("course-certificates")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const { error: completionError } = await supabase
        .from("nurse_course_completions")
        .upsert(
          {
            nurse_id: nurseId,
            course_id: courseId,
            status: "verification_pending",
            proof_doc_url: path,
            completed_at: null,
          },
          { onConflict: "nurse_id,course_id" }
        );

      if (completionError) {
        await supabase.storage.from("course-certificates").remove([path]);
        throw new Error(completionError.message);
      }

      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit the certificate. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
        <h2 className="font-bold text-sky-900">Certificate submitted</h2>
        <p className="mt-2 text-sm text-sky-800">Your certificate for {courseTitle} is awaiting admin review.</p>
        <a href="/dashboard" className="mt-4 inline-block rounded-full bg-carinex-navy px-5 py-2.5 text-sm font-semibold text-white">Return to dashboard</a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-carinex-navy/10 bg-white p-5">
      <h2 className="text-lg font-bold text-carinex-navy">Submit your course certificate</h2>
      <p className="mt-2 text-sm leading-6 text-carinex-navy/70">
        Once you have completed the course with the external provider, upload the certificate here. Carinex will review it before marking the course complete.
      </p>
      {affiliateLink && (
        <a href={affiliateLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-carinex-emerald underline">
          Open {courseTitle} at the course provider ↗
        </a>
      )}
      <form onSubmit={submitCertificate} className="mt-5">
        <label htmlFor={`certificate-${courseId}`} className="block text-sm font-semibold text-carinex-navy">Certificate file (PDF or image, max 10 MB)</label>
        <input
          id={`certificate-${courseId}`}
          type="file"
          accept="application/pdf,image/*"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="mt-2 block w-full rounded-lg border border-carinex-navy/20 p-3 text-sm"
        />
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving || !file} className="mt-4 rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Uploading certificate…" : "Submit certificate for review"}
        </button>
      </form>
    </div>
  );
}
