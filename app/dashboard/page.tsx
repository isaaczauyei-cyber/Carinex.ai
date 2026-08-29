import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getSpecializationProgress } from "@/lib/specialization-status";
import ProfileSummary from "@/components/ProfileSummary";

const statusStyles = {
  not_started: { label: "Not Started", className: "bg-carinex-navy/5 text-carinex-navy/60" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700" },
  unlocked: { label: "Unlocked", className: "bg-carinex-emerald/10 text-carinex-emerald" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  const progress = profile ? await getSpecializationProgress(profile.id) : [];

  const [{ data: nurseSkills }, { data: nurseServices }, { data: nurseSpecs }] = profile
    ? await Promise.all([
        supabase.from("nurse_skills").select("skills(id, name)").eq("nurse_id", profile.id),
        supabase.from("nurse_services").select("services(id, name)").eq("nurse_id", profile.id),
        supabase.from("nurse_specializations").select("specializations(id, name)").eq("nurse_id", profile.id),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const skills = (nurseSkills || []).map((r) => r.skills as unknown as { id: number; name: string }).filter(Boolean);
  const services = (nurseServices || []).map((r) => r.services as unknown as { id: number; name: string }).filter(Boolean);
  const interests = (nurseSpecs || []).map((r) => r.specializations as unknown as { id: number; name: string }).filter(Boolean);

  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Dashboard
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Welcome back
        </h1>

        <div className="mt-6">
          <ProfileSummary
            bio={profile?.bio || null}
            trackNational={profile?.track_national || false}
            trackGlobal={profile?.track_global || false}
            skills={skills}
            services={services}
            interests={interests}
          />
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold text-carinex-navy">Your specializations</h2>

          {progress.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-carinex-navy/20 p-8 text-center">
              <p className="text-carinex-navy/70">
                You haven&apos;t selected a specialization yet.
              </p>
              <a
                href="/pathways"
                className="mt-3 inline-block text-sm font-semibold text-carinex-emerald hover:underline"
              >
                Explore pathways →
              </a>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {progress.map((p) => {
                const style = statusStyles[p.status];
                return (
                  <div key={p.specializationId} className="rounded-xl border border-carinex-navy/10 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-carinex-navy">{p.name}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}>
                        {style.label}
                      </span>
                    </div>
                    {p.requiredCourses > 0 && (
                      <p className="mt-2 text-sm text-carinex-navy/60">
                        {p.completedCourses} of {p.requiredCourses} required courses complete
                        {p.minYearsExperience && !p.meetsExperienceGate && (
                          <> · requires {p.minYearsExperience}+ years experience</>
                        )}
                      </p>
                    )}
                    <a
                      href={`/pathways/${p.slug}`}
                      className="mt-2 inline-block text-sm font-semibold text-carinex-emerald hover:underline"
                    >
                      View pathway →
                    </a>
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
