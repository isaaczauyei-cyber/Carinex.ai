// components/ComingSoon.tsx
// Reusable placeholder for features whose backend already exists (jobs,
// employer_profiles, payments tables are live in Supabase) but that aren't
// surfaced on the frontend yet — Phase 2/3/4 per the launch roadmap.
// Swap this out for the real component (e.g. <OpportunityCard />) when a
// given phase actually launches — no backend work needed at that point.

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

      <div className="mt-6 rounded-arch border border-dashed border-carinex-navy/20 bg-carinex-white/60 px-8 py-14 text-center">
        <p className="text-lg font-semibold text-carinex-navy">Launching soon</p>
        <p className="mt-2 text-sm text-carinex-navy/60">
          We&apos;re building this out next — check back shortly.
        </p>
      </div>
    </div>
  );
}
