"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords don't match.");
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-md px-6 py-24">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Account recovery
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Set a new password
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <input
            type="password"
            placeholder="New password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={status === "saving"}
            className="h-12 rounded-lg border border-carinex-navy/20 px-4 text-base focus:border-carinex-emerald focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={status === "saving"}
            className="h-12 rounded-lg border border-carinex-navy/20 px-4 text-base focus:border-carinex-emerald focus:outline-none"
          />
          {status === "error" && <p className="text-sm text-red-600">{message}</p>}
          <button
            type="submit"
            disabled={status === "saving"}
            className="h-12 rounded-full bg-carinex-emerald text-sm font-semibold text-carinex-white disabled:opacity-60"
          >
            {status === "saving" ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>
      <Footer />
    </main>
  );
}
