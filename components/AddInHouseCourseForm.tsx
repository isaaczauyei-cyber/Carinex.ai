"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/course-pricing";

type Specialization = { id: number; name: string };

export default function AddInHouseCourseForm({ specializations }: { specializations: Specialization[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("Carinex");
  const [specializationId, setSpecializationId] = useState("");
  const [summary, setSummary] = useState("");
  const [courseOnly, setCourseOnly] = useState("");
  const [coursePlusGuide, setCoursePlusGuide] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) { alert("Please enter a course title."); return; }

    const only = isFree ? 0 : Number(courseOnly || 0);
    const guide = isFree || coursePlusGuide.trim() === "" ? null : Number(coursePlusGuide);
    if (!Number.isFinite(only) || only < 0 || (!isFree && only <= 0)) { alert("Enter a valid course-only price."); return; }
    if (guide !== null && (!Number.isFinite(guide) || guide < only)) { alert("The course + guide price must be at least the course-only price."); return; }

    setSaving(true);
    const priceDisplay = only > 0
      ? guide && guide > 0
        ? `${formatNaira(only)} course / ${formatNaira(guide)} with interview guide`
        : formatNaira(only)
      : null;

    const { data, error } = await supabase.from("courses").insert({
      title: title.trim(),
      provider: provider.trim() || "Carinex",
      specialization_id: specializationId ? Number(specializationId) : null,
      track_type: "national",
      price_display: priceDisplay,
      price_course_only: only,
      price_course_plus_guide: guide && guide > 0 ? guide : null,
      affiliate_link: "",
      summary: summary.trim() || null,
      is_free: only <= 0,
      is_in_house: true,
      is_published: false,
    }).select("id").single();

    setSaving(false);
    if (error) { alert("Could not create course: " + error.message); return; }
    router.push(`/admin/in-house-courses/${data.id}`);
    router.refresh();
  }

  const input = "mt-2 w-full rounded-lg border border-carinex-navy/15 px-3 py-2 outline-none focus:border-carinex-emerald";
  return <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-carinex-navy/10 p-6">
    <div><label className="text-sm font-semibold text-carinex-navy">Course title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. AI in Nursing" className={input} required /></div>
    <div><label className="text-sm font-semibold text-carinex-navy">Provider</label><input value={provider} onChange={e => setProvider(e.target.value)} className={input} /></div>
    <div><label className="text-sm font-semibold text-carinex-navy">Specialization</label><select value={specializationId} onChange={e => setSpecializationId(e.target.value)} className={`${input} bg-white`}><option value="">No specialization</option>{specializations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
    <div><label className="text-sm font-semibold text-carinex-navy">Summary</label><textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4} className={input} /></div>

    <label className="flex items-center gap-3 text-sm font-medium text-carinex-navy"><input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} className="h-4 w-4" /> Free course</label>

    {!isFree && <div className="rounded-lg bg-carinex-navy/5 p-4">
      <p className="text-sm font-semibold text-carinex-navy">Pricing (NGN)</p>
      <label className="mt-3 block text-sm text-carinex-navy">Course only<input type="number" min="1" step="1" value={courseOnly} onChange={e => setCourseOnly(e.target.value)} placeholder="20000" className={input} /></label>
      <label className="mt-3 block text-sm text-carinex-navy">Course + interview guide (optional)<input type="number" min="1" step="1" value={coursePlusGuide} onChange={e => setCoursePlusGuide(e.target.value)} placeholder="25000" className={input} /></label>
      <p className="mt-2 text-xs text-carinex-navy/50">The saved prices will appear on the public page and be used by Paystack checkout.</p>
    </div>}

    <div className="flex justify-end gap-3 border-t border-carinex-navy/10 pt-5">
      <button type="button" onClick={() => router.push("/admin/in-house-courses")} className="rounded-lg border border-carinex-navy/15 px-4 py-2 text-sm font-semibold text-carinex-navy">Cancel</button>
      <button type="submit" disabled={saving} className="rounded-lg bg-carinex-emerald px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Creating..." : "Create Course"}</button>
    </div>
  </form>;
}
