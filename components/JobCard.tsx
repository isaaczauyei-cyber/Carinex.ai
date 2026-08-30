type Job = {
  id: string;
  title: string;
  description: string;
  work_mode: string;
  currency: string | null;
  location_restriction: string | null;
  external_apply_url: string;
  requires_foreign_license: boolean;
  foreign_license_country: string | null;
  employer_profiles: { company_name: string } | null;
};

const workModeLabel: Record<string, string> = {
  sync: "Remote — real-time",
  async: "Remote — flexible",
  onsite: "On-site",
};

export default function JobCard({ job }: { job: Job }) {
  return (
    <div className="rounded-xl border border-carinex-navy/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-carinex-navy">{job.title}</p>
          <p className="text-sm text-carinex-navy/60">
            {job.employer_profiles?.company_name || "Employer"}
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
          {workModeLabel[job.work_mode] || job.work_mode}
        </span>
      </div>

      <p className="mt-3 text-sm text-carinex-navy/70">{job.description}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-carinex-navy/50">
        {job.location_restriction && <span>{job.location_restriction}</span>}
        {job.currency && <span>Paid in {job.currency}</span>}
      </div>

      {job.requires_foreign_license && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Requires a nursing license valid in {job.foreign_license_country || "the employing country"} — an active NMCN license alone does not qualify for this specific role.
        </p>
      )}

      <a
        href={job.external_apply_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block rounded-full bg-carinex-emerald px-5 py-2 text-sm font-semibold text-carinex-white hover:bg-carinex-emerald/90"
      >
        Apply →
      </a>
    </div>
  );
}
