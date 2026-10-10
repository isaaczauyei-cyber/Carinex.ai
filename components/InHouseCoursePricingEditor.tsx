"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/course-pricing";

export default function InHouseCoursePricingEditor({
  courseId,
  initialCourseOnly,
  initialCoursePlusGuide,
}: {
  courseId: number;
  initialCourseOnly: number;
  initialCoursePlusGuide: number | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [courseOnly, setCourseOnly] = useState(String(initialCourseOnly || ""));
  const [coursePlusGuide, setCoursePlusGuide] = useState(initialCoursePlusGuide == null ? "" : String(initialCoursePlusGuide));
  const [saving, setSaving] = useState(false);

  async function save() {
    const only = Number(courseOnly || 0);
    const guide = coursePlusGuide.trim() === "" ? null : Number(coursePlusGuide);

    if (!Number.isFinite(only) || only < 0 || (guide !== null && (!Number.isFinite(guide) || guide < 0))) {
      alert("Enter valid prices in naira.");
      return;
    }
    if (only === 0 && guide !== null && guide > 0) {
      alert("Set a course-only price before adding a guide package.");
      return;
    }
    if (guide !== null && guide > 0 && guide < only) {
      alert("The course + guide price cannot be lower than the course-only price.");
      return;
    }

    setSaving(true);
    const { error: privacyError } = await supabase.from("courses").update({ is_published: false }).eq("id", courseId).eq("is_in_house", true);
    if (privacyError) { setSaving(false); alert("Could not prepare the course for editing: " + privacyError.message); return; }
    const display = only > 0
      ? guide && guide > 0
        ? `${formatNaira(only)} course / ${formatNaira(guide)} with interview guide`
        : formatNaira(only)
      : null;

    const { error } = await supabase.from("courses").update({
      price_course_only: only,
      price_course_plus_guide: guide && guide > 0 ? guide : null,
      price_display: display,
      is_free: only <= 0,
    }).eq("id", courseId);

    setSaving(false);
    if (error) {
      alert("Could not save pricing: " + error.message);
      return;
    }

    alert("Pricing saved. The public course page and Flutterwave checkout now use these prices.");
    router.refresh();
  }

  return <div className="rounded-xl border border-carinex-emerald/20 bg-carinex-emerald/5 p-5">
    <div>
      <p className="font-bold text-carinex-navy">Course pricing</p>
      <p className="mt-1 text-sm text-carinex-navy/60">Set prices in naira. These values drive both the public page and the server-side Flutterwave amount.</p>
    </div>

    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-carinex-navy">
        Course only (₦)
        <input type="number" min="0" step="1" value={courseOnly} onChange={(e) => setCourseOnly(e.target.value)} className="mt-2 w-full rounded-lg border border-carinex-navy/15 bg-white px-3 py-2 font-normal outline-none focus:border-carinex-emerald" placeholder="20000" />
      </label>
      <label className="text-sm font-semibold text-carinex-navy">
        Course + interview guide (₦)
        <input type="number" min="0" step="1" value={coursePlusGuide} onChange={(e) => setCoursePlusGuide(e.target.value)} className="mt-2 w-full rounded-lg border border-carinex-navy/15 bg-white px-3 py-2 font-normal outline-none focus:border-carinex-emerald" placeholder="25000" />
      </label>
    </div>

    <button type="button" onClick={save} disabled={saving} className="mt-4 rounded-full bg-carinex-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
      {saving ? "Saving pricing…" : "Save pricing"}
    </button>
  </div>;
}
