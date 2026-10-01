"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const legalLinks = [
  { label: "Terms and Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const hideFooter = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (hideFooter) return null;

  return (
    <footer className="border-t border-carinex-navy/10 bg-carinex-navy text-carinex-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/carinex-logo.png" alt="Carinex" width={32} height={32} />
              <span className="text-xl font-bold">Carinex</span>
            </Link>
            <p className="mt-3 text-sm text-carinex-white/60">
              Helping licensed nurses discover, prepare for, and access remote and
              telehealth healthcare careers.
            </p>
          </div>

          <div className="flex gap-10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-carinex-white/50">
                Quick Links
              </h3>
              <ul className="mt-3 flex flex-col gap-2">
                <li>
                  <Link href="/pathways" className="text-sm text-carinex-white/70 hover:text-carinex-white">
                    Explore Pathways
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="text-sm text-carinex-white/70 hover:text-carinex-white">
                    Our Services
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-carinex-white/70 hover:text-carinex-white">
                    Contact
                  </Link>
                </li>
                {user ? (
                  <>
                    <li>
                      <Link href="/dashboard" className="text-sm text-carinex-white/70 hover:text-carinex-white">
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="text-sm text-carinex-white/70 hover:text-carinex-white"
                      >
                        Log Out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/signup" className="text-sm text-carinex-white/70 hover:text-carinex-white">
                        Create an Account
                      </Link>
                    </li>
                    <li>
                      <Link href="/login" className="text-sm text-carinex-white/70 hover:text-carinex-white">
                        Log In
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-carinex-white/50">Legal</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-carinex-white/70 hover:text-carinex-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-carinex-white/10 pt-5 text-xs text-carinex-white/40">
          © {new Date().getFullYear()} Carinex. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
