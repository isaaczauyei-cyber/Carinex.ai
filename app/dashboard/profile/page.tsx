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
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-carinex-navy via-carinex-navy to-carinex-emerald p-8 text-carinex-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-carinex-white/15 text-2xl font-bold">
              {initial}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-carinex-white/60">
                Your Profile
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                {userRow?.first_name ? `${userRow.first_name} ${userRow.last_name || ""}`.trim() : "Complete your profile"}
              </h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-carinex-white/80">
            This shapes your dashboard and, later, what opportunities you&apos;re matched to.
          </p>
        </div>

        <div className="mt-10">
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

        <div className="mt-16 border-t border-carinex-navy/10 pt-8">
          <LogoutButton />
        </div>
      </section>
      <Footer />
    </main>
  );
}
