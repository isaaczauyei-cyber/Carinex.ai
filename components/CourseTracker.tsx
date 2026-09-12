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
  image_url?: string | null;
};

type Completion = {
  id: string;
  status: "in_progress" | "completed" | "verification_pending";
  completed_at: string | null;
} | null;

const statusStyles: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-carinex-emerald/10 text-carinex-emerald" },
  verification_pending: { label: "Pending Review", className: "bg-sky-50 text-sky-700" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700" },
};

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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const linkPending = course.affiliate_link.startsWith("PENDING");
  const status = current ? statusStyles[current.status] : null;

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

    if (!linkPending) {
      window.open(course.affiliate_link, "_blank", "noopener,noreferrer");
    }
  }

  async function handleSubmitProof() {
    if (!current || !file) {
      setError("Choose a certificate or screenshot to upload first.");
      return;
    }
    setError("");
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${course.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("course-certificates")
      .upload(path, file);

    if (uploadError) {
      setSaving(false);
      setError("Upload failed — try again.");
      return;
    }

    const { data } = await supabase
      .from("nurse_course_completions")
      .update({ status: "verification_pending", proof_doc_url: path })
      .eq("id", current.id)
      .select()
      .single();

    setSaving(false);
    if (data) setCurrent(data);
  }

  return (
    <div className="rounded-xl border border-carinex-navy/10 p-5 transition hover:border-carinex-emerald/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-carinex-navy">{course.title}</p>
          <p className="mt-0.5 text-sm text-carinex-navy/50">
            {course.provider}
            {course.price_display ? ` · ${course.price_display}` : ""}
          </p>
        </div>
        {status && (
          <span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        )}
      </div>

      {course.summary && (
        <p className="mt-2 text-sm text-carinex-navy/60">{course.summary}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {!current && (
          <button
            onClick={handleStart}
            disabled={saving || linkPending}
            className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              linkPending ? "bg-carinex-navy/30" : "bg-carinex-navy hover:bg-carinex-navy/90"
            }`}
          >
            {saving ? "Starting…" : linkPending ? "Course link coming soon" : "Start course"}
          </button>
        )}

        {current && current.status !== "completed" && (
          linkPending ? (
            <span className="rounded-full bg-carinex-navy/10 px-4 py-2 text-sm font-semibold text-carinex-navy/40">
              Course link coming soon
            </span>
          ) : (
            <a
              href={course.affiliate_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-carinex-emerald hover:underline"
            >
              Continue course →
            </a>
          )
        )}
      </div>

      {current?.status === "in_progress" && !linkPending && (
        <div className="mt-4 rounded-lg bg-carinex-navy/[0.03] p-4">
          <p className="text-sm font-semibold text-carinex-navy">
            Finished? Upload your certificate to submit for review.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm text-carinex-navy/70"
            />
            <button
              onClick={handleSubmitProof}
              disabled={saving}
              className="rounded-full bg-carinex-emerald px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit for review"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {current?.status === "in_progress" && linkPending && (
        <p className="mt-3 text-sm text-carinex-navy/50">
          You&apos;ll be able to submit your certificate once the course link is live.
        </p>
      )}

      {current?.status === "verification_pending" && (
        <p className="mt-3 text-sm text-carinex-navy/50">
          Your certificate is submitted and awaiting review.
        </p>
      )}
    </div>
  );
}
