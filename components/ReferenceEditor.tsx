"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Reference = {
  id: string;
  name: string;
  relationship: string;
  contact_info: string;
};

export default function ReferenceEditor({ nurseId }: { nurseId: string }) {
  const [items, setItems] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", relationship: "", contact_info: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("nurse_references")
      .select("*")
      .eq("nurse_id", nurseId)
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [nurseId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact_info.trim()) return;

    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("nurse_references")
      .insert({ nurse_id: nurseId, ...form })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setItems((prev) => [...prev, data]);
      setForm({ name: "", relationship: "", contact_info: "" });
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("nurse_references").delete().eq("id", id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (loading) return <p className="text-sm text-carinex-navy/50">Loading references…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-carinex-navy/10 p-3">
            <div>
              <p className="text-sm font-semibold text-carinex-navy">{item.name} · {item.relationship}</p>
              <p className="text-xs text-carinex-navy/60">{item.contact_info}</p>
            </div>
            <button onClick={() => handleDelete(item.id)} className="text-sm text-red-600 hover:underline">
              Remove
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-carinex-navy/50">No references added yet.</p>}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-lg border border-dashed border-carinex-navy/20 p-4">
        <p className="text-sm font-semibold text-carinex-navy">Add a professional reference</p>
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <input
          type="text"
          placeholder="Relationship (e.g. Supervisor, Colleague)"
          value={form.relationship}
          onChange={(e) => setForm({ ...form, relationship: e.target.value })}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <input
          type="text"
          placeholder="Email or phone"
          value={form.contact_info}
          onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
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
