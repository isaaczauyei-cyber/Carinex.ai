"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type CourseTocItem = {
  id: string;
  title: string;
  href: string;
  kind: "section" | "quiz";
  sectionType?: string;
  completed?: boolean;
};

type CourseTocModule = {
  id: string;
  orderIndex: number;
  title: string;
  items: CourseTocItem[];
};

type CourseSession = {
  title: string;
  modules: CourseTocModule[];
};

const menuLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pathways", label: "All Pathways" },
  { href: "/dashboard/learning", label: "Learning Hub" },
  { href: "/dashboard/opportunities", label: "Opportunity Intelligence" },
];

function itemSymbol(item: CourseTocItem) {
  if (item.completed) return "✓";
  if (item.kind === "quiz") return "▣";
  switch (item.sectionType) {
    case "course_material": return "▤";
    case "exercise": return "✎";
    case "practical_assignment": return "◆";
    case "key_takeaways": return "☑";
    case "career_application": return "↗";
    case "training_activity": return "⚙";
    default: return "○";
  }
}

export default function Navbar({ courseSession }: { courseSession?: CourseSession }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function load(currentUser: User | null) {
      setUser(currentUser);
      if (!currentUser) {
        setIsAdmin(false);
        setFullName(null);
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("user_type, full_name")
        .eq("id", currentUser.id)
        .maybeSingle();
      setIsAdmin(data?.user_type === "admin");
      setFullName(data?.full_name || null);
    }

    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      load(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (courseSession?.modules?.length) {
      setExpandedModule(courseSession.modules[0].id);
    }
  }, [courseSession]);

  async function handleLogout() {
    await createClient().auth.signOut();
    setDrawerOpen(false);
    setTocOpen(false);
    router.push("/");
    router.refresh();
  }

  const initial = (fullName?.trim()?.charAt(0) || user?.email?.charAt(0) || "?").toUpperCase();
  const links = isAdmin ? [...menuLinks, { href: "/admin/users", label: "Admin" }] : menuLinks;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-carinex-navy/10 bg-carinex-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {user && (
              <button
                type="button"
                onClick={() => (courseSession ? setTocOpen(true) : setDrawerOpen(true))}
                aria-label={courseSession ? "Open course contents" : "Open menu"}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-carinex-navy/10 bg-white text-carinex-navy hover:bg-carinex-navy/5"
              >
                <span className="text-xl leading-none">☰</span>
              </button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <Image src="/carinex-logo.png" alt="Carinex" width={34} height={34} className="shrink-0 rounded-lg object-contain" />
              <span className="text-lg font-bold leading-none tracking-tight text-carinex-navy">Carinex</span>
            </Link>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => (courseSession ? setDrawerOpen(true) : router.push("/dashboard/profile"))}
              aria-label={courseSession ? "Open account menu" : "Open profile"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-carinex-navy text-sm font-bold text-white"
            >
              {initial}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden text-sm font-medium text-carinex-navy/70 sm:inline">Log in</Link>
              <Link href="/signup" className="rounded-full bg-carinex-emerald px-5 py-2.5 text-sm font-semibold text-white">Get Started</Link>
            </div>
          )}
        </nav>
      </header>

      {user && !courseSession && (
        <>
          <div className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setDrawerOpen(false)} />
          <aside className={`fixed left-0 top-0 z-[70] h-full w-72 bg-white shadow-xl transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex items-center gap-3 border-b border-carinex-navy/10 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-carinex-navy font-bold text-white">{initial}</div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-carinex-navy">{fullName || "Carinex Nurse"}</p>{isAdmin && <p className="text-xs font-semibold text-amber-600">Admin</p>}</div>
              <button type="button" onClick={() => setDrawerOpen(false)} className="ml-auto text-xl text-carinex-navy/50">×</button>
            </div>
            <div className="flex flex-col p-3">
              {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)} className={`rounded-lg px-4 py-3 text-sm font-medium hover:bg-carinex-emerald/10 ${link.label === "Admin" ? "text-amber-700" : "text-carinex-navy"}`}>{link.label}</Link>)}
              <button onClick={handleLogout} className="mt-2 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50">Log out</button>
            </div>
          </aside>
        </>
      )}

      {user && courseSession && (
        <>
          <div className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${tocOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setTocOpen(false)} />
          <aside className={`fixed left-0 top-0 z-[70] h-full w-80 bg-white shadow-xl transition-transform duration-300 ${tocOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="border-b border-carinex-navy/10 p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-carinex-emerald">Course contents</p>
                  <p className="mt-1 font-bold text-carinex-navy">{courseSession.title}</p>
                </div>
                <button type="button" onClick={() => setTocOpen(false)} className="text-xl text-carinex-navy/50">×</button>
              </div>
            </div>

            <div className="h-[calc(100%-96px)] overflow-y-auto p-3">
              {courseSession.modules.map((module) => {
                const open = expandedModule === module.id;
                const completedCount = module.items.filter((item) => item.completed).length;
                return (
                  <div key={module.id} className="mb-2 overflow-hidden rounded-xl border border-carinex-navy/10">
                    <button
                      type="button"
                      onClick={() => setExpandedModule(open ? null : module.id)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-carinex-navy/5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carinex-navy/5 text-xs font-bold text-carinex-navy">
                        {module.orderIndex}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-carinex-navy/45">Module {module.orderIndex}</span>
                        <span className="mt-0.5 block text-sm font-semibold leading-snug text-carinex-navy">{module.title}</span>
                        {module.items.length > 0 && <span className="mt-1 block text-xs text-carinex-navy/45">{completedCount}/{module.items.length} completed</span>}
                      </span>
                      <span className="text-lg leading-none text-carinex-navy/45">{open ? "⌃" : "⌄"}</span>
                    </button>

                    {open && (
                      <div className="border-t border-carinex-navy/10 bg-carinex-navy/[0.02] px-2 py-2">
                        {module.items.length === 0 ? (
                          <p className="px-3 py-3 text-xs text-carinex-navy/45">No sections in this module yet.</p>
                        ) : module.items.map((item) => (
                          <Link
                            key={`${item.kind}-${item.id}`}
                            href={item.href}
                            onClick={() => setTocOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-carinex-navy hover:bg-white"
                          >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.completed ? "bg-carinex-emerald/10 text-carinex-emerald" : "bg-carinex-navy/5 text-carinex-navy/45"}`}>
                              {itemSymbol(item)}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{item.title}</span>
                            {item.completed && <span className="text-xs font-semibold text-carinex-emerald">Done</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <div className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setDrawerOpen(false)} />
          <aside className={`fixed right-0 top-0 z-[70] h-full w-72 bg-white shadow-xl transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-center gap-3 border-b border-carinex-navy/10 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-carinex-navy font-bold text-white">{initial}</div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-carinex-navy">{fullName || "Carinex Nurse"}</p>{isAdmin && <p className="text-xs font-semibold text-amber-600">Admin</p>}</div>
              <button type="button" onClick={() => setDrawerOpen(false)} className="ml-auto text-xl text-carinex-navy/50">×</button>
            </div>
            <div className="flex flex-col p-3">
              {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)} className={`rounded-lg px-4 py-3 text-sm font-medium hover:bg-carinex-emerald/10 ${link.label === "Admin" ? "text-amber-700" : "text-carinex-navy"}`}>{link.label}</Link>)}
              <button onClick={handleLogout} className="mt-2 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50">Log out</button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
