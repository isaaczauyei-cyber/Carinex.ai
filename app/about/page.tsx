import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          About Carinex
        </span>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-carinex-navy">
          Turning nursing experience into a global remote healthcare career
        </h1>

        <div className="mt-8 flex flex-col gap-6 text-carinex-navy/80">
          <p>
            Carinex is a Nigerian-born career platform helping licensed nurses
            discover, prepare for, and access remote and telehealth
            healthcare careers. A nurse trying to go remote today has to
            piece it together herself — scattered advice, unclear course
            choices, job listings that reject her for being in the wrong
            country, no way to tell which certifications actually matter.
          </p>
          <p>
            Carinex fixes that with one thing most platforms don&apos;t
            combine: verified license status, a real course pathway matched
            to what employers actually ask for, and roles matched to what
            you&apos;re genuinely eligible for — not just another job board.
          </p>
          <p>
            We work across eight specializations spanning both a National
            track (Nigerian telehealth providers, HMOs, and clinics) and a
            Global track (international remote care roles) — each with its
            own eligibility requirements shown honestly, before you invest
            time in a course pathway.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
