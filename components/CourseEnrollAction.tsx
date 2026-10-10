"use client";

import { useState } from "react";
import { formatNaira, type CoursePricing } from "@/lib/course-pricing";

export default function CourseEnrollAction({
  courseId,
  isInHouse,
  isFree,
  affiliateLink,
  nurseId,
  completionStatus,
  enrollmentStatus,
  pricing,
}: {
  courseId: number;
  isInHouse: boolean;
  isFree: boolean;
  affiliateLink: string | null;
  nurseId: string | null;
  completionStatus: string | null;
  enrollmentStatus: string | null;
  pricing: CoursePricing;
}) {
  const [saving, setSaving] = useState(false);
  const [packageType, setPackageType] = useState<"course_only" | "course_plus_guide">("course_only");
  const [error, setError] = useState("");
  // UI hint only; the API independently enforces live-mode safety.
  const livePaymentsEnabled = process.env.NEXT_PUBLIC_FLW_LIVE_PAYMENTS_ENABLED === "true";
  const linkPending = !isInHouse && (!affiliateLink || affiliateLink.startsWith("PENDING"));

  const paidCourse = isInHouse && !isFree && pricing.courseOnly > 0;
  const hasGuidePackage = Number(pricing.coursePlusGuide || 0) > 0;
  const selectedPrice = packageType === "course_only" ? pricing.courseOnly : Number(pricing.coursePlusGuide || 0);

  async function beginPayment() {
    if (!nurseId) {
      window.location.href = "/login";
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, packageType }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to start payment.");
      window.location.assign(result.authorizationUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start payment.");
      setSaving(false);
    }
  }

  async function handleFreeEnroll() {
    if (!nurseId) {
      window.location.href = "/signup";
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isInHouse) {
        const response = await fetch("/api/courses/free-enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to enroll in this course.");
        window.location.href = `/dashboard/learning/inhouse/${courseId}/start`;
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: completionError } = await supabase
        .from("nurse_course_completions")
        .upsert({ nurse_id: nurseId, course_id: courseId, status: "in_progress" }, { onConflict: "nurse_id,course_id" });
      if (completionError) throw completionError;
      if (!linkPending && affiliateLink) window.open(affiliateLink, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to enroll in this course.");
    } finally {
      setSaving(false);
    }
  }

  if (paidCourse) {
    if (enrollmentStatus === "approved") {
      return <a href={`/dashboard/learning/inhouse/${courseId}/start`} className="inline-block rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-white">Continue course →</a>;
    }

    if (enrollmentStatus === "pending_approval" || enrollmentStatus === "rejected" || enrollmentStatus === "revoked") {
      return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {enrollmentStatus === "pending_approval"
          ? "Payment received. Your enrolment is awaiting admin approval. Course access will open after approval."
          : enrollmentStatus === "rejected"
            ? "Your enrolment is under review. Please contact Carinex support for an update."
            : "Your course access is currently unavailable. Please contact support."}
      </div>;
    }

    if (!livePaymentsEnabled) {
      return <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-bold text-amber-950">Enrollment payments are temporarily unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          Online payments are temporarily unavailable. Please check back soon
        </p>
      </div>;
    }

    return <div className="max-w-md">
      <h2 className="text-lg font-bold text-carinex-navy">Choose your package</h2>
      <div className="mt-3 flex flex-col gap-3">
        <label className={`cursor-pointer rounded-xl border p-4 ${packageType === "course_only" ? "border-carinex-emerald bg-carinex-emerald/5" : "border-carinex-navy/15"}`}>
          <input type="radio" name="package" className="mr-2" checked={packageType === "course_only"} onChange={() => setPackageType("course_only")} />
          <strong>Course only — {formatNaira(pricing.courseOnly)}</strong>
          <p className="ml-6 mt-1 text-sm text-carinex-navy/65">Access to the course materials after approval.</p>
        </label>

        {hasGuidePackage && (
          <label className={`cursor-pointer rounded-xl border p-4 ${packageType === "course_plus_guide" ? "border-carinex-emerald bg-carinex-emerald/5" : "border-carinex-navy/15"}`}>
            <input type="radio" name="package" className="mr-2" checked={packageType === "course_plus_guide"} onChange={() => setPackageType("course_plus_guide")} />
            <strong>Course + interview guide — {formatNaira(pricing.coursePlusGuide || 0)}</strong>
            <p className="ml-6 mt-1 text-sm text-carinex-navy/65">Course materials plus interview preparation guide after approval.</p>
          </label>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button onClick={beginPayment} disabled={saving || selectedPrice <= 0} className="mt-4 rounded-full bg-carinex-navy px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? "Connecting to Flutterwave…" : `Pay ${formatNaira(selectedPrice)}`}
      </button>
      <p className="mt-2 text-xs text-carinex-navy/50">Secure payment via Flutterwave. Access is granted after manual approval.</p>
    </div>;
  }

  if (completionStatus === "completed") return <span className="inline-block rounded-full bg-carinex-emerald/10 px-6 py-3 text-sm font-semibold text-carinex-emerald">✓ Completed</span>;
  if (completionStatus) return <a href={isInHouse ? `/dashboard/learning/inhouse/${courseId}/start` : affiliateLink || "#"} target={isInHouse ? undefined : "_blank"} rel={isInHouse ? undefined : "noopener noreferrer"} className="inline-block rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-white">Continue course →</a>;
  return <div>
    {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
    <button onClick={handleFreeEnroll} disabled={saving || linkPending} className="rounded-full bg-carinex-navy px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Enrolling…" : linkPending ? "Course link coming soon" : isInHouse ? "Enroll (in-house)" : "Enroll via Coursera"}</button>
  </div>;
}
