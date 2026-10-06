"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  track_type: string | null;
  work_mode: string | null;
  location_restriction: string | null;
  pay_display: string | null;
  employer_profiles: { company_name: string } | null;
  specializations: { id: number; name: string } | null;
};

export default function OpportunityFilters({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [track, setTrack] = useState("all");
  const [workMode, setWorkMode] = useState("all");

  const specs = useMemo(() => {
    const map = new Map<number, string>();
    jobs.forEach((job) => { if (job.specializations) map.set(job.specializations.id, job.specializations.name); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const haystack = `${job.title} ${job.employer_profiles?.company_name || ""} ${job.specializations?.name || ""}`.toLowerCase();
      return (!q || haystack.includes(q)) &&
        (specialization === "all" || String(job.specializations?.id) === specialization) &&
        (track === "all" || job.track_type === track) &&
        (workMode === "all" || job.work_mode === workMode);
    });
  }, [jobs, query, specialization, track, workMode]);

  return (
    <>
      <div className="mt-8 grid gap-3 rounded-2xl border border-carinex-navy/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search jobs, employers or specializations" className="rounded-lg border border-carinex-navy/15 px-3 py-2.5 text-sm outline-none focus:border-carinex-emerald sm:col-span-2 lg:col-span-4" />
        <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="rounded-lg border border-carinex-navy/15 px-3 py-2.5 text-sm outline-none focus:border-carinex-emerald"><option value="all">All specializations</option>{specs.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
        <select value={track} onChange={(e) => setTrack(e.target.value)} className="rounded-lg border border-carinex-navy/15 px-3 py-2.5 text-sm outline-none focus:border-carinex-emerald"><option value="all">All tracks</option><option value="national">National</option><option value="global">Global</option></select>
        <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="rounded-lg border border-carinex-navy/15 px-3 py-2.5 text-sm outline-none focus:border-carinex-emerald"><option value="all">All work modes</option><option value="sync">Real-time</option><option value="async">Flexible</option><option value="onsite">On-site</option></select>
        <div className="flex items-center text-sm text-carinex-navy/50">{filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}</div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {filtered.map((job) => <Link key={job.id} href={`/dashboard/opportunities/${job.id}`} className="rounded-xl border border-carinex-navy/10 bg-white p-5 transition hover:border-carinex-emerald/40 hover:shadow-sm">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-semibold text-carinex-navy">{job.title}</p><p className="mt-0.5 text-sm text-carinex-navy/50">{job.employer_profiles?.company_name || "Employer"}{job.specializations?.name ? ` · ${job.specializations.name}` : ""}</p></div><div className="flex shrink-0 flex-wrap justify-end gap-1.5">{job.track_type && <span className="rounded-full bg-carinex-navy/5 px-2.5 py-1 text-xs font-semibold text-carinex-navy/70">{job.track_type === "national" ? "National" : "Global"}</span>}{job.work_mode && <span className="rounded-full bg-carinex-navy/5 px-2.5 py-1 text-xs text-carinex-navy/50">{job.work_mode === "sync" ? "Real-time" : job.work_mode === "async" ? "Flexible" : "On-site"}</span>}</div></div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-carinex-navy/50">{job.location_restriction && <span>{job.location_restriction}</span>}{job.pay_display && <span className="font-semibold text-carinex-emerald">{job.pay_display}</span>}</div>
          </Link>)}
        </div>
      ) : <div className="mt-4 rounded-2xl border border-dashed border-carinex-navy/20 p-10 text-center"><p className="font-semibold text-carinex-navy">No matching opportunities</p><p className="mt-2 text-sm text-carinex-navy/50">Try changing your search or filters.</p></div>}
    </>
  );
}
