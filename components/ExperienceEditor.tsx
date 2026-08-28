"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Experience = {
  id: string;
  title: string;
  organization: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
};

export default function ExperienceEditor({ nurseId }: { nurseId: string }) {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    organization: "",
    start_date: "",
    end_date: "",
    is_current: false,
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("nurse_experience")
      .select("*")
      .eq("nurse_id", nurseId)
      .order("start_date", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [nurseId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.organization.trim()) return;

    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("nurse_experience")
      .insert({
        nurse_id: nurseId,
        title: form.title,
        organization: form.organization,
        start_date: form.start_date || null,
        end_date: form.is_current ? null : form.end_date || null,
        is_current: form.is_current,
        description: form.description || null,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setForm({ title: "", organization: "", start_date: "", end_date: "", is_current: false, description: "" });
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("nurse_experience").delete().eq("id", id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (loading) return <p className="text-sm text-carinex-navy/50">Loading experience…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-carinex-navy/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-carinex-navy">{item.title}</p>
                <p className="text-sm text-carinex-navy/70">{item.organization}</p>
                <p className="text-xs text-carinex-navy/50">
                  {item.start_date || "—"} to {item.is_current ? "Present" : item.end_date || "—"}
                </p>
                {item.description && (
                  <p className="mt-2 text-sm text-carinex-navy/70">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-carinex-navy/50">No experience added yet.</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-lg border border-dashed border-carinex-navy/20 p-4">
        <p className="text-sm font-semibold text-carinex-navy">Add experience</p>
        <input
          type="text"
          placeholder="Title (e.g. Staff Nurse)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <input
          type="text"
          placeholder="Organization"
          value={form.organization}
          onChange={(e) => setForm({ ...form, organization: e.target.value })}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <div className="flex gap-3">
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            className="flex-1 rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
          />
          <input
            type="date"
            value={form.end_date}
            disabled={form.is_current}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            className="flex-1 rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none disabled:opacity-50"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-carinex-navy">
          <input
            type="checkbox"
            checked={form.is_current}
            onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
          />
          I currently work here
        </label>
        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-full bg-carinex-navy px-5 py-2.5 text-sm font-semibold text-carinex-white disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </form>
    </div>
  );
}
