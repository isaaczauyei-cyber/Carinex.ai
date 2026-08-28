export default function Tracks() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Two tracks, one profile
        </span>
        <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-carinex-navy">
          Wherever the work is, we map the path
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-carinex-emerald/10 p-8">
            <h3 className="text-xl font-bold text-carinex-navy">National track</h3>
            <p className="mt-3 text-carinex-navy/75">
              Nigerian telehealth providers, HMOs, and NGO programs hiring
              for remote triage, patient follow-up, and case management —
              familiar clinical context, paid in Naira.
            </p>
          </div>
          <div className="rounded-2xl bg-carinex-emerald/10 p-8">
            <h3 className="text-xl font-bold text-carinex-navy">Global track</h3>
            <p className="mt-3 text-carinex-navy/75">
              International remote care roles — medical scribing, healthcare
              data and AI-assisted documentation — with your NMCN license as
              the clinical foundation employers ask for.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
