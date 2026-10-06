"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAccountActions({ userId, terminated }: { userId: string; terminated: boolean }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  async function act(action: "terminate" | "restore" | "delete") {
    const message = action === "delete" ? "Permanently delete this account? This cannot be undone." : action === "terminate" ? "Terminate this account? The user will be unable to sign in until restored." : "Restore this account?";
    if (!window.confirm(message)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/account`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Account action failed.");
      if (action === "delete") router.push("/admin/users"); else router.refresh();
    } catch (e) { alert(e instanceof Error ? e.message : "Account action failed."); } finally { setSaving(false); }
  }
  return <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5"><p className="text-sm font-bold text-red-900">Account controls</p><p className="mt-1 text-xs text-red-900/70">{terminated ? "This account is currently terminated." : "Terminate access temporarily, restore it later, or permanently delete the account."}</p><div className="mt-4 flex flex-wrap gap-2">{terminated ? <button disabled={saving} onClick={()=>void act("restore")} className="rounded-full bg-carinex-emerald px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Restore account</button> : <button disabled={saving} onClick={()=>void act("terminate")} className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Terminate account</button>}<button disabled={saving} onClick={()=>void act("delete")} className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Permanently delete</button></div></div>;
}
