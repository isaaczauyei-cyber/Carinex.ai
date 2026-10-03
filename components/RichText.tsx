function parseBold(text: string): (string | JSX.Element)[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-carinex-navy">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function RichText({ text }: { text: string | null | undefined }) {
  if (!text) return null;

  // Auto-detect a numbered "1 — ... 2 — ..." step pattern and render as a
  // real ordered list, even if no manual line breaks were typed.
  const stepMatches = text.match(/\d{1,2}\s*[—–-]\s*/g) || [];
  if (stepMatches.length >= 3) {
    const chunks = text
      .split(/(?=\d{1,2}\s*[—–-]\s*)/g)
      .map((c) => c.trim())
      .filter(Boolean);
    return (
      <ol className="flex flex-col gap-3">
        {chunks.map((chunk, i) => {
          const match = chunk.match(/^(\d{1,2}\s*[—–-]\s*)([\s\S]*)$/);
          const prefix = match ? match[1] : "";
          const rest = match ? match[2] : chunk;
          return (
            <li key={i} className="leading-relaxed text-carinex-navy/80">
              {prefix && <strong className="text-carinex-navy">{prefix}</strong>}
              {parseBold(rest)}
            </li>
          );
        })}
      </ol>
    );
  }

  // Otherwise: respect real paragraph breaks and **bold** markers.
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const blocks = paragraphs.length > 0 ? paragraphs : [text];

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-wrap leading-relaxed text-carinex-navy/80">
          {parseBold(block)}
        </p>
      ))}
    </div>
  );
}
