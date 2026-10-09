// components/SignUpForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim()) {
      setStatus("error");
      setMessage("Please enter your full name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (!agreed) {
      setStatus("error");
      setMessage("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setStatus("loading");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: "nurse",
        },
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      return;
    }

    setStatus("success");
    setMessage("Account created! Check your inbox to confirm your email, then log in.");
  }

  if (status === "success") {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-4 rounded-xl border border-carinex-white/20 bg-carinex-white/10 p-6 text-center"
    >
      <h2 className="text-xl font-bold text-carinex-white">
        Check your email
      </h2>

      <p className="text-sm leading-6 text-carinex-white">
        Your Carinex account has been created successfully.
        We&apos;ve sent a confirmation link to your email address.
        Please open your email and click the confirmation link
        before logging in.
      </p>

      <button
        type="button"
        onClick={() => router.push("/login")}
        className="mt-2 rounded-full bg-carinex-white px-5 py-2 text-sm font-semibold text-carinex-navy hover:bg-carinex-white/90"
      >
        Go to login
      </button>
    </div>
  );
  }
          Go to login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-col gap-3">
      <input
        type="text"
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        disabled={status === "loading"}
        className="h-12 rounded-lg border border-carinex-navy/20 px-4 text-base focus:border-carinex-emerald focus:outline-none"
      />
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
        className="h-12 rounded-lg border border-carinex-navy/20 px-4 text-base focus:border-carinex-emerald focus:outline-none"
      />
      <input
        type="password"
        placeholder="Password (min. 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={status === "loading"}
        className="h-12 rounded-lg border border-carinex-navy/20 px-4 text-base focus:border-carinex-emerald focus:outline-none"
      />

      <label className="flex items-start gap-2.5 py-1 text-sm text-carinex-navy/70">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          disabled={status === "loading"}
          className="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          I agree to Carinex&apos;s{" "}
          <a href="/terms" target="_blank" className="font-semibold text-carinex-emerald hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" className="font-semibold text-carinex-emerald hover:underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "loading" || !agreed}
        className="h-12 rounded-full bg-carinex-navy text-carinex-white font-semibold disabled:opacity-60"
      >
        {status === "loading" ? "Creating account…" : "Create account"}
      </button>
      {status === "error" && <p className="text-sm text-red-600">{message}</p>}
    </form>
  );
}
