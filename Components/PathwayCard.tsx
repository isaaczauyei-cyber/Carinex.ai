import Link from "next/link";
import type { Specialization } from "@/lib/data";

const trackLabel: Record<Specialization["track"], string> = {
  national: "Nigeria-based",
  global: "International",
  both: "Nigeria + International",
};

export default function PathwayCard({ spec }: { spec: Specialization }) {
  return (
    <Link
      href={`/pathways/${spec.slug}`}
      className="group flex flex-col rounded-2xl border border-carinex-navy/10 bg-white p-6 transition hover:border-carinex-emerald/40 hover:shadow-md"
    >
      <span className="mb-3 w-fit rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
        {trackLabel[spec.track]}
      </span>

      <h3 className="text-lg font-bold text-carinex-navy">{spec.title}</h3>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-carinex-navy/70">
        {spec.whatItIs}
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {spec.skills.map((skill) => (
          <li
            key={skill}
            className="rounded-full border border-carinex-gray/40 px-3 py-1 text-xs text-carinex-navy/70"
          >
            {skill}
          </li>
        ))}
      </ul>

      <span className="mt-5 text-sm font-semibold text-carinex-emerald transition group-hover:translate-x-0.5">
        Explore this pathway →
      </span>
    </Link>
  );
}
