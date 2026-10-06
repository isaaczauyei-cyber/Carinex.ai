"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddModuleButton({ courseId }: { courseId: number }) {
  const supabase = createClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function addModule() {
    const title = window.prompt("Module title:");
    if (title === null) return;
    const trimmed = title.trim();
    if (!trimmed) { alert("Please enter a module title."); return; }
    setSaving(true);
    const { error: privacyError } = await supabase.from("courses").update({ is_published: false }).eq("id", courseId).eq("is_in_house", true);
    if (privacyError) { setSaving(false); alert("Could not prepare the course for editing: " + privacyError.message); return; }
    const { data: existing, error: existingError } = await supabase.from("course_modules")
      .select("order_index").eq("course_id", courseId).order("order_index", { ascending: false }).limit(1);
    if (existingError) { setSaving(false); alert("Could not determine the next module number: " + existingError.message); return; }
    const nextOrder = existing?.[0]?.order_index ? Number(existing[0].order_index) + 1 : 1;
    const { data, error } = await supabase.from("course_modules").insert({
      course_id: courseId, order_index: nextOrder, title: trimmed, summary: null, quiz_passing_score: 70,
    }).select("id").single();
    setSaving(false);
    if (error) { alert("Could not create module: " + error.message); return; }
    router.push(`/admin/in-house-courses/${courseId}/modules/${data.id}`);
    router.refresh();
  }

  return <button type="button" onClick={addModule} disabled={saving}
    className="rounded-lg bg-carinex-emerald px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
    {saving ? "Creating..." : "+ Add Module"}
  </button>;
}