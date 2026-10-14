"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    const response = await fetch("/api/admin/nurse-profile/verify", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nurseProfileId, verified: !verified }),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      alert(result.error || "Could not update license verification.");
      return;
    }
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
