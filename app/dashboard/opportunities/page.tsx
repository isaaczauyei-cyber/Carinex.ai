import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getSpecializationProgress } from "@/lib/specialization-status";

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id, career_goal")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const progress = await getSpecializationProgress(profile.id);
  const hasCompletedAnyPathway = progress.some((p) => p.status === "unlocked");
  const assessmentDone = !!profile.career_goal;

  let jobs: {
    id: string;
    title: string;
    track_type: string | null;
    work_mode: string | null;
    location_restriction: string | null;
    employer_profiles: { company_name: string } | null;
    specializations: { name: string } | null;
  }[] = [];

  if (hasCompletedAnyPathway) {
    const { data } = await supabase
      .from("jobs")
      .select("id, title, track_type, work_mode, location_restriction, employer_profiles(company_name), specializations(name)")
      .eq("status", "live")
      .order("posted_at", { ascending: false });
    jobs = (data as unknown as typeof jobs) || [];
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Opportunity Intelligence
        </span>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-carinex-navy">
          Opportunities
        </h1>

        {hasCompletedAnyPathway ? (
          jobs.length > 0 ? (
            <div className="mt-8 flex flex-col gap-3">
              {jobs.map((job) => {
                const employer = job.employer_profiles;
                const spec = job.specializations;
                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/opportunities/${job.id}`}
                    className="flex items-center justify-between rounded-xl border border-carinex-navy/10 bg-white p-5 transition hover:border-carinex-emerald/40 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-carinex-navy">{job.title}</p>
                      <p className="mt-0.5 text-sm text-carinex-navy/50">
                        {employer?.company_name || "Employer"}
                        {spec?.name ? ` · ${spec.name}` : ""}
                      </p>
                    </div>
                    <div className="ml-4 flex shrink-0 flex-col items-end gap-1.5">
                      {job.track_type && (
                        <span className="rounded-full bg-carinex-navy/5 px-2.5 py-1 text-xs font-semibold text-carinex-navy/70">
                          {job.track_type === "national" ? "National" : "Global"}
                        </span>
                      )}
                      {job.work_mode && (
                        <span className="text-xs text-carinex-navy/40">{job.work_mode}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-carinex-navy/20 p-10 text-center">
              <p className="text-lg font-semibold text-carinex-navy">
                No remote listings live yet — check back soon.
              </p>
              <p className="mt-2 text-sm text-carinex-navy/50">
                You&apos;ve completed a pathway, so you&apos;ll see matched opportunities
                here the moment listings go live.
              </p>
            </div>
          )
        ) : (
          <div className="mt-10 h-64 rounded-2xl border border-dashed border-carinex-navy/10 bg-carinex-navy/[0.02]" />
        )}
      </section>
      <Footer />

      {!hasCompletedAnyPathway && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <div className="max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl">
            <span className="text-3xl">🔒</span>
            <h2 className="mt-3 text-lg font-bold text-carinex-navy">
              Not quite there yet
            </h2>
            <p className="mt-2 text-sm text-carinex-navy/60">
              {!assessmentDone
                ? "Take an assessment, then complete a specialization pathway to access this page."
                : "Complete a specialization pathway to access this page."}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {!assessmentDone && (
                <a
                  href="/assessment"
                  className="rounded-full bg-carinex-emerald px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-carinex-emerald/90"
                >
                  Take the assessment
                </a>
              )}
              <a
                href="/dashboard"
                className="rounded-full border border-carinex-navy/20 px-5 py-2.5 text-sm font-semibold text-carinex-navy transition hover:bg-carinex-navy/5"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
