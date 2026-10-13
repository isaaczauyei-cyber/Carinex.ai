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
  is_in_house?: boolean;
  is_published?: boolean | null;
};

type Specialization = { id: number; name: string; slug: string };
type Completion = {
  course_id: number;
  status: "in_progress" | "completed" | "verification_pending";
};

function ProgressRing({ pct }: { pct: number }) {
  return (
    <div
      aria-label={`${pct}% complete`}
      className="relative h-12 w-12 shrink-0 rounded-full"
      style={{ background: `conic-gradient(#1F7A63 ${pct}%, #E8EDF2 0deg)` }}
    >
      <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-white">
        <span className="text-[11px] font-bold text-carinex-navy">{pct}%</span>
      </div>
    </div>
  );
}

export default async function LearningHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id, user_id, track_national, track_global")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/dashboard/profile");

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
    .map((row) => row.specializations as unknown as Specialization)
    .filter(Boolean);
  const specIds = specializations.map((spec) => spec.id);
  const courseSelect =
    "id, title, provider, track_type, price_display, affiliate_link, summary, specialization_id, duration_display, level, image_url, is_in_house, is_published";
  const publicationFilter =
    "is_in_house.is.null,is_in_house.eq.false,is_published.is.null,is_published.eq.true";
  const completionCourseIds = Array.from(
    new Set((completions || []).map((completion) => completion.course_id))
  );

  const [specializationCoursesResult, enrolledCoursesResult] = await Promise.all([
    specIds.length
      ? supabase.from("courses").select(courseSelect).in("specialization_id", specIds).or(publicationFilter)
      : Promise.resolve({ data: [] as CourseRow[] }),
    completionCourseIds.length
      ? supabase.from("courses").select(courseSelect).in("id", completionCourseIds).or(publicationFilter)
      : Promise.resolve({ data: [] as CourseRow[] }),
  ]);

  const allCourses = Array.from(
    new Map(
      [...(specializationCoursesResult.data || []), ...(enrolledCoursesResult.data || [])]
        .map((course) => [course.id, course as CourseRow])
    ).values()
  );
  const completionByCourseId = new Map<number, Completion>(
    (completions || []).map((completion) => [completion.course_id, completion as Completion])
  );

  // Keep track preferences safe when a profile row is unavailable.
  const trackNational = profile?.track_national ?? false;
  const trackGlobal = profile?.track_global ?? false;

  function dedupeCourses(courses: CourseRow[]): CourseRow[] {
    const byTitle = new Map<string, CourseRow>();
    for (const course of courses) {
      const existing = byTitle.get(course.title);
      if (!existing) {
        byTitle.set(course.title, course);
        continue;
      }
      const prefersThis =
        (course.track_type === "national" && trackNational) ||
        (course.track_type === "global" && trackGlobal);
      if (prefersThis) byTitle.set(course.title, course);
    }
    return Array.from(byTitle.values());
  }

  const enrolledInSpecializationCourseIds = new Set(
    allCourses.filter((course) => specIds.includes(course.specialization_id)).map((course) => course.id)
  );
  const separatelyEnrolledCourses = dedupeCourses(
    allCourses.filter((course) => completionByCourseId.has(course.id) && !enrolledInSpecializationCourseIds.has(course.id))
  );
  const completedTotal = allCourses.filter((course) => completionByCourseId.get(course.id)?.status === "completed").length;
  const inProgressTotal = allCourses.filter((course) => {
    const status = completionByCourseId.get(course.id)?.status;
    return status === "in_progress" || status === "verification_pending";
  }).length;
  const uniqueCourseCount = new Set([
    ...allCourses.filter((course) => specIds.includes(course.specialization_id)).map((course) => course.id),
    ...separatelyEnrolledCourses.map((course) => course.id),
  ]).size;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F2F7F5] via-[#F7F9FC] to-[#EAF3F0] text-carinex-navy">
      <Navbar />
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-carinex-navy via-[#123B46] to-carinex-emerald text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">CARINEX LEARNING</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Your learning hub</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              Pick up where you left off, keep track of your progress, and build the skills that move your nursing career forward.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-carinex-emerald" aria-hidden="true">▤</div>
              <div><p className="text-2xl font-bold text-white">{uniqueCourseCount}</p><p className="mt-0.5 text-xs font-medium text-white/75">Courses in your hub</p></div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700" aria-hidden="true">◷</div>
              <div><p className="text-2xl font-bold text-white">{inProgressTotal}</p><p className="mt-0.5 text-xs font-medium text-white/75">In progress / under review</p></div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-carinex-emerald" aria-hidden="true">✓</div>
              <div><p className="text-2xl font-bold text-white">{completedTotal}</p><p className="mt-0.5 text-xs font-medium text-white/75">Courses completed</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {specializations.length === 0 && separatelyEnrolledCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-carinex-emerald" aria-hidden="true">▤</div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Your learning journey starts here</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Explore career pathways to find courses that match your goals. Enrolled courses will appear here.</p>
            <a href="/pathways" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-carinex-emerald px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">Explore pathways <span className="ml-2" aria-hidden="true">→</span></a>
          </div>
        ) : (
          <div className="space-y-10">
            {specializations.map((spec) => {
              const specCourses = dedupeCourses(allCourses.filter((course) => course.specialization_id === spec.id));
              const completedCount = specCourses.filter((course) => completionByCourseId.get(course.id)?.status === "completed").length;
              const pct = specCourses.length ? Math.round((completedCount / specCourses.length) * 100) : 0;
              return (
                <section key={spec.id} aria-labelledby={`specialization-${spec.id}`}>
                  <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-center gap-4">
                      <ProgressRing pct={pct} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-carinex-emerald">SPECIALIZATION</p>
                        <h2 id={`specialization-${spec.id}`} className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{spec.name}</h2>
                        <p className="mt-1 text-sm text-slate-500">{completedCount} of {specCourses.length} courses completed</p>
                      </div>
                    </div>
                    <a href={`/pathways/${spec.slug}`} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-carinex-emerald hover:text-carinex-emerald">View pathway <span className="ml-2" aria-hidden="true">→</span></a>
                  </div>
                  {specCourses.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">No courses are available for this specialization yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {specCourses.map((course) => (
                        <CourseTracker key={course.id} nurseId={profile.id} course={course} completion={completionByCourseId.get(course.id) || null} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}

            {separatelyEnrolledCourses.length > 0 && (
              <section aria-labelledby="other-enrolled-courses">
                <div className="mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-carinex-emerald">YOUR PERSONAL COURSE LIST</p>
                  <h2 id="other-enrolled-courses" className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">Other enrolled courses</h2>
                  <p className="mt-1 text-sm text-slate-600">Courses you enrolled in directly, outside your selected specializations.</p>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {separatelyEnrolledCourses.map((course) => (
                    <CourseTracker key={course.id} nurseId={profile.id} course={course} completion={completionByCourseId.get(course.id) || null} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
