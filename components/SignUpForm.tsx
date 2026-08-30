// components/SignUpForm.tsx
// Example of wiring a form to your existing Supabase Auth — this is the
// pattern to reuse for login, the assessment form, and profile updates.
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
           router.push("/onboarding");
           return;
    }
      setStatus("success");
    // Once signed up, create the matching `users` row (see MVP Technical Spec
    // Section 2) — either via a Supabase database trigger on auth.users insert,
    // or a follow-up call here once you build that endpoint.
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
          minLength={8}
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

      {status === "success" && (
        <p role="status" className="text-sm text-carinex-emerald">
          Check your email to confirm your account.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === "loading" ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
