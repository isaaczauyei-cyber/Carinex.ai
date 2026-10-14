"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TagInput, { TagOption } from "@/components/TagInput";
import ExperienceEditor from "@/components/ExperienceEditor";
import CertificationEditor from "@/components/CertificationEditor";

type ProfileEditFormProps = {
  userId: string;
  nurseId: string;
  initialFirstName: string;
  initialLastName: string;
  initialBio: string;
  initialTrackNational: boolean;
  initialTrackGlobal: boolean;
  skillOptions: TagOption[];
  serviceOptions: TagOption[];
  specializationOptions: TagOption[];
  initialSkillIds: number[];
  initialServiceIds: number[];
  initialSpecializationIds: number[];
};

export default function ProfileEditForm({
  userId,
  nurseId,
  initialFirstName,
  initialLastName,
  initialBio,
  initialTrackNational,
  initialTrackGlobal,
  skillOptions,
  serviceOptions,
  specializationOptions,
  initialSkillIds,
  initialServiceIds,
  initialSpecializationIds,
}: ProfileEditFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [bio, setBio] = useState(initialBio);
  const [trackNational, setTrackNational] = useState(initialTrackNational);
  const [trackGlobal, setTrackGlobal] = useState(initialTrackGlobal);
  const [skillIds, setSkillIds] = useState(initialSkillIds);
  const [serviceIds, setServiceIds] = useState(initialServiceIds);
  const [specializationIds, setSpecializationIds] = useState(initialSpecializationIds);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function createSkill(name: string): Promise<TagOption | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("skills").insert({ name }).select().single();
    if (error || !data) return null;
    return { id: data.id, name: data.name };
  }

  async function createService(name: string): Promise<TagOption | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("services").insert({ name }).select().single();
    if (error || !data) return null;
    return { id: data.id, name: data.name };
  }

  async function handleSave() {
    setStatus("saving");
    const supabase = createClient();

    const fullName = `${firstName} ${lastName}`.trim();

    const { error: userError } = await supabase
      .from("users")
      .update({ first_name: firstName, last_name: lastName, full_name: fullName })
      .eq("id", userId);

    if (userError) {
      console.error(userError);
      setStatus("idle");
      alert(`Save failed: ${userError.message}`);
      return;
    }

    const profileResponse = await fetch("/api/nurse-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, track_national: trackNational, track_global: trackGlobal }),
    });
    const profileResult = await profileResponse.json().catch(() => ({}));

    if (!profileResponse.ok) {
      setStatus("idle");
      alert(`Save failed: ${profileResult.error || "Could not save profile."}`);
      return;
    }

    await supabase.from("nurse_skills").delete().eq("nurse_id", nurseId);
    if (skillIds.length > 0) {
      await supabase.from("nurse_skills").insert(skillIds.map((skill_id) => ({ nurse_id: nurseId, skill_id })));
    }

    await supabase.from("nurse_services").delete().eq("nurse_id", nurseId);
    if (serviceIds.length > 0) {
      await supabase.from("nurse_services").insert(serviceIds.map((service_id) => ({ nurse_id: nurseId, service_id })));
    }

    await supabase.from("nurse_specializations").delete().eq("nurse_id", nurseId);
    if (specializationIds.length > 0) {
      await supabase
        .from("nurse_specializations")
        .insert(specializationIds.map((specialization_id) => ({ nurse_id: nurseId, specialization_id })));
    }

    setStatus("saved");
  }

  return (
    <div className="flex flex-col gap-6">
      <section id="personal-details" className="scroll-mt-6 rounded-xl border border-[#d5e1dd] bg-[#f8fbfa] p-5 sm:p-6">
        <div className="mb-5"><h3 className="text-lg font-bold text-carinex-navy">Personal details</h3><p className="mt-1 text-sm text-slate-500">How your name and professional introduction appear on Carinex.</p></div>
        <label className="text-sm font-semibold text-slate-700">Name</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="min-w-0 w-full rounded-lg border border-[#cbdad4] bg-[#f2f7f5] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-carinex-emerald focus:ring-4 focus:ring-carinex-emerald/10 sm:w-1/2"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="min-w-0 w-full rounded-lg border border-[#cbdad4] bg-[#f2f7f5] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-carinex-emerald focus:ring-4 focus:ring-carinex-emerald/10 sm:w-1/2"
          />
        </div>
      </section>

      <section id="career-preferences" className="scroll-mt-6 rounded-xl border border-[#d5e1dd] bg-[#f8fbfa] p-5 sm:p-6">
        <div className="mb-5"><h3 className="text-lg font-bold text-carinex-navy">Career preferences</h3><p className="mt-1 text-sm text-slate-500">Choose the career markets you want your learning and opportunities to support.</p></div>
        <label className="text-sm font-semibold text-slate-700">
          Which track(s) are you interested in?
        </label>
        <p className="mt-1 text-sm text-carinex-navy/60">
          This determines which course pathway and roles you&apos;re matched to
          for specializations available on both tracks.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex items-start gap-3 rounded-xl border border-[#d5e1dd] bg-[#eaf2ef] px-4 py-4 text-sm text-carinex-navy transition hover:border-carinex-emerald/50">
            <input type="checkbox" checked={trackNational} onChange={(e) => setTrackNational(e.target.checked)} />
            National — Nigeria-based roles
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-[#d5e1dd] bg-[#eaf2ef] px-4 py-4 text-sm text-carinex-navy transition hover:border-carinex-emerald/50">
            <input type="checkbox" checked={trackGlobal} onChange={(e) => setTrackGlobal(e.target.checked)} />
            Global — international roles
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[#d5e1dd] bg-[#f8fbfa] p-5 sm:p-6">
        <label className="text-sm font-semibold text-slate-700">Professional summary</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="A short summary of who you are and what you're looking for."
          className="mt-2 w-full rounded-lg border border-[#cbdad4] bg-[#f2f7f5] px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-carinex-emerald focus:ring-4 focus:ring-carinex-emerald/10"
        />
      </section>

      <section id="skills-interests" className="scroll-mt-6 rounded-xl border border-[#d5e1dd] bg-[#f8fbfa] p-5 sm:p-6">
        <div className="mb-5"><h3 className="text-lg font-bold text-carinex-navy">Skills & interests</h3><p className="mt-1 text-sm text-slate-500">Select the areas you are interested in and the skills or services you can offer.</p></div>
      <div className="space-y-6">
      <TagInput
        label="Interests (pathways you're drawn to)"
        options={specializationOptions}
        selected={specializationIds}
        onChange={setSpecializationIds}
        placeholder="Search specializations..."
      />

      <TagInput
        label="Skills"
        options={skillOptions}
        selected={skillIds}
        onChange={setSkillIds}
        onCreateOption={createSkill}
        placeholder="Search or add a skill..."
      />

      <TagInput
        label="Services you offer"
        options={serviceOptions}
        selected={serviceIds}
        onChange={setServiceIds}
        onCreateOption={createService}
        placeholder="Search or add a service..."
      />
      </div>
      </section>

      <section id="experience-credentials" className="scroll-mt-6 rounded-xl border border-[#d5e1dd] bg-[#f8fbfa] p-5 sm:p-6">
        <div className="mb-5"><h3 className="text-lg font-bold text-carinex-navy">Experience & credentials</h3><p className="mt-1 text-sm text-slate-500">Add relevant work experience and professional certifications.</p></div>
        <div className="space-y-7">
          <div><h4 className="font-semibold text-carinex-navy">Experience</h4><div className="mt-3"><ExperienceEditor nurseId={nurseId} /></div></div>
          <div className="border-t border-[#dce7e3] pt-6"><h4 className="font-semibold text-carinex-navy">Certifications</h4><div className="mt-3"><CertificationEditor nurseId={nurseId} /></div></div>
        </div>
      </section>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-4 rounded-xl border border-[#cbdad4] bg-[#f2f7f5]/95 p-4 shadow-lg backdrop-blur">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="min-h-11 rounded-full bg-carinex-emerald px-7 py-3 text-sm font-semibold text-white transition hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-carinex-emerald/20 disabled:cursor-wait disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save profile"}
        </button>
        {status === "saved" && <span className="text-sm text-carinex-emerald">Saved ✓</span>}
      </div>
    </div>
  );
}
