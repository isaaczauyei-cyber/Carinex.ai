import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function OpportunitiesPage() {
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

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <a href="/dashboard" className="text-sm font-semibold text-carinex-emerald hover:underline">
          ← Dashboard
        </a>

        <span className="mt-4 block text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Opportunity Intelligence
        </span>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-carinex-navy">
          Opportunities
        </h1>

        <div className="mt-10 rounded-2xl border border-dashed border-carinex-navy/20 p-10 text-center">
          <p className="text-lg font-semibold text-carinex-navy">
            No remote listings live yet — check back soon.
          </p>
          <p className="mt-2 text-sm text-carinex-navy/50">
            While you wait, keep building your readiness — complete your
            roadmap and courses so you&apos;re ready the moment listings go live.
          </p>
          <a
            href="/dashboard"
            className="mt-5 inline-block rounded-full bg-carinex-emerald px-5 py-2.5 text-sm font-semibold text-carinex-white transition hover:bg-carinex-emerald/90"
          >
            Back to Dashboard
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}
