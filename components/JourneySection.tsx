import Link from "next/link";

const steps = [
  {
    label: "Discover",
    title: "Find pathways that fit your license and goals",
    description:
      "Eight real specializations, each with what the work actually looks like day to day and what it takes to qualify — read before you commit to anything.",
    href: "/pathways",
    cta: "Explore pathways →",
  },
  {
    label: "Prepare",
    title: "Build the specific skills each pathway requires",
    description:
      "Every specialization links to real, curated courses — not a generic catalog. Track your progress and submit certificates as you complete them.",
    href: "/signup",
    cta: "Start learning →",
  },
  {
    label: "Connect",
    title: "See roles matched to what you're actually eligible for",
    description:
      "Remote opportunities unlock once you've completed a pathway's requirements. General hospital and clinical roles stay open to any licensed nurse.",
    href: "/signup",
    cta: "Get started →",
  },
];

export default function JourneySection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          How Carinex Works
        </span>
        <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-carinex-navy">
          Discover. Prepare. Connect.
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.label} className="flex flex-col rounded-2xl border border-carinex-navy/10 p-6">
              <span className="text-xs font-bold uppercase tracking-wide text-carinex-emerald">
                {step.label}
              </span>
              <h3 className="mt-2 text-lg font-bold text-carinex-navy">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm text-carinex-navy/70">{step.description}</p>
              <Link href={step.href} className="mt-4 text-sm font-semibold text-carinex-emerald hover:underline">
                {step.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
