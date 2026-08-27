import type { Opportunity } from "@/lib/data";
import { checkEligibility } from "@/lib/data";

interface OpportunityCardProps {
  opportunity: Opportunity;
  // Pass the signed-in nurse's license status once auth exists (Sprint 4).
  // Defaults to false so the card never overstates eligibility before a
  // nurse has actually verified her license.
  nurseLicenseActive?: boolean;
}

export default function OpportunityCard({
  opportunity,
  nurseLicenseActive = false,
}: OpportunityCardProps) {
  const eligibility = checkEligibility(nurseLicenseActive, opportunity);
  const isEligible = eligibility === "likely-eligible";

  return (
    <div className="flex flex-col rounded-2xl border border-carinex-navy/10 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-carinex-navy">
            {opportunity.title}
          </h3>
          <p className="text-sm text-carinex-navy/60">{opportunity.employer}</p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            isEligible
              ? "bg-carinex-emerald/10 text-carinex-emerald"
              : "bg-carinex-gray/20 text-carinex-navy/70"
          }`}
        >
          {isEligible ? "✓ Likely Eligible" : "Check Requirements"}
        </span>
      </div>

      <p className="mt-3 text-sm text-carinex-navy/70">
        {opportunity.locationRestriction}
      </p>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-carinex-navy/50">
          Requirements
        </p>
        <ul className="mt-2 space-y-1">
          {opportunity.eligibilityRequirements.map((req) => (
            <li key={req} className="text-sm text-carinex-navy/70">
              · {req}
            </li>
          ))}
        </ul>
      </div>

      <a
        href={`/pathways/${opportunity.specializationSlug}`}
        className="mt-5 w-fit text-sm font-semibold text-carinex-emerald hover:underline"
      >
        View Career Roadmap →
      </a>
    </div>
  );
}
