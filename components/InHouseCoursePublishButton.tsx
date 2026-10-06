"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InHouseCoursePublishButton({ courseId, initialPublished }: { courseId: number; initialPublished: boolean }) {
  const router = useRouter(); const [published, setPublished] = useState(initialPublished); const [saving, setSaving] = useState(false);
  async function toggle() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/in-house-courses/${courseId}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ published: !published }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Could not update publishing status.");
      setPublished(Boolean(result.published)); router.refresh();
    } catch (error) { alert(error instanceof Error ? error.message : "Could not update publishing status."); }
    finally { setSaving(false); }
  }
  return <div className="rounded-xl border border-carinex-navy/10 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-carinex-navy">Publishing</p><p className="mt-1 text-xs text-carinex-navy/50">{published ? "Published — learners can access this course." : "Private draft — learners cannot access this course."}</p></div><button type="button" onClick={toggle} disabled={saving} className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${published ? "bg-carinex-navy" : "bg-carinex-emerald"}`}>{saving ? "Saving…" : published ? "Unpublish" : "Publish course"}</button></div></div>;
}
