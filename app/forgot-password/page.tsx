"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-md px-6 py-24">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Account recovery
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Reset your password
        </h1>

        {status === "sent" ? (
          <p className="mt-6 text-carinex-navy/80">
            If an account exists for {email}, a reset link has been sent —
            check your inbox.
          </p>
        ) : (
          <>
            <p className="mt-2 text-carinex-navy/70">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === "sending"}
                className="h-12 rounded-lg border border-carinex-navy/20 px-4 text-base focus:border-carinex-emerald focus:outline-none"
              />
              {status === "error" && <p className="text-sm text-red-600">{message}</p>}
              <button
                type="submit"
                disabled={status === "sending"}
                className="h-12 rounded-full bg-carinex-emerald text-sm font-semibold text-carinex-white disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-carinex-navy/60">
          Remembered your password?{" "}
          <a href="/login" className="font-semibold text-carinex-emerald hover:underline">
            Log in
          </a>
        </p>
      </section>
      <Footer />
    </main>
  );
}
