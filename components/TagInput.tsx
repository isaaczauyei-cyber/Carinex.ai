"use client";

import { useState } from "react";

export type TagOption = { id: number; name: string };

type TagInputProps = {
  label: string;
  options: TagOption[];
  selected: number[];
  onChange: (selected: number[]) => void;
  onCreateOption?: (name: string) => Promise<TagOption | null>;
  placeholder?: string;
};

export default function TagInput({
  label,
  options,
  selected,
  onChange,
  onCreateOption,
  placeholder = "Start typing...",
}: TagInputProps) {
  const [query, setQuery] = useState("");
  const [allOptions, setAllOptions] = useState(options);
  const [creating, setCreating] = useState(false);

  const selectedOptions = allOptions.filter((o) => selected.includes(o.id));
  const suggestions = allOptions
    .filter((o) => !selected.includes(o.id))
    .filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  const exactMatch = allOptions.some(
    (o) => o.name.toLowerCase() === query.trim().toLowerCase()
  );

  function addOption(id: number) {
    onChange([...selected, id]);
    setQuery("");
  }

  function removeOption(id: number) {
    onChange(selected.filter((s) => s !== id));
  }

  async function handleCreate() {
    if (!onCreateOption || !query.trim() || creating) return;
    setCreating(true);
    const created = await onCreateOption(query.trim());
    setCreating(false);
    if (created) {
      setAllOptions((prev) => [...prev, created]);
      addOption(created.id);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-carinex-navy">{label}</label>

      <div className="flex flex-wrap gap-2">
        {selectedOptions.map((opt) => (
          <span
            key={opt.id}
            className="flex items-center gap-1.5 rounded-full bg-carinex-emerald/10 px-3 py-1.5 text-sm text-carinex-emerald"
          >
            {opt.name}
            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              className="text-carinex-emerald/70 hover:text-carinex-emerald"
              aria-label={`Remove ${opt.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />

        {query && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-carinex-navy/10 bg-white shadow-lg">
            {suggestions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => addOption(opt.id)}
                className="block w-full px-4 py-2 text-left text-sm text-carinex-navy hover:bg-carinex-emerald/5"
              >
                {opt.name}
              </button>
            ))}

            {!exactMatch && onCreateOption && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="block w-full border-t border-carinex-navy/10 px-4 py-2 text-left text-sm font-medium text-carinex-emerald hover:bg-carinex-emerald/5"
              >
                {creating ? "Adding..." : `+ Add "${query.trim()}"`}
              </button>
            )}

            {suggestions.length === 0 && !onCreateOption && (
              <p className="px-4 py-2 text-sm text-carinex-navy/50">No matches</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
