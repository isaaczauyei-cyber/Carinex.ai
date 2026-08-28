const steps = [
  {
    title: "Explore your pathway",
    description:
      "Eight specializations, each with what the work actually looks like day to day and what it takes to qualify — read this before starting any course.",
  },
  {
    title: "Build the skills",
    description:
      "Every specialization links to real, curated courses on established platforms — not a generic catalog with no connection to what employers ask for.",
  },
  {
    title: "Get discovered",
    description:
      "Real remote roles, matched to your verified eligibility, are on the way — sign up now to be ready when they launch.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-y border-carinex-navy/10 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          How Carinex works
        </span>
        <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-carinex-navy">
          A clearer next step for your nursing career
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-carinex-navy/10 p-6">
              <span className="text-sm font-bold text-carinex-emerald">0{i + 1}</span>
              <h3 className="mt-3 text-xl font-bold text-carinex-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-carinex-navy/70">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
