// components/LoginForm.tsx
// Same createClient() + supabase.auth pattern as SignUpForm.tsx, using
// signInWithPassword instead of signUp.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    const { data: profile } = await supabase
      .from("nurse_profiles")
      .select("onboarding_completed")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    router.push(profile?.onboarding_completed ? "/dashboard" : "/onboarding");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-carinex-navy">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-carinex-navy">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
      </label>

      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === "loading" ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
