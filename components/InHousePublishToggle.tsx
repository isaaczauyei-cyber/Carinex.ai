"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InHousePublishToggle({ courseId, initialPublished }: { courseId: number; initialPublished: boolean }) {
  const router = useRouter();
  const [published, setPublished] = useState(initialPublished);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !published;
    const supabase = createClient();
    const { error } = await supabase.from("courses").update({ is_published: next }).eq("id", courseId).eq("is_in_house", true);
    if (error) {
      alert("Could not update publish status: " + error.message);
    } else {
      setPublished(next);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${published ? "bg-carinex-emerald/10 text-carinex-emerald" : "bg-amber-50 text-amber-700"}`}>
        {published ? "Published" : "Private / Unpublished"}
      </span>
      <button type="button" onClick={toggle} disabled={saving} className={`rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${published ? "bg-amber-600" : "bg-carinex-emerald"}`}>
        {saving ? "Saving…" : published ? "Unpublish" : "Publish"}
      </button>
    </div>
  );
}
