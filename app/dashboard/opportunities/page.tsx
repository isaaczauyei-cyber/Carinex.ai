import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getSpecializationProgress } from "@/lib/specialization-status";
import JobCard from "@/components/JobCard";

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id, career_goal, license_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const progress = await getSpecializationProgress(profile.id);
  const unlocked = progress.filter((p) => p.status === "unlocked");
  const hasCompletedAnyPathway = unlocked.length > 0;
  const assessmentDone = !!profile.career_goal;
  const licenseActive = profile.license_status === "active";

  const unlockedIds = unlocked.map((p) => p.specializationId);

  const { data: remoteJobs } = unlockedIds.length
    ? await supabase
        .from("jobs")
        .select("*, employer_profiles(company_name)")
        .in("specialization_id", unlockedIds)
        .in("work_mode", ["sync", "async"])
        .eq("status", "live")
    : { data: [] };

  const { data: generalJobs } = licenseActive
    ? await supabase
        .from("jobs")
        .select("*, employer_profiles(company_name)")
        .is("specialization_id", null)
        .eq("work_mode", "onsite")
        .eq("status", "live")
    : { data: [] };

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
          <>
            <div className="mt-10">
              <h2 className="text-xl font-bold text-carinex-navy">
                Matched to your completed pathways
              </h2>
              {unlocked.map((spec) => {
                const jobs = (remoteJobs || []).filter((j) => j.specialization_id === spec.specializationId);
                return (
                  <div key={spec.specializationId} className="mt-5">
                    <h3 className="font-semibold text-carinex-navy">{spec.name}</h3>
                    {jobs.length === 0 ? (
                      <p className="mt-2 text-sm text-carinex-navy/50">
                        No live listings yet — check back soon.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-col gap-3">
                        {jobs.map((job) => (
                          <JobCard key={job.id} job={job as never} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-14">
              <h2 className="text-xl font-bold text-carinex-navy">General hospital &amp; clinical jobs</h2>
              <p className="mt-1 text-sm text-carinex-navy/60">
                Open to any nurse with an active NMCN license — not tied to course completion.
              </p>

              {!licenseActive ? (
                <p className="mt-4 text-sm text-carinex-navy/50">
                  Requires an active NMCN license on your profile.
                </p>
              ) : !generalJobs || generalJobs.length === 0 ? (
                <p className="mt-4 text-sm text-carinex-navy/50">
                  No general listings live yet — check back soon.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  {generalJobs.map((job) => (
                    <JobCard key={job.id} job={job as never} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-10 h-64 rounded-2xl border border-dashed border-carinex-navy/10 bg-carinex-navy/[0.02]" />
        )}
      </section>
      <Footer />

      {!hasCompletedAnyPathway && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <div className="max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl">
            <span className="text-3xl">🔒</span>
            <h2 className="mt-3 text-lg font-bold text-carinex-navy">Not quite there yet</h2>
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
