import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import CourseTracker from "@/components/CourseTracker";

type CourseRow = {
  id: number;
  title: string;
  provider: string;
  track_type: string;
  price_display: string | null;
  affiliate_link: string;
  summary: string | null;
  specialization_id: number;
};

function ProgressRing({ pct }: { pct: number }) {
  return (
    <div
      className="relative h-12 w-12 shrink-0 rounded-full"
      style={{ background: `conic-gradient(#1F7A63 ${pct}%, #E2E8F0 0deg)` }}
    >
      <div className="absolute inset-1 flex items-center justify-center rounded-full bg-white">
        <span className="text-[10px] font-bold text-carinex-navy">{pct}%</span>
      </div>
    </div>
  );
}

export default async function LearningHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!profile) redirect("/dashboard/profile");

  const { data: nurseSpecs } = await supabase
    .from("nurse_specializations")
    .select("specialization_id, specializations(id, name, slug)")
    .eq("nurse_id", profile.id);

  const specializations = (nurseSpecs || [])
    .map((row) => row.specializations as unknown as { id: number; name: string; slug: string })
    .filter(Boolean);

  const specIds = specializations.map((s) => s.id);

  const { data: allCourses } = specIds.length
    ? await supabase.from("courses").select("*").in("specialization_id", specIds)
    : { data: [] };

  const { data: completions } = await supabase
    .from("nurse_course_completions")
    .select("*")
    .eq("nurse_id", profile.id);

  const completionByCourseId = new Map(
    (completions || []).map((c) => [c.course_id, c])
  );

  function dedupeCourses(courses: CourseRow[]): CourseRow[] {
    const byTitle = new Map<string, CourseRow>();
    for (const course of courses) {
      const existing = byTitle.get(course.title);
      if (!existing) {
        byTitle.set(course.title, course);
        continue;
      }
      const prefersThis =
        (course.track_type === "national" && profile.track_national) ||
        (course.track_type === "global" && profile.track_global);
      if (prefersThis) byTitle.set(course.title, course);
    }
    return Array.from(byTitle.values());
  }

  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-16">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Learning Hub
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Your courses
        </h1>
        <p className="mt-2 text-carinex-navy/70">
          Complete the required courses for each specialization to unlock its
          matched opportunities.
        </p>

        {specializations.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-carinex-navy/20 p-8 text-center">
            <p className="text-carinex-navy/70">
              You haven&apos;t selected a specialization yet.
            </p>
            <a
              href="/pathways"
              className="mt-3 inline-block text-sm font-semibold text-carinex-emerald hover:underline"
            >
              Explore pathways →
            </a>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-8">
            {specializations.map((spec) => {
              const specCourses = dedupeCourses(
                (allCourses || []).filter((c) => c.specialization_id === spec.id)
              );
              const completedCount = specCourses.filter(
                (c) => completionByCourseId.get(c.id)?.status === "completed"
              ).length;
              const pct = specCourses.length > 0 ? Math.round((completedCount / specCourses.length) * 100) : 0;

              return (
                <div key={spec.id} className="rounded-2xl border border-carinex-navy/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    {specCourses.length > 0 && <ProgressRing pct={pct} />}
                    <div>
                      <a
                        href={`/pathways/${spec.slug}`}
                        className="text-lg font-bold text-carinex-navy hover:text-carinex-emerald"
                      >
                        {spec.name}
                      </a>
                      {specCourses.length > 0 && (
                        <p className="text-xs text-carinex-navy/50">
                          {completedCount} of {specCourses.length} courses complete
                        </p>
                      )}
                    </div>
                  </div>

                  {specCourses.length === 0 ? (
                    <p className="mt-4 text-sm text-carinex-navy/50">
                      No courses available for this specialization yet.
                    </p>
                  ) : (
                    <div className="mt-6 flex flex-col">
                      {specCourses.map((course, idx) => {
                        const completion = completionByCourseId.get(course.id) || null;
                        const stepDone = completion?.status === "completed";
                        const stepActive = completion && !stepDone;

                        return (
                          <div key={course.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                            {idx < specCourses.length - 1 && (
                              <div className="absolute left-[15px] top-8 h-full w-0.5 bg-carinex-navy/10" />
                            )}
                            <div
                              className={`z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                stepDone
                                  ? "bg-carinex-emerald text-white"
                                  : stepActive
                                  ? "bg-amber-400 text-white"
                                  : "bg-carinex-navy/10 text-carinex-navy/40"
                              }`}
                            >
                              {stepDone ? "✓" : idx + 1}
                            </div>
                            <div className="flex-1">
                              <CourseTracker nurseId={profile.id} course={course} completion={completion} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
