import Link from "next/link";
import { specializations } from "@/lib/data";

export default function PathwayPills() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
        Pathway Explorer
      </span>
      <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-carinex-navy">
        Eight ways to grow your nursing career
      </h2>

      <div className="mt-8 flex flex-wrap gap-3">
        {specializations.map((spec) => (
          <Link
            key={spec.slug}
            href={`/pathways/${spec.slug}`}
            className="rounded-full bg-carinex-navy/5 px-5 py-3 text-base text-carinex-navy transition hover:bg-carinex-emerald/10 hover:text-carinex-emerald"
          >
            {spec.title}
          </Link>
        ))}
      </div>

      <Link
        href="/pathways"
        className="mt-8 inline-block text-sm font-semibold text-carinex-emerald hover:underline"
      >
        See full pathway details →
      </Link>
    </section>
  );
}
