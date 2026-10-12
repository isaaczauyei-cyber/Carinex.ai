import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "@/components/ProfileEditForm";
import LogoutButton from "@/components/LogoutButton";

export default async function ProfileEditPage() {
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

  const fallbackFirst = userRow?.full_name?.split(" ")[0] || "";
  const fallbackLast = userRow?.full_name?.split(" ").slice(1).join(" ") || "";

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

  const [{ data: skills }, { data: services }, { data: specializations }] = await Promise.all([
    supabase.from("skills").select("id, name").order("name"),
    supabase.from("services").select("id, name").order("name"),
    supabase.from("specializations").select("id, name").order("name"),
  ]);

  const [{ data: nurseSkills }, { data: nurseServices }, { data: nurseSpecializations }] = await Promise.all([
    supabase.from("nurse_skills").select("skill_id").eq("nurse_id", profile!.id),
    supabase.from("nurse_services").select("service_id").eq("nurse_id", profile!.id),
    supabase.from("nurse_specializations").select("specialization_id").eq("nurse_id", profile!.id),
  ]);

  const displayName = userRow?.first_name || fallbackFirst || "Nurse";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-[#e8efed]">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-carinex-emerald">Account settings</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy sm:text-4xl">Profile & preferences</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Manage your professional profile, career interests, skills and credentials in one place.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-[#d5e1dd] bg-[#f8fbfa] p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-carinex-navy text-xl font-bold text-white ring-4 ring-carinex-emerald/10">
                  {initial}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-carinex-navy">
                    {userRow?.first_name ? `${userRow.first_name} ${userRow.last_name || ""}`.trim() : "Your professional profile"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Carinex learner</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-[#eaf2ef] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile tip</p>
                <p className="mt-2 text-sm leading-5 text-slate-700">Keep your skills, interests and credentials up to date to help Carinex tailor your learning and opportunities.</p>
              </div>
            </div>

            <nav aria-label="Profile settings sections" className="rounded-2xl border border-[#d5e1dd] bg-[#f3f8f6] p-3 shadow-sm">
              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Your settings</p>
              <a href="#personal-details" className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-carinex-navy transition hover:bg-[#e4eeea]"><span className="text-carinex-emerald">01</span> Personal details</a>
              <a href="#career-preferences" className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-carinex-navy transition hover:bg-[#e4eeea]"><span className="text-carinex-emerald">02</span> Career preferences</a>
              <a href="#skills-interests" className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-carinex-navy transition hover:bg-[#e4eeea]"><span className="text-carinex-emerald">03</span> Skills & interests</a>
              <a href="#experience-credentials" className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-carinex-navy transition hover:bg-[#e4eeea]"><span className="text-carinex-emerald">04</span> Experience & credentials</a>
            </nav>
          </aside>

          <div className="min-w-0 space-y-6">
            <div className="rounded-2xl border border-[#d5e1dd] bg-[#f8fbfa] p-5 shadow-sm sm:p-8">
              <div className="mb-7 flex flex-wrap items-start justify-between gap-3 border-b border-[#dce7e3] pb-6">
                <div>
                  <h2 className="text-xl font-bold text-carinex-navy">Your professional profile</h2>
                  <p className="mt-1 text-sm text-slate-500">Information you share here helps personalize your Carinex experience.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Private to your account</span>
              </div>
              <ProfileEditForm
                userId={user.id}
                nurseId={profile!.id}
                initialFirstName={userRow?.first_name || fallbackFirst}
                initialLastName={userRow?.last_name || fallbackLast}
                initialBio={profile!.bio || ""}
                initialTrackNational={profile!.track_national || false}
                initialTrackGlobal={profile!.track_global || false}
                skillOptions={skills || []}
                serviceOptions={services || []}
                specializationOptions={specializations || []}
                initialSkillIds={(nurseSkills || []).map((s) => s.skill_id)}
                initialServiceIds={(nurseServices || []).map((s) => s.service_id)}
                initialSpecializationIds={(nurseSpecializations || []).map((s) => s.specialization_id)}
              />
            </div>
            <div className="rounded-2xl border border-[#d5e1dd] bg-[#f8fbfa] p-5 shadow-sm sm:p-6">
              <h2 className="font-bold text-carinex-navy">Account access</h2>
              <p className="mt-1 text-sm text-slate-500">Finished updating your profile? You can securely sign out of this device.</p>
              <div className="mt-4"><LogoutButton /></div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
