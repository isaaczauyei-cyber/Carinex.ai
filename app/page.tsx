import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Tracks from "@/components/Tracks";
import PathwayPills from "@/components/PathwayPills";
import ComingSoon from "@/components/ComingSoon";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Tracks />

      <PathwayPills />

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
          href="/signup"
          className="inline-block rounded-full bg-carinex-navy px-8 py-4 text-base font-semibold text-carinex-white transition hover:bg-carinex-navy/90"
        >
          Get Started
        </a>
      </section>

      <FAQ />

      <Footer />
    </main>
  );
}
