"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminCourseAccessGrant({ courseId, initialEnabled }: { courseId: number; initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function toggle() {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/admin/in-house-courses/${courseId}/admin-access`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not update admin access.");
      setEnabled(Boolean(result.enabled));
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update admin access."); }
    finally { setSaving(false); }
  }

  return <section className="mt-6 rounded-xl border border-carinex-emerald/25 bg-emerald-50/60 p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-semibold text-carinex-navy">Free admin course access</h2><p className="mt-1 text-sm text-carinex-navy/65">When enabled, authenticated Carinex admins can open this course without payment. Other courses and learner payment rules are unchanged.</p></div>
      <button type="button" onClick={toggle} disabled={saving} aria-pressed={enabled} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${enabled ? "bg-amber-600" : "bg-carinex-emerald"}`}>{saving ? "Saving…" : enabled ? "Disable free access" : "Enable free access"}</button>
    </div>
    <p className="mt-3 text-sm font-medium">Status: <span className={enabled ? "text-carinex-emerald" : "text-slate-500"}>{enabled ? "Enabled for this course" : "Disabled"}</span></p>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}
