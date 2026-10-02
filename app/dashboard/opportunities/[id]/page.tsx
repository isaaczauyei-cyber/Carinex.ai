import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

function splitList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\s*·\s*|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitParagraphs(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select("*, employer_profiles(company_name, company_website), specializations(name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!job || job.status !== "live") notFound();

  const employer = job.employer_profiles as unknown as { company_name: string; company_website: string | null } | null;
  const spec = job.specializations as unknown as { name: string } | null;
  const descriptionParagraphs = splitParagraphs(job.description);
  const requirements = splitList(job.eligibility_requirements);

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-2xl px-6 py-16">
        <a
          href="/dashboard/opportunities"
          className="text-sm font-semibold text-carinex-emerald hover:underline"
        >
          ← All opportunities
        </a>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {job.track_type && (
            <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
              {job.track_type === "national" ? "National" : "Global"}
            </span>
          )}
          {job.work_mode && (
            <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
              {job.work_mode === "sync" ? "Real-time" : job.work_mode === "async" ? "Flexible" : "Onsite"}
            </span>
          )}
          {spec?.name && (
            <span className="rounded-full bg-carinex-emerald/10 px-3 py-1 text-xs font-semibold text-carinex-emerald">
              {spec.name}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-carinex-navy">{job.title}</h1>
        <p className="mt-1 text-carinex-navy/60">
          {employer?.company_name || "Employer"}
          {job.currency ? ` · Paid in ${job.currency}` : ""}
        </p>

        {job.requires_foreign_license && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-bold text-amber-900">
              Requires a foreign nursing license
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
              This role requires an active nursing license in{" "}
              {job.foreign_license_country || "the employer's country"}, not just an
              NMCN license. Confirm your eligibility before applying.
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-8">
          <div>
            <h2 className="text-lg font-bold text-carinex-navy">About this role</h2>
            <div className="mt-3 flex flex-col gap-3">
              {descriptionParagraphs.length > 0 ? (
                descriptionParagraphs.map((para, i) => (
                  <p key={i} className="leading-relaxed text-carinex-navy/80">
                    {para}
                  </p>
                ))
              ) : (
                <p className="text-carinex-navy/50">No description provided.</p>
              )}
            </div>
          </div>

          {requirements.length > 0 && (
            <div className="rounded-2xl border border-carinex-navy/10 bg-carinex-navy/5 p-6">
              <h2 className="text-lg font-bold text-carinex-navy">Eligibility requirements</h2>
              <ul className="mt-3 flex flex-col gap-1.5">
                {requirements.map((req, i) => (
                  <li key={i} className="text-sm text-carinex-navy/70">· {req}</li>
                ))}
              </ul>
            </div>
          )}

          {job.location_restriction && (
            <div>
              <h2 className="text-lg font-bold text-carinex-navy">Location</h2>
              <p className="mt-2 text-carinex-navy/70">{job.location_restriction}</p>
            </div>
          )}

          {employer?.company_website && (
            <div>
              <h2 className="text-lg font-bold text-carinex-navy">About the employer</h2>
              <a
                href={employer.company_website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-carinex-emerald hover:underline"
              >
                {employer.company_website}
              </a>
            </div>
          )}
        </div>

        <a
          href={job.external_apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-block rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-white transition hover:bg-carinex-emerald/90"
        >
          Apply for this role
        </a>
      </section>
      <Footer />
    </main>
  );
}
