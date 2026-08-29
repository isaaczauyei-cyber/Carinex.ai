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

    const { error: profileError } = await supabase
      .from("nurse_profiles")
      .update({ bio, track_national: trackNational, track_global: trackGlobal })
      .eq("id", nurseId);

    if (profileError) {
      console.error(profileError);
      setStatus("idle");
      alert(`Save failed: ${profileError.message}`);
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
    <div className="flex flex-col gap-10">
      <div>
        <label className="text-sm font-medium text-carinex-navy">Name</label>
        <div className="mt-2 flex gap-3">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="w-1/2 rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="w-1/2 rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">
          Which track(s) are you interested in?
        </label>
        <p className="mt-1 text-sm text-carinex-navy/60">
          This determines which course pathway and roles you&apos;re matched to
          for specializations available on both tracks.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex items-center gap-2 rounded-lg border border-carinex-navy/20 px-4 py-3 text-sm text-carinex-navy">
            <input type="checkbox" checked={trackNational} onChange={(e) => setTrackNational(e.target.checked)} />
            National — Nigeria-based roles
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-carinex-navy/20 px-4 py-3 text-sm text-carinex-navy">
            <input type="checkbox" checked={trackGlobal} onChange={(e) => setTrackGlobal(e.target.checked)} />
            Global — international roles
          </label>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-carinex-navy">About</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="A short summary of who you are and what you're looking for."
          className="mt-2 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
      </div>

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

      <div>
        <h2 className="text-lg font-bold text-carinex-navy">Experience</h2>
        <div className="mt-4">
          <ExperienceEditor nurseId={nurseId} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-carinex-navy">Certifications</h2>
        <div className="mt-4">
          <CertificationEditor nurseId={nurseId} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-carinex-white disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save profile"}
        </button>
        {status === "saved" && <span className="text-sm text-carinex-emerald">Saved ✓</span>}
      </div>
    </div>
  );
}
