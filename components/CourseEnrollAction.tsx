"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CourseEnrollAction({
  courseId,
  isInHouse,
  affiliateLink,
  nurseId,
  completionStatus,
}: {
  courseId: number;
  isInHouse: boolean;
  affiliateLink: string | null;
  nurseId: string | null;
  completionStatus: string | null;
}) {
  const [saving, setSaving] = useState(false);

  const linkPending = !isInHouse && (!affiliateLink || affiliateLink.startsWith("PENDING"));

  async function handleEnroll() {
    if (!nurseId) {
      window.location.href = "/signup";
      return;
    }

    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("nurse_course_completions")
      .insert({ nurse_id: nurseId, course_id: courseId, status: "in_progress" });
    setSaving(false);

    if (isInHouse) {
      window.location.href = `/dashboard/learning/inhouse/${courseId}/start`;
    } else if (!linkPending && affiliateLink) {
      window.open(affiliateLink, "_blank", "noopener,noreferrer");
    }
  }

  if (completionStatus === "completed") {
    return (
      <span className="inline-block rounded-full bg-carinex-emerald/10 px-6 py-3 text-sm font-semibold text-carinex-emerald">
        ✓ Completed
      </span>
    );
  }

  if (completionStatus) {
    return (
      <a
        href={isInHouse ? `/dashboard/learning/inhouse/${courseId}/start` : affiliateLink || "#"}
        target={isInHouse ? undefined : "_blank"}
        rel={isInHouse ? undefined : "noopener noreferrer"}
        className="inline-block rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-carinex-white hover:bg-carinex-emerald/90"
      >
        Continue course →
      </a>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={saving || linkPending}
      className="rounded-full bg-carinex-navy px-6 py-3 text-sm font-semibold text-carinex-white disabled:opacity-60"
    >
      {saving ? "Enrolling…" : linkPending ? "Course link coming soon" : isInHouse ? "Enroll (in-house)" : "Enroll via Coursera"}
    </button>
  );
}
