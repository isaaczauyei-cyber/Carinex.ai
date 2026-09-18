import { redirect } from "next/navigation";
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
          <div className="mt-10 rounded-2xl border border-dashed border-carinex-navy/20 p-10 text-center">
            <p className="text-lg font-semibold text-carinex-navy">
              No remote listings live yet — check back soon.
            </p>
            <p className="mt-2 text-sm text-carinex-navy/50">
              You&apos;ve completed a pathway, so you&apos;ll see matched opportunities
              here the moment listings go live.
            </p>
          </div>
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
