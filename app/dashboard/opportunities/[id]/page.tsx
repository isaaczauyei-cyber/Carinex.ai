import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import RichText from "@/components/RichText";

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

  const { data: profile } = await supabase.from("nurse_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");

  if (!job.specialization_id) notFound();
  const { data: eligible } = await supabase
    .from("nurse_course_completions")
    .select("id, courses!inner(specialization_id)")
    .eq("nurse_id", profile.id)
    .eq("status", "completed")
    .eq("courses.specialization_id", job.specialization_id)
    .limit(1)
    .maybeSingle();
  if (!eligible) notFound();

  const employer = job.employer_profiles as unknown as { company_name: string; company_website: string | null } | null;
  const spec = job.specializations as unknown as { name: string } | null;
  <RichText text={job.description} />
  <RichText text={job.eligibility_requirements} />

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
          {job.pay_display ? ` · ${job.pay_display}` : ""}
        </p>

        {job.pay_display && (
          <div className="mt-6 rounded-2xl border border-carinex-emerald/20 bg-carinex-emerald/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-carinex-emerald">Pay / compensation</p>
            <p className="mt-1 text-lg font-bold text-carinex-navy">{job.pay_display}</p>
          </div>
        )}

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
            <div className="mt-3">
              {job.description ? <RichText text={job.description} /> : <p className="text-carinex-navy/50">No description provided.</p>}
            </div>
          </div>

          {job.eligibility_requirements && (
            <div className="rounded-2xl border border-carinex-navy/10 bg-carinex-navy/5 p-6">
              <h2 className="text-lg font-bold text-carinex-navy">Eligibility requirements</h2>
              <div className="mt-3"><RichText text={job.eligibility_requirements} /></div>
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
