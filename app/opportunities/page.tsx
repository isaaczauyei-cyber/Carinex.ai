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
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const progress = await getSpecializationProgress(profile.id);
  const unlocked = progress.filter((p) => p.status === "unlocked");
  const locked = progress.filter((p) => p.status !== "unlocked");

  const unlockedIds = unlocked.map((p) => p.specializationId);

  const { data: remoteJobs } = unlockedIds.length
    ? await supabase
        .from("jobs")
        .select("*, employer_profiles(company_name)")
        .in("specialization_id", unlockedIds)
        .in("work_mode", ["sync", "async"])
        .eq("status", "live")
    : { data: [] };

  const licenseActive = profile.license_status === "active";

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

      <section className="mx-auto max-w-4xl px-6 py-12">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Opportunity Intelligence
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Roles matched to what you&apos;re actually eligible for
        </h1>
        <p className="mt-2 text-carinex-navy/70">
          Remote roles unlock once you&apos;ve completed a specialization&apos;s
          required courses. General hospital and clinical roles are open to
          any nurse with an active license.
        </p>

        {/* Remote, gated section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-carinex-navy">Remote opportunities for your specializations</h2>

          {unlocked.length === 0 && locked.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-carinex-navy/20 p-8 text-center">
              <p className="text-carinex-navy/70">You haven&apos;t selected a specialization yet.</p>
              <a href="/pathways" className="mt-3 inline-block text-sm font-semibold text-carinex-emerald hover:underline">
                Explore pathways →
              </a>
            </div>
          )}

          {unlocked.map((spec) => {
            const jobs = (remoteJobs || []).filter((j) => j.specialization_id === spec.specializationId);
            return (
              <div key={spec.specializationId} className="mt-6">
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

          {locked.map((spec) => (
            <div key={spec.specializationId} className="mt-6 rounded-xl border border-dashed border-carinex-navy/20 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-carinex-navy/70">{spec.name}</h3>
                <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/50">
                  Locked
                </span>
              </div>
              {spec.requiredCourses > 0 && (
                <p className="mt-2 text-sm text-carinex-navy/50">
                  {spec.completedCourses} of {spec.requiredCourses} required courses complete
                  {spec.minYearsExperience && !spec.meetsExperienceGate && (
                    <> · requires {spec.minYearsExperience}+ years experience</>
                  )}
                  {" — "}
                  <a href={`/pathways/${spec.slug}`} className="font-semibold text-carinex-emerald hover:underline">
                    continue this pathway
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>

        {/* General, ungated section */}
        <div className="mt-14">
          <h2 className="text-xl font-bold text-carinex-navy">General hospital &amp; clinical jobs</h2>
          <p className="mt-1 text-sm text-carinex-navy/60">
            Open to any nurse with an active NMCN license — not tied to course completion.
          </p>

          {!licenseActive ? (
            <div className="mt-4 rounded-2xl border border-dashed border-carinex-navy/20 p-8 text-center">
              <p className="text-carinex-navy/70">
                These listings require an active NMCN license on your profile.
              </p>
              <a href="/onboarding" className="mt-3 inline-block text-sm font-semibold text-carinex-emerald hover:underline">
                Update license status →
              </a>
            </div>
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
      </section>

      <Footer />
    </main>
  );
              }
