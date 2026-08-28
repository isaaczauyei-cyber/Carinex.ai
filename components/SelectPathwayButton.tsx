"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SelectPathwayButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/signup");
      return;
    }

    let { data: profile } = await supabase
      .from("nurse_profiles")
      .select("id")
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

    const { data: spec } = await supabase
      .from("specializations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (profile && spec) {
      await supabase
        .from("nurse_specializations")
        .upsert(
          { nurse_id: profile.id, specialization_id: spec.id },
          { onConflict: "nurse_id,specialization_id" }
        );
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-10 inline-block rounded-full bg-carinex-emerald px-8 py-4 text-base font-semibold text-carinex-white transition hover:bg-carinex-emerald/90 disabled:opacity-60"
    >
      {loading ? "Setting up…" : "Get Started"}
    </button>
  );
}
