import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PathwayCard from "@/components/PathwayCard";
import { specializations } from "@/lib/data";

export default function PathwaysPage() {
  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Pathway Explorer
        </span>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight text-carinex-navy">
          Eight ways to take your nursing career remote
        </h1>
        <p className="mt-4 max-w-xl text-carinex-navy/70">
          Each pathway lists what the work actually looks like day to day and
          what it takes to qualify — read this before starting any course.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {specializations.map((spec) => (
            <PathwayCard key={spec.slug} spec={spec} />
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
