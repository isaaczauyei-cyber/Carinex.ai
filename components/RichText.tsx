import React from "react";

function inlineFormat(text: string, keyPrefix: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  return text.split(pattern).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={`${keyPrefix}-${index}`} className="font-semibold text-carinex-navy">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</em>;
    return <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>;
  });
}

export default function RichText({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  const blocks = text.trim().split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-3 text-sm leading-6 text-carinex-navy">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        const ordered = lines.every((line) => /^\d+\.\s+/.test(line));
        const bullets = lines.every((line) => /^[-•]\s+/.test(line));
        if (ordered) return <ol key={blockIndex} className="list-decimal space-y-1 pl-5">{lines.map((line, i) => <li key={i}>{inlineFormat(line.replace(/^\d+\.\s+/, ""), `${blockIndex}-${i}`)}</li>)}</ol>;
        if (bullets) return <ul key={blockIndex} className="list-disc space-y-1 pl-5">{lines.map((line, i) => <li key={i}>{inlineFormat(line.replace(/^[-•]\s+/, ""), `${blockIndex}-${i}`)}</li>)}</ul>;
        return <p key={blockIndex}>{lines.map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{inlineFormat(line, `${blockIndex}-${i}`)}</React.Fragment>)}</p>;
      })}
    </div>
  );
}
