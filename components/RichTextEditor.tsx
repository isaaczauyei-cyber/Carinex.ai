"use client";

import { useRef, useState } from "react";

export default function RichTextEditor({
  value,
  onSave,
  placeholder,
  rows = 5,
}: {
  value: string;
  onSave: (next: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(value);

  function wrapSelection(marker: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end) || "text";
    const next = text.slice(0, start) + marker + selected + marker + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = start + marker.length;
      el.selectionEnd = start + marker.length + selected.length;
    });
  }

  function insertList(prefix: (i: number) => string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end) || "List item";
    const lines = selected.split("\n");
    const listed = lines.map((l, i) => `${prefix(i)}${l}`).join("\n");
    const next = text.slice(0, start) + listed + text.slice(end);
    setText(next);
    requestAnimationFrame(() => el.focus());
  }

  function insertParagraphBreak() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const next = text.slice(0, start) + "\n\n" + text.slice(start);
    setText(next);
    requestAnimationFrame(() => el.focus());
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => wrapSelection("**")}
          className="rounded border border-carinex-navy/20 px-2 py-1 text-xs font-bold text-carinex-navy hover:bg-carinex-navy/5"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertList((i) => `${i + 1}. `)}
          className="rounded border border-carinex-navy/20 px-2 py-1 text-xs font-semibold text-carinex-navy hover:bg-carinex-navy/5"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => insertList(() => "- ")}
          className="rounded border border-carinex-navy/20 px-2 py-1 text-xs font-semibold text-carinex-navy hover:bg-carinex-navy/5"
        >
          • List
        </button>
        <button
          type="button"
          onClick={insertParagraphBreak}
          className="rounded border border-carinex-navy/20 px-2 py-1 text-xs font-semibold text-carinex-navy hover:bg-carinex-navy/5"
        >
          ¶ New paragraph
        </button>
      </div>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onSave(text)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-carinex-navy/20 px-3 py-2.5 text-sm focus:border-carinex-emerald focus:outline-none"
      />
      <p className="mt-1 text-xs text-carinex-navy/40">
        Select text and click **B** to bold, or click 1./• then type to start a list. Blank line = new paragraph.
      </p>
    </div>
  );
}
