"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminCourseReviewRow({
  completionId, courseTitle, proofDocUrl,
}: { completionId: string; courseTitle: string; proofDocUrl: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadProof() {
    if (!proofDocUrl) return;
    const supabase = createClient();
    const { data, error: signedError } = await supabase.storage.from("course-certificates").createSignedUrl(proofDocUrl, 300);
    if (signedError || !data?.signedUrl) { setError(signedError?.message || "Could not open certificate."); return; }
    setProofUrl(data.signedUrl);
  }

  async function decide(action: "approve" | "reject") {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/admin/course-completions/${completionId}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save review decision.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Review failed."); }
    finally { setSaving(false); }
  }

  return <div className="rounded-lg border border-carinex-navy/10 p-4">
    <p className="font-semibold text-carinex-navy">{courseTitle}</p>
    {proofDocUrl && <button type="button" onClick={loadProof} className="mt-1 text-sm font-semibold text-carinex-emerald hover:underline">{proofUrl ? "Certificate link ready ↓" : "View submitted certificate →"}</button>}
    {proofUrl && <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-semibold text-carinex-emerald hover:underline">Open certificate →</a>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    <div className="mt-3 flex gap-2">
      <button type="button" onClick={() => decide("approve")} disabled={saving} className="rounded-full bg-carinex-emerald px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Approve"}</button>
      <button type="button" onClick={() => decide("reject")} disabled={saving} className="rounded-full border border-carinex-navy/20 px-4 py-1.5 text-sm font-semibold text-carinex-navy disabled:opacity-60">Reject</button>
    </div>
  </div>;
}
