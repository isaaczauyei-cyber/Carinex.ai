// components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-carinex-navy/20 px-6 py-2.5 text-sm font-semibold text-carinex-navy transition hover:bg-carinex-navy/5"
    >
      Log out
    </button>
  );
}
