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

const orderedPattern = /^\d+\.\s+/;
const bulletPattern = /^[-•]\s+/;

export default function RichText({ text }: { text: string | null | undefined }) {
  if (!text) return null;

  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, blockIdx) => {
        const lines = block.split("\n").filter((l) => l.trim());

        if (lines.length > 0 && lines.every((l) => orderedPattern.test(l))) {
          return (
            <ol key={blockIdx} className="flex flex-col gap-2 pl-1">
              {lines.map((line, i) => (
                <li key={i} className="flex gap-2 leading-relaxed text-carinex-navy/80">
                  <span className="shrink-0 font-semibold text-carinex-navy">
                    {line.match(orderedPattern)?.[0].trim()}
                  </span>
                  <span>{parseBold(line.replace(orderedPattern, ""))}</span>
                </li>
              ))}
            </ol>
          );
        }

        if (lines.length > 0 && lines.every((l) => bulletPattern.test(l))) {
          return (
            <ul key={blockIdx} className="flex flex-col gap-2 pl-1">
              {lines.map((line, i) => (
                <li key={i} className="flex gap-2 leading-relaxed text-carinex-navy/80">
                  <span className="shrink-0 text-carinex-emerald">•</span>
                  <span>{parseBold(line.replace(bulletPattern, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIdx} className="leading-relaxed text-carinex-navy/80">
            {lines.map((line, i) => (
              <span key={i}>
                {parseBold(line)}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
