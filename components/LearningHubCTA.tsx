"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function LearningHubCTA() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  return (
    <Link
      href={user ? "/dashboard/learning" : "/signup"}
      className="inline-block rounded-full bg-carinex-emerald px-8 py-4 text-base font-semibold text-carinex-white shadow-lg shadow-carinex-emerald/20 transition hover:bg-carinex-emerald/90"
    >
      {user ? "Explore Pathway →" : "Get Started"}
    </Link>
  );
}
