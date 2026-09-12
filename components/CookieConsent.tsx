"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "carinex_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  function handleAccept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function handleDecline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-carinex-navy px-6 py-4 text-white shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/80">
          We use cookies to keep you signed in and understand how Carinex is used.
          By continuing, you agree to this in line with our{" "}
          <a href="/privacy" className="font-semibold text-white underline hover:text-white/90">
            Privacy Policy
          </a>
          , consistent with the Nigeria Data Protection Act.
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={handleDecline}
            className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="rounded-full bg-carinex-emerald px-5 py-2 text-sm font-semibold text-white transition hover:bg-carinex-emerald/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
