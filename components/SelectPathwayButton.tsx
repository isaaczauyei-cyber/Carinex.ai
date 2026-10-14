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

    const profileResponse = await fetch("/api/nurse-profile", { method: "POST" });
    const profileResult = await profileResponse.json().catch(() => ({}));
    const profile = profileResult.profile as { id: string } | undefined;
    if (!profileResponse.ok || !profile) {
      setLoading(false);
      alert(profileResult.error || "Could not set up your nurse profile. Please try again.");
      return;
    }

    const { data: spec } = await supabase
      .from("specializations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!spec) {
      setLoading(false);
      alert("This specialization isn't set up yet on our end — we've been notified.");
      return;
    }

    if (profile) {
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
