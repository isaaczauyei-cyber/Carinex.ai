import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSpecializationBySlug, specializations } from "@/lib/data";

const trackLabel: Record<string, string> = {
  national: "Nigeria-based",
  global: "International",
  both: "Nigeria + International",
};

const workModeLabel: Record<string, string> = {
  sync: "Real-time (scheduled calls/video)",
  async: "Flexible (self-paced, no fixed hours)",
  mixed: "Mix of scheduled and flexible work",
};

export function generateStaticParams() {
  return specializations.map((spec) => ({ slug: spec.slug }));
}

export default function PathwayDetailPage({ params }: { params: { slug: string } }) {
  const spec = getSpecializationBySlug(params.slug);

  if (!spec) {
    notFound();
  }

  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <a href="/pathways" className="text-sm font-semibold text-carinex-emerald hover:underline">
          ← All pathways
        </a>

        <span className="mt-6 inline-block w-fit rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
          {trackLabel[spec.track]}
        </span>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-carinex-navy">
          {spec.title}
        </h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {spec.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-carinex-gray/40 px-3 py-1 text-xs text-carinex-navy/70"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-8">
          <div>
            <h2 className="text-lg font-bold text-carinex-navy">What it is</h2>
            <p className="mt-2 text-carinex-navy/70">{spec.whatItIs}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">Why it matters</h2>
            <p className="mt-2 text-carinex-navy/70">{spec.whyItMatters}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">Day to day</h2>
            <p className="mt-2 text-carinex-navy/70">{spec.dayToDay}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">Work mode</h2>
            <p className="mt-2 text-carinex-navy/70">{workModeLabel[spec.workMode]}</p>
          </div>

          <div className="rounded-2xl border border-carinex-navy/10 bg-carinex-navy/5 p-6">
            <h2 className="text-lg font-bold text-carinex-navy">Eligibility</h2>
            <p className="mt-2 text-carinex-navy/70">{spec.eligibilityGate}</p>
          </div>
        </div>

        <a
          href="/signup"
          className="mt-10 inline-block rounded-full bg-carinex-emerald px-8 py-4 text-base font-semibold text-carinex-white transition hover:bg-carinex-emerald/90"
        >
          Get Started
        </a>
      </section>

      <Footer />
    </main>
  );
}
