"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { ModuleSummary } from "@/lib/course-content";

export default function CoursePlayerHeader({
  courseTitle,
  courseId,
  structure,
  completedLessonIds,
  passedModuleIds,
  currentLessonId,
  currentQuizModuleId,
}: {
  courseTitle: string;
  courseId: number;
  structure: ModuleSummary[];
  completedLessonIds: Set<string>;
  passedModuleIds: Set<string>;
  currentLessonId?: string;
  currentQuizModuleId?: string;
}) {
  const [tocOpen, setTocOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    const active = structure.find((m) =>
      m.lessons.some((l) => l.id === currentLessonId) || m.id === currentQuizModuleId
    );
    if (active) setOpenModules(new Set([active.id]));
  }, [structure, currentLessonId, currentQuizModuleId]);

  function toggleModule(id: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const initial = user?.email?.charAt(0).toUpperCase() || "?";

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-carinex-navy/10 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTocOpen(true)}
            aria-label="Course contents"
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full hover:bg-carinex-navy/5"
          >
            <span className="block h-0.5 w-5 bg-carinex-navy" />
            <span className="block h-0.5 w-5 bg-carinex-navy" />
            <span className="block h-0.5 w-5 bg-carinex-navy" />
          </button>
          <Image src="/carinex-logo.svg" alt="Carinex" width={26} height={26} className="rounded-md" />
          <span className="text-sm font-bold text-carinex-navy">Carinex</span>
        </div>

        <Link
          href="/dashboard/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-carinex-navy text-sm font-bold text-carinex-white"
          aria-label="Profile"
        >
          {initial}
        </Link>
      </header>

      {tocOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-full max-w-sm overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-carinex-navy/10 p-4">
              <p className="font-bold text-carinex-navy">{courseTitle}</p>
              <button onClick={() => setTocOpen(false)} className="text-2xl text-carinex-navy/50" aria-label="Close">
                ×
              </button>
            </div>

            <div className="p-2">
              {structure.map((mod, i) => {
                const isOpen = openModules.has(mod.id);
                return (
                  <div key={mod.id} className="mb-1 rounded-lg bg-carinex-navy/[0.03]">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-xs font-semibold text-carinex-navy/50">Module {i + 1}</p>
                        <p className="font-semibold text-carinex-navy">{mod.title}</p>
                      </div>
                      <span className="text-carinex-navy/40">{isOpen ? "▲" : "▼"}</span>
                    </button>

                    {isOpen && (
                      <div className="flex flex-col gap-1 px-2 pb-3">
                        {mod.lessons.map((lesson) => {
                          const done = completedLessonIds.has(lesson.id);
                          const active = lesson.id === currentLessonId;
                          return (
                            <Link
                              key={lesson.id}
                              href={`/dashboard/learning/inhouse/${courseId}/lesson/${lesson.id}`}
                              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                                active ? "bg-carinex-emerald/10 text-carinex-emerald" : "text-carinex-navy"
                              }`}
                            >
                              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                                done ? "bg-carinex-emerald text-white" : "border border-carinex-navy/20"
                              }`}>
                                {done ? "✓" : ""}
                              </span>
                              {lesson.title}
                            </Link>
                          );
                        })}

                        {mod.hasQuiz && (
                          <Link
                            href={`/dashboard/learning/inhouse/${courseId}/quiz/${mod.id}`}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                              mod.id === currentQuizModuleId ? "bg-carinex-emerald/10 text-carinex-emerald" : "text-carinex-navy"
                            }`}
                          >
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                              passedModuleIds.has(mod.id) ? "bg-carinex-emerald text-white" : "border border-carinex-navy/20"
                            }`}>
                              {passedModuleIds.has(mod.id) ? "✓" : ""}
                            </span>
                            Quiz
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <button
            className="flex-1 bg-black/30"
            onClick={() => setTocOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}
    </>
  );
                                }
