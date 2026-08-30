import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Tracks from "@/components/Tracks";
import JourneySection from "@/components/JourneySection";
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

      <section id="opportunity-intelligence" className="bg-carinex-white/60 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <ComingSoon
            eyebrow="Opportunity Intelligence"
            title="Roles Matched to What You're Actually Eligible For"
            description="Carinex shows opportunities you can realistically pursue.."
          />
        </div>
      </section>

      <section id="learning-hub" className="relative overflow-hidden bg-gradient-to-br from-carinex-navy via-carinex-navy to-carinex-emerald py-24 text-carinex-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-carinex-white/70">
              Learning Hub
            </span>
            <h2 className="max-w-xl text-3xl font-bold tracking-tight text-carinex-white">
              Courses Mapped to Your Pathway, Not a Generic Catalog
            </h2>
            <p className="max-w-xl text-carinex-white/75">
              Every course on Carinex ties directly to a specialization&apos;s
              requirements — nothing to take on faith.
            </p>
          </div>

          <a
            href="/signup"
            className="inline-block rounded-full bg-carinex-emerald px-8 py-4 text-base font-semibold text-carinex-white shadow-lg shadow-carinex-emerald/20 transition hover:bg-carinex-emerald/90"
          >
            Get Started
          </a>
        </div>
      </section>

      <FAQ />

      <Footer />
    </main>
  );
}
