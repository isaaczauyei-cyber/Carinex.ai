"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: number;
  title: string;
  provider: string;
  price_display: string | null;
  affiliate_link: string;
  summary: string | null;
};

type Completion = {
  id: string;
  status: "in_progress" | "completed" | "verification_pending";
  completed_at: string | null;
} | null;

export default function CourseTracker({
  nurseId,
  course,
  completion,
}: {
  nurseId: string;
  course: Course;
  completion: Completion;
}) {
  const [current, setCurrent] = useState(completion);
  const [saving, setSaving] = useState(false);

  const linkPending = course.affiliate_link.startsWith("PENDING");

  async function handleStart() {
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("nurse_course_completions")
      .insert({ nurse_id: nurseId, course_id: course.id, status: "in_progress" })
      .select()
      .single();
    setSaving(false);
    if (data) setCurrent(data);
  }

  async function handleComplete() {
    if (!current) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("nurse_course_completions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", current.id)
      .select()
      .single();
    setSaving(false);
    if (data) setCurrent(data);
  }

  return (
    <div className="rounded-xl border border-carinex-navy/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-carinex-navy">{course.title}</p>
          <p className="text-sm text-carinex-navy/60">
            {course.provider}
            {course.price_display ? ` · ${course.price_display}` : ""}
          </p>
          {course.summary && (
            <p className="mt-2 text-sm text-carinex-navy/70">{course.summary}</p>
          )}
        </div>

        {current?.status === "completed" && (
          <span className="whitespace-nowrap rounded-full bg-carinex-emerald/10 px-3 py-1 text-xs font-semibold text-carinex-emerald">
            Completed
          </span>
        )}
        {current?.status === "in_progress" && (
          <span className="whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            In Progress
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {linkPending ? (
          <span className="text-sm text-carinex-navy/40">Course link coming soon</span>
        ) : (
          <a
            href={course.affiliate_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-carinex-emerald hover:underline"
          >
            View course →
          </a>
        )}

        {!current && (
          <button
            onClick={handleStart}
            disabled={saving}
            className="rounded-full bg-carinex-navy px-5 py-2 text-sm font-semibold text-carinex-white disabled:opacity-60"
          >
            {saving ? "Starting…" : "Start course"}
          </button>
        )}

        {current?.status === "in_progress" && (
          <button
            onClick={handleComplete}
            disabled={saving}
            className="rounded-full bg-carinex-emerald px-5 py-2 text-sm font-semibold text-carinex-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Mark as complete"}
          </button>
        )}
      </div>
    </div>
  );
}
