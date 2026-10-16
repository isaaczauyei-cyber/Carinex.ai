"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { ModuleSummary } from "@/lib/course-content";

const menuLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pathways", label: "All Pathways" },
  { href: "/dashboard/learning", label: "Learning Hub" },
  { href: "/dashboard/opportunities", label: "Opportunity Intelligence" },
];

const sectionIcons: Record<string, string> = {
  course_material: "📄",
  exercise: "✏️",
  practical_assignment: "📝",
  key_takeaways: "💡",
  career_application: "💼",
  training_activity: "🧪",
};

export default function CoursePlayerHeader({
  courseTitle,
  courseId,
  structure,
  completedSectionIds,
  passedModuleIds,
  currentSectionId,
  currentQuizModuleId,
}: {
  courseTitle: string;
  courseId: number;
  structure: ModuleSummary[];
  completedSectionIds: Set<string>;
  passedModuleIds: Set<string>;
  currentSectionId?: string;
  currentQuizModuleId?: string;
}) {
  const router = useRouter();
  const [tocOpen, setTocOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: userRow } = await supabase
          .from("users")
          .select("user_type, full_name")
          .eq("id", data.user.id)
          .maybeSingle();
        setIsAdmin(userRow?.user_type === "admin");
        setFullName(userRow?.full_name || null);
      }
    });
  }, []);

  useEffect(() => {
    const active = structure.find((m) =>
      m.sections.some((s) => s.id === currentSectionId) || m.id === currentQuizModuleId
    );
    if (active) setOpenModules(new Set([active.id]));
  }, [structure, currentSectionId, currentQuizModuleId]);

  function toggleModule(id: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initial = user?.email?.charAt(0).toUpperCase() || "?";
  const links = isAdmin ? [...menuLinks, { href: "/admin/users", label: "Admin" }] : menuLinks;

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-carinex-navy px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTocOpen(true)}
            aria-label="Course contents"
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full hover:bg-white/10"
          >
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
          </button>
          <Image src="/carinex-logo.png" alt="Carinex" width={26} height={26} className="rounded-md" />
          <span className="text-sm font-bold text-white">Carinex</span>
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Account menu"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-carinex-emerald text-sm font-bold text-white"
        >
          {initial}
        </button>
      </header>

      {tocOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-full max-w-sm overflow-y-auto bg-carinex-navy text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/20 p-4">
              <p className="font-bold text-white">{courseTitle}</p>
              <button onClick={() => setTocOpen(false)} className="text-2xl text-white/70" aria-label="Close">
                ×
              </button>
            </div>

            <div className="p-2">
              {structure.map((mod, i) => {
                const isOpen = openModules.has(mod.id);
                return (
                  <div key={mod.id} className="mb-1 rounded-lg bg-white/5">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white/60">Module {i + 1}</p>
                        <p className="font-semibold text-white">{mod.title}</p>
                      </div>
                      <span className="text-white/70">{isOpen ? "▲" : "▼"}</span>
                    </button>

                    {isOpen && (
                      <div className="flex flex-col gap-1 px-2 pb-3">
                        {mod.sections.map((section) => {
                          const done = completedSectionIds.has(section.id);
                          const active = section.id === currentSectionId;
                          return (
                            <Link
                              key={section.id}
                              href={`/dashboard/learning/inhouse/${courseId}/section/${section.id}`}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                                active ? "bg-carinex-emerald text-white" : "text-white hover:bg-white/10"
                              }`}
                            >
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                                done ? "bg-white text-carinex-navy" : "border border-white/40 text-white"
                              }`}>
                                {done ? "✓" : ""}
                              </span>
                              <span className="shrink-0">{sectionIcons[section.section_type] || ""}</span>
                              {section.title}
                            </Link>
                          );
                        })}

                        {mod.hasQuiz && (
                          <Link
                            href={`/dashboard/learning/inhouse/${courseId}/quiz/${mod.id}`}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                              mod.id === currentQuizModuleId ? "bg-carinex-emerald text-white" : "text-white hover:bg-white/10"
                            }`}
                          >
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                              passedModuleIds.has(mod.id) ? "bg-white text-carinex-navy" : "border border-white/40 text-white"
                            }`}>
                              {passedModuleIds.has(mod.id) ? "✓" : ""}
                            </span>
                            🧠 Quiz
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <button className="flex-1 bg-black/30" onClick={() => setTocOpen(false)} aria-label="Close menu" />
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button className="flex-1 bg-black/30" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <div className="w-72 overflow-y-auto bg-white shadow-xl">
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
                  onClick={() => setMenuOpen(false)}
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
        </div>
      )}
    </>
  );
}
