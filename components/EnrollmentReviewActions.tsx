"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function EnrollmentReviewActions({ enrollmentId, status }: { enrollmentId: string; status: string }) {
  const [busy, setBusy] = useState(false); const [note, setNote] = useState(""); const [error, setError] = useState(""); const router = useRouter();
  async function review(action: "approved" | "rejected" | "under_review") {
    setBusy(true); setError("");
    const res = await fetch(`/api/admin/course-enrollments/${enrollmentId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note }) });
    const data = await res.json(); setBusy(false);
    if (!res.ok) { setError(data.error || "Could not save review."); return; }
    router.refresh();
  }
  if (status === "approved" || status === "revoked") return <p className="mt-3 text-sm text-carinex-emerald">Access status: {status}</p>;
  return <div className="mt-4"><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional admin note" className="w-full rounded-lg border p-3 text-sm" rows={2} /><div className="mt-2 flex flex-wrap gap-2"><button disabled={busy} onClick={() => review("approved")} className="rounded-full bg-carinex-emerald px-4 py-2 text-sm font-semibold text-white">Approve access</button><button disabled={busy} onClick={() => review("under_review")} className="rounded-full border px-4 py-2 text-sm">Mark under review</button><button disabled={busy} onClick={() => review("rejected")} className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700">Reject</button></div>{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</div>;
}
