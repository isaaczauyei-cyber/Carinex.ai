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
  duration_display?: string | null;
  level?: string | null;
  image_url?: string | null;
  is_in_house?: boolean | null;
  is_published?: boolean | null;
};

type Specialization = {
  id: number;
  name: string;
  slug: string;
};

type Completion = {
  course_id: number;
  status: "in_progress" | "completed" | "verification_pending";
};

function ProgressRing({ pct }: { pct: number }) {
  return (
    <div
      className="relative h-12 w-12 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(#1F7A63 ${pct}%, #E2E8F0 0deg)`,
      }}
    >
      <div className="absolute inset-1 flex items-center justify-center rounded-full bg-white">
        <span className="text-[10px] font-bold text-carinex-navy">
          {pct}%
        </span>
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

  // Only fetch the profile fields this page actually needs.
  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id, user_id, track_national, track_global")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/dashboard/profile");

  // These two queries are independent, so run them together.
  const [{ data: nurseSpecs }, { data: completions }] = await Promise.all([
    supabase
      .from("nurse_specializations")
      .select("specialization_id, specializations(id, name, slug)")
      .eq("nurse_id", profile.id),

    supabase
      .from("nurse_course_completions")
      .select("course_id, status")
      .eq("nurse_id", profile.id),
  ]);

  const specializations = (nurseSpecs || [])
    .map(
      (row) =>
        row.specializations as unknown as Specialization
    )
    .filter(Boolean);

  const specIds = specializations.map((spec) => spec.id);

  // Courses depend on the selected specialization IDs.
  // Preserve the existing publication rule:
  // - external courses are included
  // - legacy NULL is still included
  // - published in-house courses are included
  // - unpublished in-house courses stay hidden
  const { data: allCourses } = specIds.length
    ? await supabase
        .from("courses")
        .select(
          "id, title, provider, track_type, price_display, affiliate_link, summary, specialization_id, duration_display, level, image_url, is_in_house, is_published"
        )
        .in("specialization_id", specIds)
        .or(
          "is_in_house.is.null,is_in_house.eq.false,is_published.is.null,is_published.eq.true"
        )
    : { data: [] as CourseRow[] };

  const completionByCourseId = new Map<number, Completion>(
    (completions || []).map((completion) => [
      completion.course_id,
      completion as Completion,
    ])
  );

  function dedupeCourses(courses: CourseRow[]): CourseRow[] {
  const byTitle = new Map<string, CourseRow>();

  const trackNational = profile?.track_national ?? false;
  const trackGlobal = profile?.track_global ?? false;

  for (const course of courses) {
    const existing = byTitle.get(course.title);

    if (!existing) {
      byTitle.set(course.title, course);
      continue;
    }

    const prefersThis =
      (course.track_type === "national" && trackNational) ||
      (course.track_type === "global" && trackGlobal);

    if (prefersThis) {
      byTitle.set(course.title, course);
    }
  }

  return Array.from(byTitle.values());
  }

  return (
    <main>
      <div className="min-h-screen bg-gradient-to-b from-carinex-navy via-carinex-navy to-carinex-emerald/20">
        <Navbar />

        <section className="mx-auto max-w-4xl px-6 py-16">
          <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
            Learning Hub
          </span>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Your courses
          </h1>

          <p className="mt-2 text-white/70">
            Complete the required courses for each specialization to unlock its
            matched opportunities.
          </p>

          {specializations.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-white/25 p-8 text-center">
              <p className="text-white/70">
                You haven&apos;t selected a specialization yet.
              </p>

              <a
                href="/pathways"
                className="mt-3 inline-block text-sm font-semibold text-white hover:underline"
              >
                Explore pathways →
              </a>
            </div>
          ) : (
            <div className="mt-10 flex flex-col gap-8">
              {specializations.map((spec) => {
                const specCourses = dedupeCourses(
                  (allCourses || []).filter(
                    (course) => course.specialization_id === spec.id
                  )
                );

                const completedCount = specCourses.filter(
                  (course) =>
                    completionByCourseId.get(course.id)?.status === "completed"
                ).length;

                const pct =
                  specCourses.length > 0
                    ? Math.round(
                        (completedCount / specCourses.length) * 100
                      )
                    : 0;

                return (
                  <div
                    key={spec.id}
                    className="rounded-2xl border border-carinex-navy/10 bg-white p-6 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {specCourses.length > 0 && (
                        <ProgressRing pct={pct} />
                      )}

                      <div className="min-w-0">
                        <a
                          href={`/pathways/${spec.slug}`}
                          className="text-lg font-bold text-carinex-navy hover:text-carinex-emerald"
                        >
                          {spec.name}
                        </a>

                        {specCourses.length > 0 && (
                          <p className="text-xs text-carinex-navy/50">
                            {completedCount} of {specCourses.length} courses
                            complete
                          </p>
                        )}
                      </div>
                    </div>

                    {specCourses.length === 0 ? (
                      <p className="mt-4 text-sm text-carinex-navy/50">
                        No courses available for this specialization yet.
                      </p>
                    ) : (
                      <div className="mt-6 flex flex-col gap-4">
                        {specCourses.map((course, idx) => {
                          const completion =
                            completionByCourseId.get(course.id) || null;

                          const stepDone =
                            completion?.status === "completed";

                          const stepActive =
                            completion && !stepDone;

                          return (
                            <div
                              key={course.id}
                              className="flex min-w-0 items-start gap-4"
                            >
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  stepDone
                                    ? "bg-carinex-emerald text-white"
                                    : stepActive
                                    ? "bg-amber-400 text-white"
                                    : "bg-carinex-navy/10 text-carinex-navy/40"
                                }`}
                              >
                                {stepDone ? "✓" : idx + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <CourseTracker
                                  nurseId={profile.id}
                                  course={course}
                                  completion={completion}
                                />
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
      </div>

      <Footer />
    </main>
  );
}
