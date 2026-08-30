import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
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

  let { data: profile } = await supabase
    .from("nurse_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    const { data: created } = await supabase
      .from("nurse_profiles")
      .insert({ user_id: user.id })
      .select()
      .single();
    profile = created;
  }

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  const fallbackFirst = userRow?.full_name?.split(" ")[0] || "";
  const fallbackLast = userRow?.full_name?.split(" ").slice(1).join(" ") || "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-carinex-white px-6 py-16">
      <div className="w-full max-w-lg">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          One last step
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Let&apos;s set up your profile
        </h1>
        <p className="mt-2 text-carinex-navy/70">
          A couple of quick questions so we can point you toward the right pathway.
        </p>

        <div className="mt-8">
          <OnboardingForm
            userId={user.id}
            nurseId={profile!.id}
            initialFirstName={userRow?.first_name || fallbackFirst}
            initialLastName={userRow?.last_name || fallbackLast}
          />
        </div>
      </div>
    </main>
  );
}
