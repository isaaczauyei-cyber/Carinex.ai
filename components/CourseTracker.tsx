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
  const [imageBroken, setImageBroken] = useState(false);

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
    <div className="overflow-hidden rounded-xl border border-carinex-navy/10">
      {course.image_url && !imageBroken ? (
        <img
          src={course.image_url}
          alt={course.title}
          className="h-32 w-full object-cover"
          onError={() => setImageBroken(true)}
        />
      ) : (
        <div className="h-20 w-full bg-gradient-to-br from-carinex-navy to-carinex-emerald" />
      )}

      <div className="p-5">
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
          {current?.status === "verification_pending" && (
            <span className="whitespace-nowrap rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Pending Review
            </span>
          )}
          {current?.status === "in_progress" && (
            <span className="whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              In Progress
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!current && (
            <button
              onClick={handleStart}
              disabled={saving || linkPending}
              className="rounded-full bg-carinex-navy px-5 py-2 text-sm font-semibold text-carinex-white disabled:opacity-60"
            >
              {saving ? "Starting…" : linkPending ? "Course link coming soon" : "Start course →"}
            </button>
          )}

          {current && !linkPending && (
            <a
              href={course.affiliate_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-carinex-emerald hover:underline"
            >
              Continue course →
            </a>
          )}
        </div>

        {current?.status === "in_progress" && (
          <div className="mt-4 rounded-lg border border-dashed border-carinex-navy/20 p-4">
            <p className="text-sm font-semibold text-carinex-navy">
              Finished? Upload your certificate to submit for review.
            </p>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-2 text-sm text-carinex-navy/70"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <button
              onClick={handleSubmitProof}
              disabled={saving}
              className="mt-3 rounded-full bg-carinex-emerald px-5 py-2 text-sm font-semibold text-carinex-white disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        )}

        {current?.status === "verification_pending" && (
          <p className="mt-3 text-sm text-carinex-navy/50">
            Your certificate is submitted and awaiting review.
          </p>
        )}
      </div>
    </div>
  );
}
