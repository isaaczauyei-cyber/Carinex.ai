import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "@/components/ProfileEditForm";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("nurse_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!profile) {
    const { data: created } = await supabase
      .from("nurse_profiles")
      .insert({ user_id: user!.id })
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

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Your Profile
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Edit your profile
        </h1>
        <p className="mt-3 text-carinex-navy/70">
          This shapes your dashboard and, later, what opportunities you&apos;re matched to.
        </p>

        <div className="mt-10">
          <ProfileEditForm
            nurseId={profile!.id}
            initialBio={profile!.bio || ""}
            skillOptions={skills || []}
            serviceOptions={services || []}
            specializationOptions={specializations || []}
            initialSkillIds={(nurseSkills || []).map((s) => s.skill_id)}
            initialServiceIds={(nurseServices || []).map((s) => s.service_id)}
            initialSpecializationIds={(nurseSpecializations || []).map((s) => s.specialization_id)}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
