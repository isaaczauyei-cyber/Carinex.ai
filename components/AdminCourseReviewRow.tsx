"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminCourseReviewRow({
  completionId,
  courseTitle,
  proofDocUrl,
}: {
  completionId: string;
  courseTitle: string;
  proofDocUrl: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  async function loadProof() {
    if (!proofDocUrl) return;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("course-certificates")
      .createSignedUrl(proofDocUrl, 300);
    if (data) setProofUrl(data.signedUrl);
  }

  async function decide(status: "completed" | "in_progress") {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("nurse_course_completions")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", completionId);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-carinex-navy/10 p-4">
      <p className="font-semibold text-carinex-navy">{courseTitle}</p>
      {proofDocUrl && (
        <button
          onClick={loadProof}
          className="mt-1 text-sm font-semibold text-carinex-emerald hover:underline"
        >
          {proofUrl ? "" : "View submitted certificate →"}
        </button>
      )}
      {proofUrl && (
        <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-semibold text-carinex-emerald hover:underline">
          Open certificate →
        </a>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => decide("completed")}
          disabled={saving}
          className="rounded-full bg-carinex-emerald px-4 py-1.5 text-sm font-semibold text-carinex-white disabled:opacity-60"
        >
          Approve
        </button>
        <button
          onClick={() => decide("in_progress")}
          disabled={saving}
          className="rounded-full border border-carinex-navy/20 px-4 py-1.5 text-sm font-semibold text-carinex-navy disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
