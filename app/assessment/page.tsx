import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import AssessmentForm from "@/components/AssessmentForm";

export default async function AssessmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id, license_status, career_goal")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  return (
    <main className="min-h-screen bg-gradient-to-b from-carinex-navy via-carinex-navy to-carinex-emerald/20">
      <Navbar />
      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg">
            🎯
          </span>
          <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
            Career Assessment
          </span>
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
          What fits your background?
        </h1>
        <p className="mt-3 max-w-lg text-white/70">
          A few questions — instant recommendations, based on what each
          pathway actually requires, not a guess.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
            ⏱️ Takes about 2 minutes
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
            🔒 Based on your real experience
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
            ✨ Instant results
          </span>
        </div>

        <div className="mt-10 rounded-2xl bg-white p-6 shadow-xl">
          <AssessmentForm
            nurseId={profile.id}
            initialLicenseStatus={profile.license_status || ""}
            initialCareerGoal={profile.career_goal || ""}
          />
        </div>
      </section>
    </main>
  );
}
