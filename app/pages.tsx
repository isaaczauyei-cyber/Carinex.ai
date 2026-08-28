import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PathwayCard from "@/components/PathwayCard";
import ComingSoon from "@/components/ComingSoon";
import Footer from "@/components/Footer";
import { specializations } from "@/lib/data";

// NOTE: OpportunityCard + the `opportunities` array in lib/data.ts are kept
// in the codebase for Phase 2/3 (Opportunity Marketplace) — the jobs/
// employer_profiles tables are already live in Supabase. Swap the
// <ComingSoon /> block below for real <OpportunityCard /> rendering when
// that phase actually launches; no backend work needed at that point.

export default function Home() {
  // Show a focused first look, not the full catalog — the full list lives at /pathways
  const featuredPathways = specializations.slice(0, 3);

  return (
    <main>
      <Navbar />
      <Hero />

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-10 flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
            Pathway Explorer
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-carinex-navy">
            Explore Remote Healthcare Pathways
          </h2>
          <p className="max-w-xl text-carinex-navy/70">
            Eight specializations, each with its own eligibility requirements
            and course pathway — no guessing which one actually fits.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredPathways.map((spec) => (
            <PathwayCard key={spec.slug} spec={spec} />
          ))}
        </div>

        <a
          href="/pathways"
          className="mt-8 inline-block text-sm font-semibold text-carinex-emerald hover:underline"
        >
          See all 8 pathways →
        </a>
      </section>

      <section className="bg-carinex-white/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <ComingSoon
            eyebrow="Opportunity Intelligence"
            title="Roles Matched to What You're Actually Eligible For"
            description="Real listings, matched to your verified eligibility, are on the way — for now, focus on getting pathway-ready."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-10 flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
            Learning Hub
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-carinex-navy">
            Courses Mapped to Your Pathway, Not a Generic Catalog
          </h2>
          <p className="max-w-xl text-carinex-navy/70">
            Every course on Carinex ties directly to a specialization&apos;s
            requirements — nothing to take on faith.
          </p>
        </div>

        <a
          href="/assessment"
          className="inline-block rounded-full bg-carinex-navy px-8 py-4 text-base font-semibold text-carinex-white transition hover:bg-carinex-navy/90"
        >
          Find My Career Path
        </a>
      </section>

      <Footer />
    </main>
  );
}
