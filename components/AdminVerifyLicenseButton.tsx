"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminVerifyLicenseButton({
  nurseProfileId,
  verified,
}: {
  nurseProfileId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("nurse_profiles")
      .update({
        license_verified: !verified,
        license_verified_at: !verified ? new Date().toISOString() : null,
      })
      .eq("id", nurseProfileId);
    setSaving(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60 ${
        verified
          ? "border border-carinex-navy/20 text-carinex-navy hover:bg-carinex-navy/5"
          : "bg-carinex-emerald text-carinex-white hover:bg-carinex-emerald/90"
      }`}
    >
      {saving ? "Saving…" : verified ? "Revoke verification" : "Verify license"}
    </button>
  );
}
