import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getSpecializationProgress } from "@/lib/specialization-status";
import { recordActivityAndGetStreak } from "@/lib/streak";
import ProfileSummary from "@/components/ProfileSummary";
import DashboardHero from "@/components/DashboardHero";

const statusStyles = {
  not_started: { label: "Not Started", className: "bg-carinex-navy/5 text-carinex-navy/60", border: "border-carinex-navy/10" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700", border: "border-amber-200" },
  unlocked: { label: "Completed", className: "bg-carinex-emerald/10 text-carinex-emerald", border: "border-carinex-emerald/30" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("first_name, last_name, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = userRow?.first_name || userRow?.full_name?.split(" ")[0] || "there";

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Safety check: if onboarding was never finished, send them there instead
  // of showing a dashboard with missing info.
  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const progress = await getSpecializationProgress(profile.id);
  const streak = await recordActivityAndGetStreak(profile.id);

  const { data: completions } = await supabase
    .from("nurse_course_completions")
    .select("status")
    .eq("nurse_id", profile.id);

  const coursesCompleted = (completions || []).filter((c) => c.status === "completed").length;
  const coursesInProgress = (completions || []).filter((c) => c.status === "in_progress").length;
  const specializationsUnlocked = progress.filter((p) => p.status === "unlocked").length;

  const [{ data: nurseSkills }, { data: nurseServices }, { data: nurseSpecs }] = await Promise.all([
    supabase.from("nurse_skills").select("skills(id, name)").eq("nurse_id", profile.id),
    supabase.from("nurse_services").select("services(id, name)").eq("nurse_id", profile.id),
    supabase.from("nurse_specializations").select("specializations(id, name)").eq("nurse_id", profile.id),
  ]);

  const skills = (nurseSkills || []).map((r) => r.skills as unknown as { id: number; name: string }).filter(Boolean);
  const services = (nurseServices || []).map((r) => r.services as unknown as { id: number; name: string }).filter(Boolean);
  const interests = (nurseSpecs || []).map((r) => r.specializations as unknown as { id: number; name: string }).filter(Boolean);

  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-12">
        <DashboardHero
          firstName={firstName}
          streak={streak}
          coursesCompleted={coursesCompleted}
          coursesInProgress={coursesInProgress}
          specializationsUnlocked={specializationsUnlocked}
        />

        <div className="mt-6">
          <ProfileSummary
            firstName={firstName}
            lastName={userRow?.last_name || ""}
            bio={profile.bio || null}
            trackNational={profile.track_national || false}
            trackGlobal={profile.track_global || false}
            skills={skills}
            services={services}
            interests={interests}
          />
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-carinex-navy">Your specializations</h2>
            <a href="/assessment" className="text-sm font-semibold text-carinex-emerald hover:underline">
              Take assessment
            </a>
          </div>

          {progress.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-carinex-navy/20 p-8 text-center">
              <p className="text-carinex-navy/70">You haven&apos;t selected a specialization yet.</p>
              <a href="/pathways" className="mt-3 inline-block text-sm font-semibold text-carinex-emerald hover:underline">
                Explore pathways
              </a>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {progress.map((p) => {
                const style = statusStyles[p.status];
                const progressPct =
                  p.requiredCourses > 0
                    ? Math.min(100, Math.round((p.completedCourses / p.requiredCourses) * 100))
                    : 0;

                return (
                  <div key={p.specializationId} className={`rounded-2xl border ${style.border} bg-white p-6`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-carinex-navy">{p.name}</h3>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}>
                        {style.label}
                      </span>
                    </div>

                    {p.requiredCourses > 0 && (
                      <div className="mt-4">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-carinex-navy/10">
                          <div
                            className="h-full rounded-full bg-carinex-emerald transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-carinex-navy/60">
                          {p.completedCourses} of {p.requiredCourses} required courses complete
                          {p.minYearsExperience && !p.meetsExperienceGate && (
                            <> · requires {p.minYearsExperience}+ years experience</>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex items-center gap-5">
                      <a
                        href={`/pathways/${p.slug}`}
                        className="rounded-full bg-carinex-emerald px-4 py-2 text-sm font-semibold text-carinex-white transition hover:bg-carinex-emerald/90"
                      >
                        View pathway
                      </a>
                      <a href={`/dashboard/roadmap/${p.slug}`} className="text-sm font-semibold text-carinex-navy hover:underline">
                        View roadmap
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
