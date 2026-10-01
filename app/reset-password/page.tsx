"use client";

import { useEffect, useState } from "react";
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
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true);
    });

    const timeout = setTimeout(() => {
      setSessionReady((ready) => (ready === null ? false : ready));
    }, 2500);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

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

  if (sessionReady === false) {
    return (
      <main>
        <Navbar />
        <section className="mx-auto max-w-md px-6 py-24 text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
            Account recovery
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-carinex-navy">
            This link is invalid or has expired
          </h1>
          <p className="mt-3 text-carinex-navy/70">
            Password reset links only work once and expire after a short time.
          </p>
          <a
            href="/forgot-password"
            className="mt-6 inline-block rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-white hover:bg-carinex-emerald/90"
          >
            Request a new link
          </a>
        </section>
        <Footer />
      </main>
    );
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
