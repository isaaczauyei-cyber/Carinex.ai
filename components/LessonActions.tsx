"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LessonActions({
  nurseId,
  lessonId,
  alreadyCompleted,
  nextHref,
}: {
  nurseId: string;
  lessonId: string;
  alreadyCompleted: boolean;
  nextHref: string;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [saving, setSaving] = useState(false);

  async function markComplete() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("nurse_lesson_completions")
      .upsert({ nurse_id: nurseId, lesson_id: lessonId }, { onConflict: "nurse_id,lesson_id" });
    setSaving(false);
    setCompleted(true);
  }

  return (
    <div className="sticky bottom-0 flex items-center justify-between border-t border-carinex-navy/10 bg-white px-6 py-4">
      <button
        onClick={markComplete}
        disabled={saving || completed}
        className={`rounded-full px-6 py-2.5 text-sm font-semibold ${
          completed
            ? "bg-carinex-emerald/10 text-carinex-emerald"
            : "bg-carinex-navy text-carinex-white disabled:opacity-60"
        }`}
      >
        {completed ? "✓ Completed" : saving ? "Saving…" : "Mark as completed"}
      </button>

      <button
        onClick={() => router.push(nextHref)}
        aria-label="Next"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-carinex-emerald text-white hover:bg-carinex-emerald/90"
      >
        →
      </button>
    </div>
  );
}
