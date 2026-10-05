"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onSave: (next: string) => void;
  placeholder?: string;
  rows?: number;
};

const editorClass =
  "w-full rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm text-carinex-navy focus:border-carinex-emerald focus:outline-none";

export default function RichTextEditor({
  value,
  onSave,
  placeholder,
  rows = 5,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(value || "");

  useEffect(() => {
    setText(value || "");
  }, [value]);

  function replaceSelection(transform: (selected: string) => string, selectOffset = 0) {
    const element = ref.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = text.slice(start, end) || "text";
    const replacement = transform(selected);
    const next = text.slice(0, start) + replacement + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      element.focus();
      element.selectionStart = start + selectOffset;
      element.selectionEnd = start + replacement.length;
    });
  }

  function wrap(marker: string) {
    replaceSelection((selected) => `${marker}${selected}${marker}`, marker.length);
  }

  function makeList(prefix: string) {
    replaceSelection(
      (selected) =>
        selected
          .split("\n")
          .map((line, index) => `${prefix === "number" ? `${index + 1}. ` : "• "}${line}`)
          .join("\n"),
      0
    );
  }

  function paragraphBreak() {
    const element = ref.current;
    if (!element) return;
    const start = element.selectionStart;
    const next = text.slice(0, start) + "\n\n" + text.slice(start);
    setText(next);
    requestAnimationFrame(() => {
      element.focus();
      element.selectionStart = element.selectionEnd = start + 2;
    });
  }

  function toolbarButton(label: string, action: () => void, title: string) {
    return (
      <button
        key={label}
        type="button"
        title={title}
        onMouseDown={(event) => event.preventDefault()}
        onClick={action}
        className="rounded-md border border-carinex-navy/15 px-2.5 py-1.5 text-xs font-semibold text-carinex-navy hover:bg-carinex-navy/5"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-carinex-navy/20 focus-within:border-carinex-emerald">
      <div className="flex flex-wrap gap-2 border-b border-carinex-navy/10 bg-carinex-navy/[0.03] p-2">
        {toolbarButton("B", () => wrap("**"), "Bold selected text")}
        {toolbarButton("1. List", () => makeList("number"), "Numbered list")}
        {toolbarButton("• List", () => makeList("bullet"), "Bulleted list")}
        {toolbarButton("¶ Paragraph", paragraphBreak, "Insert paragraph break")}
      </div>
      <textarea
        ref={ref}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => onSave(text)}
        placeholder={placeholder}
        rows={rows}
        className={`${editorClass} resize-y rounded-none border-0 focus:border-0 focus:ring-0`}
      />
      <p className="border-t border-carinex-navy/10 px-3 py-1.5 text-[11px] text-carinex-navy/45">
        Select text and use the toolbar. Supports bold, numbered lists, bullet lists and paragraph breaks. Saves when you leave the editor.
      </p>
    </div>
  );
}
