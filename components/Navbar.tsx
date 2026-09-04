"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const menuLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/learning", label: "Learning Hub" },
  { href: "/dashboard/opportunities", label: "Opportunity Intelligence" },
];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  useEffect(() => {
    const supabase = createClient();

    async function loadUser(currentUser: User | null) {
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from("users")
          .select("user_type")
          .eq("id", currentUser.id)
          .maybeSingle();
        setIsAdmin(data?.user_type === "admin");
      } else {
        setIsAdmin(false);
      }
    }

    supabase.auth.getUser().then(({ data }) => loadUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const initial = user?.email?.charAt(0).toUpperCase() || "?";
  const links = isAdmin ? [...menuLinks, { href: "/admin/users", label: "Admin" }] : menuLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-carinex-navy/10 bg-carinex-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {user && (
            <Link
              href="/dashboard/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-carinex-navy text-sm font-bold text-carinex-white"
              aria-label="Edit profile"
            >
              {initial}
            </Link>
          )}
          {!isDashboardRoute && (
            <Link href="/" className="flex items-center gap-2">
              <Image src="/carinex-logo.svg" alt="Carinex" width={32} height={32} className="rounded-lg" />
              <span className="text-lg font-bold tracking-tight text-carinex-navy">Carinex</span>
            </Link>
          )}
        </div>

        {!user && (
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/pathways" className="text-sm font-medium text-carinex-navy/70 transition hover:text-carinex-navy">
              Pathways
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-carinex-navy/70 transition hover:text-carinex-navy">
              Dashboard
            </Link>
          </div>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-carinex-navy/15 transition hover:bg-carinex-navy/5"
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <span className="block h-0.5 w-5 bg-carinex-navy" />
                <span className="block h-0.5 w-5 bg-carinex-navy" />
                <span className="block h-0.5 w-5 bg-carinex-navy" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 flex w-56 flex-col gap-1 rounded-xl border border-carinex-navy/10 bg-white p-2 shadow-lg">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition hover:bg-carinex-emerald/10 ${
                        link.label === "Admin" ? "text-amber-700" : "text-carinex-navy"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-carinex-navy/70 transition hover:text-carinex-navy sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-carinex-emerald px-5 py-2.5 text-sm font-semibold text-carinex-white transition hover:bg-carinex-emerald/90"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
