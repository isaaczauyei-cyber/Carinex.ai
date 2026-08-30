"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    setStatus(res.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return <p className="text-carinex-emerald">Thanks — we&apos;ll get back to you soon.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        required
        className="rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
      />
      {status === "error" && <p className="text-sm text-red-600">Something went wrong — try again.</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-carinex-white disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
