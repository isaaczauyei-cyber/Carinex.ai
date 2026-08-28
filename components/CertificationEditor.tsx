"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Certification = {
  id: string;
  title: string;
  issuing_organization: string;
  issue_date: string | null;
  credential_url: string | null;
};

export default function CertificationEditor({ nurseId }: { nurseId: string }) {
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    issuing_organization: "",
    issue_date: "",
    credential_url: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("nurse_certifications")
      .select("*")
      .eq("nurse_id", nurseId)
      .order("issue_date", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [nurseId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.issuing_organization.trim()) return;

    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("nurse_certifications")
      .insert({
        nurse_id: nurseId,
        title: form.title,
        issuing_organization: form.issuing_organization,
        issue_date: form.issue_date || null,
        credential_url: form.credential_url || null,
      })
      .select()
      .single();
    setSaving(false);

    if (!error && data) {
      setItems((prev) => [data, ...prev]);
      setForm({ title: "", issuing_organization: "", issue_date: "", credential_url: "" });
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("nurse_certifications").delete().eq("id", id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (loading) return <p className="text-sm text-carinex-navy/50">Loading certifications…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-carinex-navy/10 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-carinex-navy">{item.title}</p>
                <p className="text-sm text-carinex-navy/70">{item.issuing_organization}</p>
                {item.issue_date && (
                  <p className="text-xs text-carinex-navy/50">Issued {item.issue_date}</p>
                )}
                {item.credential_url && (
                  <a
                    href={item.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-carinex-emerald hover:underline"
                  >
                    View credential
                  </a>
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
          <p className="text-sm text-carinex-navy/50">No certifications added yet.</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-lg border border-dashed border-carinex-navy/20 p-4">
        <p className="text-sm font-semibold text-carinex-navy">Add certification</p>
        <input
          type="text"
          placeholder="Certification title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <input
          type="text"
          placeholder="Issuing organization"
          value={form.issuing_organization}
          onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <input
          type="date"
          value={form.issue_date}
          onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <input
          type="url"
          placeholder="Credential URL (optional)"
          value={form.credential_url}
          onChange={(e) => setForm({ ...form, credential_url: e.target.value })}
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
