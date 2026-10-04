"use client";

import { useEffect, useRef, useState } from "react";

type Props = { value: string; onSave: (next: string) => void; placeholder?: string; rows?: number };

export default function RichTextEditor({ value, onSave, placeholder, rows = 5 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(value || "");
  const lastSaved = useRef(value || "");

  useEffect(() => {
    const incoming = value || "";
    if (incoming !== lastSaved.current) {
      setText(incoming);
      lastSaved.current = incoming;
    }
  }, [value]);

  function replaceSelection(before: string, after = before, fallback = "text") {
    const el = ref.current; if (!el) return;
    const start = el.selectionStart; const end = el.selectionEnd;
    const selected = text.slice(start, end) || fallback;
    const next = text.slice(0, start) + before + selected + after + text.slice(end);
    setText(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = start + before.length; el.selectionEnd = start + before.length + selected.length; });
  }

  function insertList(prefix: (index: number) => string) {
    const el = ref.current; if (!el) return;
    const start = el.selectionStart; const end = el.selectionEnd;
    const selected = text.slice(start, end) || "List item";
    const listed = selected.split("\n").map((line, index) => `${prefix(index)}${line}`).join("\n");
    const next = text.slice(0, start) + listed + text.slice(end);
    setText(next); requestAnimationFrame(() => el.focus());
  }

  function insertParagraphBreak() {
    const el = ref.current; if (!el) return;
    const start = el.selectionStart; const next = text.slice(0, start) + "\n\n" + text.slice(start);
    setText(next); requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + 2; });
  }

  function save() { if (text !== lastSaved.current) { lastSaved.current = text; onSave(text); } }

  const toolClass = "rounded border border-carinex-navy/15 px-2 py-1 text-xs font-semibold text-carinex-navy hover:bg-carinex-navy/5";
  return (
    <div className="overflow-hidden rounded-lg border border-carinex-navy/20 focus-within:border-carinex-emerald">
      <div className="flex flex-wrap items-center gap-1 border-b border-carinex-navy/10 bg-carinex-navy/[0.03] p-2">
        <button type="button" className={toolClass} onClick={() => replaceSelection("**")}>B</button>
        <button type="button" className={toolClass} onClick={() => replaceSelection("*", "*", "italic text")}>I</button>
        <button type="button" className={toolClass} onClick={() => insertList((i) => `${i + 1}. `)}>1. List</button>
        <button type="button" className={toolClass} onClick={() => insertList(() => "- ")}>• List</button>
        <button type="button" className={toolClass} onClick={insertParagraphBreak}>¶ Paragraph</button>
      </div>
      <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} onBlur={save} rows={rows} placeholder={placeholder} className="w-full resize-y border-0 bg-transparent px-3 py-2 text-sm text-carinex-navy outline-none focus:ring-0" />
      <div className="border-t border-carinex-navy/10 px-3 py-1 text-[10px] text-carinex-navy/40">Formatting is saved automatically when you leave this field.</div>
    </div>
  );
}
