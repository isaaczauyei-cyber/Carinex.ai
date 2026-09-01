import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    <main>
      <Navbar />
      <section className="mx-auto max-w-2xl px-6 py-16">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Career Assessment
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          What fits your background?
        </h1>
        <p className="mt-2 text-carinex-navy/70">
          A few questions — instant recommendations, based on what each
          pathway actually requires, not a guess.
        </p>

        <div className="mt-8">
          <AssessmentForm
            nurseId={profile.id}
            initialLicenseStatus={profile.license_status || ""}
            initialCareerGoal={profile.career_goal || ""}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
