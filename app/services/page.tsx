import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Tracks from "@/components/Tracks";
import Link from "next/link";

export default function ServicesPage() {
  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Our Services
        </span>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-carinex-navy">
          How Carinex works, in full
        </h1>

        <div className="mt-10 flex flex-col gap-10">
          <div>
            <h2 className="text-xl font-bold text-carinex-navy">For nurses — a real pathway, not a course dump</h2>
            <p className="mt-2 text-carinex-navy/70">
              Eight specializations, each with what the work actually looks
              like day to day, what it takes to qualify, and courses matched
              directly to that pathway&apos;s requirements. You track your
              progress course by course, and submit certificates for review
              as you complete them.
            </p>
            <Link href="/pathways" className="mt-3 inline-block text-sm font-semibold text-carinex-emerald hover:underline">
              Explore pathways →
            </Link>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">Opportunity Intelligence</h2>
            <p className="mt-2 text-carinex-navy/70">
              Remote roles matched to a specialization unlock only once
              you&apos;ve completed that pathway&apos;s required courses —
              no course list implying you&apos;re ready before you actually
              are. Separately, general hospital and clinical roles stay open
              to any nurse with an active NMCN license, regardless of course
              progress.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">For employers</h2>
            <p className="mt-2 text-carinex-navy/70">
              Carinex is built to give employers access to a growing pool of
              nurses with verified license status and demonstrated pathway
              completion — not unverified CVs. Employer-facing tools are in
              active development.
            </p>
            <Link href="/contact" className="mt-3 inline-block text-sm font-semibold text-carinex-emerald hover:underline">
              Get in touch about hiring →
            </Link>
          </div>
        </div>
      </section>

      <Tracks />

      <Footer />
    </main>
  );
}
