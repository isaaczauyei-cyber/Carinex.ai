interface ComingSoonProps {
  eyebrow: string;
  title: string;
  description: string;
}

export default function ComingSoon({ eyebrow, title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-bold tracking-tight text-carinex-navy">{title}</h2>
      <p className="max-w-xl text-carinex-navy/70">{description}</p>
    </div>
  );
}
