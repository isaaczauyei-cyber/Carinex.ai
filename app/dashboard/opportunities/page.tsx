import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OpportunityFilters from "@/components/OpportunityFilters";
import { createClient } from "@/lib/supabase/server";

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("nurse_profiles").select("id, career_goal").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");

  // Only completed courses unlock opportunities. Enrollment or purchase alone never does.
  const { data: completions } = await supabase
    .from("nurse_course_completions")
    .select("course_id, status, courses(specialization_id, is_in_house)")
    .eq("nurse_id", profile.id)
    .eq("status", "completed");

  const eligibleSpecIds = Array.from(new Set(
    (completions || [])
      .map((row) => (row.courses as unknown as { specialization_id: number | null; is_in_house: boolean | null } | null)?.specialization_id)
      .filter((id): id is number => typeof id === "number")
  ));

  const { data: jobsData } = eligibleSpecIds.length
    ? await supabase.from("jobs").select("id, title, track_type, work_mode, location_restriction, pay_display, employer_profiles(company_name), specializations(id, name)").eq("status", "live").in("specialization_id", eligibleSpecIds).order("posted_at", { ascending: false })
    : { data: [] };

  const jobs = (jobsData || []) as unknown as Parameters<typeof OpportunityFilters>[0]["jobs"];
  const hasCompletedPathway = eligibleSpecIds.length > 0;

  return <main><Navbar /><section className="mx-auto max-w-4xl px-6 py-16"><span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Opportunity Intelligence</span><h1 className="mt-1 text-3xl font-bold tracking-tight text-carinex-navy">Opportunities</h1>
    {hasCompletedPathway ? <OpportunityFilters jobs={jobs} /> : <div className="mt-10 rounded-2xl border border-dashed border-carinex-navy/20 p-10 text-center"><span className="text-3xl">🔒</span><p className="mt-3 text-lg font-semibold text-carinex-navy">Complete a specialization course first</p><p className="mt-2 text-sm text-carinex-navy/60">Jobs appear here only after a required course for a specialization is completed. Buying or enrolling in a course alone does not unlock jobs.</p><a href="/dashboard/learning" className="mt-5 inline-block rounded-full bg-carinex-emerald px-5 py-2.5 text-sm font-semibold text-white">Go to Learning Hub</a></div>}
  </section><Footer /></main>;
}
