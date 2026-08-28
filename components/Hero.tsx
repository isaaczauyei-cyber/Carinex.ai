import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-carinex-navy text-carinex-white">
      <svg
        aria-hidden
        className="pointer-events-none absolute -bottom-1/3 left-1/2 h-[140%] w-[140%] -translate-x-1/2 opacity-90 md:h-[160%] md:w-[90%]"
        viewBox="0 0 800 800"
        fill="none"
      >
        <defs>
          <linearGradient id="archGradient" x1="0" y1="800" x2="0" y2="0">
            <stop offset="0%" stopColor="#081C2D" />
            <stop offset="100%" stopColor="#1F7A63" />
          </linearGradient>
        </defs>
        <path
          d="M100 800 V420 C100 220 260 80 400 80 C540 80 700 220 700 420 V800"
          stroke="url(#archGradient)"
          strokeWidth="72"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-28 md:pt-40">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-carinex-white/20 bg-carinex-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-carinex-white/80">
          Your Next Care, Connected
        </span>

        <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
          Nigerian nurses. Verified skills. Remote work that pays.
        </h1>

        <p className="mt-6 max-w-lg text-lg text-carinex-white/80">
          Carinex verifies your NMCN license, maps your skills to eight real
          remote career pathways, and shows you exactly what it takes to
          qualify — no guessing, no generic course catalog.
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
      </div>
    </section>
  );
}
