"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const menuLinks = [
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/learning", label: "Learning Hub" },
  { href: "/dashboard/opportunities", label: "Opportunity Intelligence" },
];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadUser(currentUser: User | null) {
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from("users")
          .select("user_type, full_name")
          .eq("id", currentUser.id)
          .maybeSingle();
        setIsAdmin(data?.user_type === "admin");
        setFullName(data?.full_name || null);
      } else {
        setIsAdmin(false);
        setFullName(null);
      }
    }

    supabase.auth.getUser().then(({ data }) => loadUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDrawerOpen(false);
    router.push("/");
    router.refresh();
  }

  const initial = user?.email?.charAt(0).toUpperCase() || "?";
  const links = isAdmin ? [...menuLinks, { href: "/admin/users", label: "Admin" }] : menuLinks;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-carinex-navy/10 bg-carinex-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-carinex-navy text-sm font-bold leading-none text-carinex-white"
              >
                {initial}
              </button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/carinex-logo.svg"
                alt="Carinex"
                width={32}
                height={32}
                className="shrink-0 rounded-lg object-contain"
              />
              <span className="text-lg font-bold leading-none tracking-tight text-carinex-navy">
                Carinex
              </span>
            </Link>
          </div>

          {!user && (
            <div className="flex items-center gap-3">
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
            </div>
          )}
        </nav>
      </header>

      {user && (
        <>
          <div
            className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${
              drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className={`fixed left-0 top-0 z-[70] h-full w-72 bg-white shadow-xl transition-transform duration-300 ${
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center gap-3 border-b border-carinex-navy/10 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-carinex-navy text-base font-bold text-carinex-white">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-carinex-navy">
                  {fullName || "Carinex Nurse"}
                </p>
                {isAdmin && <p className="text-xs font-semibold text-amber-600">Admin</p>}
              </div>
            </div>

            <div className="flex flex-col p-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition hover:bg-carinex-emerald/10 ${
                    link.label === "Admin" ? "text-amber-700" : "text-carinex-navy"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="mt-2 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
