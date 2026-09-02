import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getUnifiedPortfolio } from "@/lib/portfolio";

export default async function PortfolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const { sharedChecklist, specializationReadiness, sharedCompleteCount, sharedTotalCount } =
    await getUnifiedPortfolio(profile.id);

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <a href="/dashboard" className="text-sm font-semibold text-carinex-emerald hover:underline">
          ← Dashboard
        </a>

        <span className="mt-4 block text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Application Readiness
        </span>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-carinex-navy">
          Your portfolio report
        </h1>
        <p className="mt-2 text-sm text-carinex-navy/50">
          Based on what remote healthcare employers commonly ask for — not
          specific to any one employer, since Carinex doesn&apos;t have
          verified employer requirements yet.
        </p>

        <div className="mt-8 rounded-xl border border-carinex-navy/10 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-carinex-navy">Core readiness</h2>
            <span className="text-sm font-semibold text-carinex-navy/50">
              {sharedCompleteCount} of {sharedTotalCount} complete
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {sharedChecklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border border-carinex-navy/10 p-3">
                <span className={`text-lg ${item.done ? "text-carinex-emerald" : "text-carinex-navy/20"}`}>
                  {item.done ? "✓" : "○"}
                </span>
                <span className={`text-sm ${item.done ? "text-carinex-navy" : "text-carinex-navy/50"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <a href="/dashboard/profile" className="mt-4 inline-block text-sm font-semibold text-carinex-emerald hover:underline">
            Update your profile →
          </a>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">By specialization</h2>
          <p className="mt-1 text-sm text-carinex-navy/50">
            Some employers in these areas value hands-on technology or documentation skills specifically.
          </p>
          {specializationReadiness.length === 0 ? (
            <p className="mt-3 text-sm text-carinex-navy/50">
              You haven&apos;t selected a specialization yet.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {specializationReadiness.map((s) => (
                <div key={s.slug} className="flex items-center justify-between rounded-lg border border-carinex-navy/10 p-3">
                  <span className="text-sm text-carinex-navy">{s.title}</span>
                  <span
                    className={`flex items-center gap-2 text-xs font-semibold ${
                      s.techSkillDemonstrated ? "text-carinex-emerald" : "text-carinex-navy/40"
                    }`}
                  >
                    <span>{s.techSkillDemonstrated ? "✓" : "○"}</span>
                    Relevant technology skill demonstrated
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
