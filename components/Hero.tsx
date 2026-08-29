import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-carinex-navy via-carinex-navy to-carinex-emerald text-carinex-white">
      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-28 md:pt-36">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-carinex-white/20 bg-carinex-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-carinex-white/80">
          Your Next Care, Connected
        </span>

        <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
          Turn Your Nursing Experience Into a Global Remote Healthcare Career.
        </h1>

        <p className="mt-6 max-w-lg text-lg text-carinex-white/80">
          Carinex helps Verified licensed nurses discover realistic career paths, gain the right skills
          and connect with verified healthcare opportunities worldwide.
             — no guessing, no generic course catalog.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-carinex-emerald px-8 py-4 text-center text-base font-semibold text-carinex-white shadow-lg shadow-carinex-emerald/20 transition hover:bg-carinex-emerald/90"
          >
            I&apos;m a nurse — get started
          </Link>
          <Link
            href="/pathways"
            className="rounded-full border border-carinex-white/30 px-8 py-4 text-center text-base font-semibold text-carinex-white transition hover:bg-carinex-white/10"
          >
            Explore pathways first
          </Link>
        </div>

        <div className="relative mt-16 overflow-hidden rounded-2xl border border-carinex-white/10 shadow-2xl">
          <Image
            src="/nurse-telehealth.jpg"
            alt="Nigerian nurse conducting a telehealth consultation"
            width={1200}
            height={700}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
