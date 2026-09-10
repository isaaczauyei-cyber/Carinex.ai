import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getSpecializationProgress } from "@/lib/specialization-status";
import { recordActivityAndGetStreak } from "@/lib/streak";
import ProfileSummary from "@/components/ProfileSummary";
import DashboardHero from "@/components/DashboardHero";

const statusStyles = {
  not_started: { label: "Not Started", badgeClass: "bg-white/10 text-white/70" },
  in_progress: { label: "In Progress", badgeClass: "bg-amber-400/20 text-amber-200" },
  unlocked: { label: "Completed", badgeClass: "bg-carinex-emerald/25 text-emerald-200" },
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

  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const progress = await getSpecializationProgress(profile.id);
  const streak = await recordActivityAndGetStreak(profile.id);

  const { data: completions } = await supabase
    .from("nurse_course_completions")
    .select("status, courses(title)")
    .eq("nurse_id", profile.id);

  const completedTitles = new Set(
    (completions || [])
      .filter((c) => c.status === "completed")
      .map((c) => (c.courses as unknown as { title: string })?.title)
      .filter(Boolean)
  );
  const coursesCompleted = completedTitles.size;

  const specializationsEnrolled = progress.length;
  const roadmapsCompleted = progress.filter((p) => p.status === "unlocked").length;

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
          specializationsEnrolled={specializationsEnrolled}
          roadmapsCompleted={roadmapsCompleted}
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

        <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-carinex-emerald to-carinex-navy p-8 text-white">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Career Fit Assessment
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Find out exactly where your clinical experience fits, globally.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
            Most nurses guess which remote pathway suits them and waste months on the
            wrong courses. This assessment reads your real clinical background —
            ICU, public health, call-centre, whatever it is — and tells you precisely
            which specializations you&apos;re already strong in, and what stands between
            you and the rest.
          </p>
          <a
            href="/assessment"
            className="mt-5 inline-block rounded-full bg-white px-6 py-3 text-sm font-bold text-carinex-navy transition hover:bg-white/90"
          >
            Take the assessment →
          </a>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold text-carinex-navy">Your specializations</h2>

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
                const hasProgress = p.completedCourses > 0;

                return (
                  <div key={p.specializationId} className="rounded-2xl bg-carinex-navy p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-white">{p.name}</h3>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.badgeClass}`}>
                          {style.label}
                        </span>
                        <a
                          href={`/dashboard/roadmap/${p.slug}`}
                          className="text-xs font-semibold text-white/70 transition hover:text-white hover:underline"
                        >
                          View roadmap
                        </a>
                      </div>
                    </div>

                    {p.requiredCourses > 0 && (
                      <div className="mt-4">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                          <div
                            className="h-full rounded-full bg-carinex-emerald transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-white/60">
                          {p.completedCourses} of {p.requiredCourses} required courses complete
                          {p.minYearsExperience && !p.meetsExperienceGate && (
                            <> · requires {p.minYearsExperience}+ years experience</>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="mt-5">
                      <a
                        href={`/pathways/${p.slug}`}
                        className="inline-block rounded-full bg-carinex-emerald px-4 py-2 text-sm font-semibold text-white transition hover:bg-carinex-emerald/90"
                      >
                        {hasProgress ? "Continue course" : "Start course"}
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
