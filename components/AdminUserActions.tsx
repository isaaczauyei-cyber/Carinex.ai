"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminUserActions({ userId, terminated = false, compact = false }: { userId: string; terminated?: boolean; compact?: boolean }) {
  const router = useRouter(); const [loading, setLoading] = useState("");
  async function action(kind: "terminate" | "restore" | "delete") {
    const message = kind === "delete" ? "Permanently delete this user's Carinex account? This cannot be undone." : kind === "terminate" ? "Terminate this user's account? They will no longer be able to access Carinex." : "Restore this user's access?";
    if (!window.confirm(message)) return;
    setLoading(kind);
    try {
      const response = await fetch("/api/admin/users/account-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: kind }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Account action failed.");
      if (kind === "delete") { router.push("/admin/users"); } else router.refresh();
    } catch (error) { alert(error instanceof Error ? error.message : "Account action failed."); }
    finally { setLoading(""); }
  }
  return <div className={`flex flex-wrap gap-2 ${compact ? "justify-end" : ""}`}>
    {terminated ? <button type="button" onClick={() => void action("restore")} disabled={!!loading} className="rounded-full border border-carinex-emerald/30 px-3 py-1.5 text-xs font-semibold text-carinex-emerald disabled:opacity-50">{loading === "restore" ? "Restoring…" : "Restore"}</button> : <button type="button" onClick={() => void action("terminate")} disabled={!!loading} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-50">{loading === "terminate" ? "Terminating…" : "Terminate"}</button>}
    <button type="button" onClick={() => void action("delete")} disabled={!!loading} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">{loading === "delete" ? "Deleting…" : "Delete permanently"}</button>
  </div>;
}
