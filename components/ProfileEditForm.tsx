"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TagInput, { TagOption } from "@/components/TagInput";
import ExperienceEditor from "@/components/ExperienceEditor";
import CertificationEditor from "@/components/CertificationEditor";

type ProfileEditFormProps = {
  nurseId: string;
  initialBio: string;
  skillOptions: TagOption[];
  serviceOptions: TagOption[];
  specializationOptions: TagOption[];
  initialSkillIds: number[];
  initialServiceIds: number[];
  initialSpecializationIds: number[];
};

export default function ProfileEditForm({
  nurseId,
  initialBio,
  skillOptions,
  serviceOptions,
  specializationOptions,
  initialSkillIds,
  initialServiceIds,
  initialSpecializationIds,
}: ProfileEditFormProps) {
  const [bio, setBio] = useState(initialBio);
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

    await supabase.from("nurse_profiles").update({ bio }).eq("id", nurseId);

    await supabase.from("nurse_skills").delete().eq("nurse_id", nurseId);
    if (skillIds.length > 0) {
      await supabase
        .from("nurse_skills")
        .insert(skillIds.map((skill_id) => ({ nurse_id: nurseId, skill_id })));
    }

    await supabase.from("nurse_services").delete().eq("nurse_id", nurseId);
    if (serviceIds.length > 0) {
      await supabase
        .from("nurse_services")
        .insert(serviceIds.map((service_id) => ({ nurse_id: nurseId, service_id })));
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
