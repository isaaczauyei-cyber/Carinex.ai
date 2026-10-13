import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SelectPathwayButton from "@/components/SelectPathwayButton";
import CourseTracker from "@/components/CourseTracker";
import { getSpecializationBySlug } from "@/lib/data";
import { specializationExtras, tierStyles } from "@/lib/specialization-extras";
import { createClient } from "@/lib/supabase/server";

type CourseRow = {
  id: number;
  title: string;
  track_type: string;
  [key: string]: unknown;
};

function dedupeCourses(courses: CourseRow[], trackNational: boolean, trackGlobal: boolean): CourseRow[] {
  const byTitle = new Map<string, CourseRow>();
  for (const course of courses) {
    const existing = byTitle.get(course.title);
    if (!existing) {
      byTitle.set(course.title, course);
      continue;
    }
    const prefersThis =
      (course.track_type === "national" && trackNational) || (course.track_type === "global" && trackGlobal);
    if (prefersThis) byTitle.set(course.title, course);
  }
  return Array.from(byTitle.values());
}

export default async function PathwayDetailPage({ params }: { params: { slug: string } }) {
  const spec = getSpecializationBySlug(params.slug);
  if (!spec) notFound();

  const extras = specializationExtras[params.slug];
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Pre-signup: teaser only, keeps its own back link since logged-out
  // visitors have no account menu to reach /pathways from ---
  if (!user) {
    return (
      <main>
        <Navbar />
        <section className="mx-auto max-w-3xl px-6 py-20">
          <a href="/pathways" className="text-sm font-semibold text-carinex-emerald hover:underline">
            ← All pathways
          </a>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
              {spec.trackDescription}
            </span>
            {extras?.evidence.map((e) => (
              <span key={e.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${tierStyles[e.tier]}`}>
                {e.label}
              </span>
            ))}
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-carinex-navy">{spec.title}</h1>

          <div className="mt-6 flex flex-wrap gap-2">
            {spec.skills.map((skill) => (
              <span key={skill} className="rounded-full border border-carinex-gray/40 px-3 py-1 text-xs text-carinex-navy/70">
                {skill}
              </span>
            ))}
          </div>

          <p className="mt-8 text-lg text-carinex-navy/80">{spec.teaser}</p>

          <div className="mt-10 rounded-2xl border border-dashed border-carinex-navy/20 bg-carinex-navy/[0.02] p-10 text-center">
            <span className="text-3xl">🔒</span>
            <p className="mt-3 text-lg font-semibold text-carinex-navy">
              Sign up to see the full pathway
            </p>
            <p className="mt-2 text-sm text-carinex-navy/60">
              Eligibility requirements, real salary ranges, certifications, employers,
              and the full course roadmap — all free once you create an account.
            </p>
            <a
              href="/signup"
              className="mt-5 inline-block rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-white transition hover:bg-carinex-emerald/90"
            >
              Get Started
            </a>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  // --- Post-signup: full detail ---
  const { data: dbSpec } = await supabase.from("specializations").select("id").eq("slug", params.slug).maybeSingle();

  const { data: rawCourses } = dbSpec
    ? await supabase.from("courses").select("*").eq("specialization_id", dbSpec.id)
    : { data: [] };

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id, track_national, track_global")
    .eq("user_id", user.id)
    .maybeSingle();

  let completionByCourseId = new Map();
  let nurseProfileId: string | null = null;
  let trackNational = false;
  let trackGlobal = false;
  let alreadyEnrolled = false;

  if (profile) {
    nurseProfileId = profile.id;
    trackNational = profile.track_national || false;
    trackGlobal = profile.track_global || false;

    const { data: completions } = await supabase.from("nurse_course_completions").select("*").eq("nurse_id", profile.id);
    completionByCourseId = new Map((completions || []).map((c) => [c.course_id, c]));

    if (dbSpec) {
      const { data: enrollment } = await supabase
        .from("nurse_specializations")
        .select("nurse_id")
        .eq("nurse_id", profile.id)
        .eq("specialization_id", dbSpec.id)
        .maybeSingle();
      alreadyEnrolled = !!enrollment;
    }
  }

  const courses = dedupeCourses((rawCourses as CourseRow[]) || [], trackNational, trackGlobal);

  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
            {spec.trackDescription}
          </span>
          {extras?.evidence.map((e) => (
            <span key={e.label} className={`rounded-full px-3 py-1 text-xs font-semibold ${tierStyles[e.tier]}`}>
              {e.label}
            </span>
          ))}
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-carinex-navy">{spec.title}</h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {spec.skills.map((skill) => (
            <span key={skill} className="rounded-full border border-carinex-gray/40 px-3 py-1 text-xs text-carinex-navy/70">
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-carinex-navy/10 bg-gradient-to-br from-white via-white to-emerald-50/50 p-4 shadow-sm sm:p-6">
          <div className="mb-5 rounded-2xl bg-gradient-to-r from-carinex-navy to-carinex-emerald p-5 text-white sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Specialization guide</p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">Explore this pathway at your own pace</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Open any section to read more. The details are organized into short panels so you can focus on the information you need.</p>
          </div>

          <div className="flex flex-col gap-3">
            <details open className="group overflow-hidden rounded-2xl border border-carinex-emerald/20 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald">01</span><span><span className="block font-bold text-carinex-navy">What it is</span><span className="mt-0.5 block text-xs text-carinex-navy/55">Understand the role and specialization</span></span></span>
                <span className="text-xl text-carinex-emerald transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
              </summary>
              <div className="border-t border-carinex-navy/5 px-4 pb-5 pt-4 text-sm leading-7 text-carinex-navy/75 sm:px-5">{spec.whatItIs}</div>
            </details>

            <details className="group overflow-hidden rounded-2xl border border-carinex-navy/10 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald">02</span><span><span className="block font-bold text-carinex-navy">Why it matters</span><span className="mt-0.5 block text-xs text-carinex-navy/55">The value and impact of this work</span></span></span><span className="text-xl text-carinex-emerald transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary>
              <div className="border-t border-carinex-navy/5 px-4 pb-5 pt-4 text-sm leading-7 text-carinex-navy/75 sm:px-5">{spec.whyItMatters}</div>
            </details>

            <details className="group overflow-hidden rounded-2xl border border-carinex-navy/10 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald">03</span><span><span className="block font-bold text-carinex-navy">Day to day</span><span className="mt-0.5 block text-xs text-carinex-navy/55">Typical responsibilities and tasks</span></span></span><span className="text-xl text-carinex-emerald transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary>
              <ul className="flex flex-col gap-2 border-t border-carinex-navy/5 px-4 pb-5 pt-4 sm:px-5">{spec.dayToDay.map((item, i) => <li key={i} className="flex gap-2 text-sm leading-6 text-carinex-navy/75"><span className="mt-0.5 text-carinex-emerald">✓</span><span>{item}</span></li>)}</ul>
            </details>

            <details className="group overflow-hidden rounded-2xl border border-carinex-navy/10 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald">04</span><span><span className="block font-bold text-carinex-navy">Eligibility requirements</span><span className="mt-0.5 block text-xs text-carinex-navy/55">Compare national and global tracks</span></span></span><span className="text-xl text-carinex-emerald transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary>
              <div className="grid gap-4 border-t border-carinex-navy/5 px-4 pb-5 pt-4 sm:grid-cols-2 sm:px-5">
                <div className="rounded-xl bg-slate-50 p-4"><p className="font-semibold text-carinex-navy">National track</p><ul className="mt-2 flex flex-col gap-2">{spec.eligibilityNational.map((item, i) => <li key={i} className="text-sm leading-6 text-carinex-navy/70">• {item}</li>)}</ul></div>
                <div className="rounded-xl bg-emerald-50/60 p-4"><p className="font-semibold text-carinex-navy">Global track</p><ul className="mt-2 flex flex-col gap-2">{spec.eligibilityGlobal.map((item, i) => <li key={i} className="text-sm leading-6 text-carinex-navy/70">• {item}</li>)}</ul></div>
              </div>
            </details>

            {extras?.globalCaveat && <details className="group overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden"><span><span className="block font-bold text-amber-950">Global track — read before applying abroad</span><span className="mt-0.5 block text-xs text-amber-900/70">Important international considerations</span></span><span className="text-xl text-amber-800 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary><p className="border-t border-amber-200 px-4 pb-5 pt-4 text-sm leading-7 text-amber-950/80 sm:px-5">{extras.globalCaveat}</p></details>}

            {spec.certifications.length > 0 && <details className="group overflow-hidden rounded-2xl border border-carinex-navy/10 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald">05</span><span><span className="block font-bold text-carinex-navy">Certifications</span><span className="mt-0.5 block text-xs text-carinex-navy/55">Credentials that may support your pathway</span></span></span><span className="text-xl text-carinex-emerald transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary><div className="grid gap-3 border-t border-carinex-navy/5 px-4 pb-5 pt-4 sm:px-5">{spec.certifications.map((c) => <div key={c.name} className="rounded-xl border border-carinex-navy/10 p-4"><p className="font-semibold text-carinex-navy">{c.name} · {c.body}</p><p className="mt-1 text-sm leading-6 text-carinex-navy/60">{c.note}</p></div>)}</div></details>}

            <details className="group overflow-hidden rounded-2xl border border-carinex-navy/10 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald">06</span><span><span className="block font-bold text-carinex-navy">Salary expectations</span><span className="mt-0.5 block text-xs text-carinex-navy/55">Compare national and global ranges</span></span></span><span className="text-xl text-carinex-emerald transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary><div className="grid gap-3 border-t border-carinex-navy/5 px-4 pb-5 pt-4 sm:grid-cols-3 sm:px-5"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-carinex-navy/50">Nigeria</p><p className="mt-2 text-sm leading-6 text-carinex-navy/75">{spec.salaryNational}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-carinex-navy/50">Global · entry</p><p className="mt-2 text-sm leading-6 text-carinex-navy/75">{spec.salaryGlobalRealistic}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-carinex-navy/50">Global · experienced</p><p className="mt-2 text-sm leading-6 text-carinex-navy/75">{spec.salaryGlobalAspirational}</p></div></div></details>

            {(spec.employersNational.length > 0 || spec.employersGlobal.length > 0) && <details className="group overflow-hidden rounded-2xl border border-carinex-navy/10 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald">07</span><span><span className="block font-bold text-carinex-navy">Where you can work</span><span className="mt-0.5 block text-xs text-carinex-navy/55">Potential employers and work settings</span></span></span><span className="text-xl text-carinex-emerald transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary><div className="border-t border-carinex-navy/5 px-4 pb-5 pt-4 sm:px-5">{spec.employersNational.length > 0 && <div><p className="text-sm font-semibold text-carinex-navy">Nigeria</p><div className="mt-2 flex flex-wrap gap-2">{spec.employersNational.map((e) => <span key={e} className="rounded-full bg-carinex-navy/5 px-3 py-1.5 text-xs text-carinex-navy/70">{e}</span>)}</div></div>}{spec.employersGlobal.length > 0 && <div className="mt-5"><p className="text-sm font-semibold text-carinex-navy">Global</p><div className="mt-2 grid gap-3 sm:grid-cols-2">{spec.employersGlobal.map((e) => <div key={e.name} className="rounded-xl border border-carinex-navy/10 p-3"><p className="text-sm font-semibold text-carinex-navy">{e.name}</p><p className="mt-1 text-sm leading-6 text-carinex-navy/60">{e.note}</p></div>)}</div></div>}</div></details>}

            <details className="group overflow-hidden rounded-2xl border border-carinex-emerald/20 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden"><span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald">08</span><span><span className="block font-bold text-carinex-navy">Course pathway</span><span className="mt-0.5 block text-xs text-carinex-navy/55">Explore the learning roadmap and courses</span></span></span><span className="text-xl text-carinex-emerald transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary><div className="border-t border-carinex-navy/5 px-4 pb-5 pt-4 sm:px-5">{courses.length === 0 ? (spec.coursePathway.length > 0 ? <div className="flex flex-col gap-2">{spec.coursePathway.map((c, i) => <div key={i} className="rounded-xl border border-carinex-navy/10 bg-slate-50 p-4 text-sm leading-6 text-carinex-navy/70">{c}</div>)}</div> : <p className="text-sm text-carinex-navy/50">Courses for this specialization are coming soon.</p>) : nurseProfileId ? <div className="flex flex-col gap-3">{courses.map((course) => <CourseTracker key={course.id} nurseId={nurseProfileId} course={course as never} completion={completionByCourseId.get(course.id) || null} />)}</div> : null}</div></details>
          </div>
        </div>

        {alreadyEnrolled ? (
          <div className="mt-10 flex items-center gap-2 text-carinex-emerald">
            <span className="text-lg">✓</span>
            <span className="font-semibold">You&apos;re enrolled in this pathway</span>
          </div>
        ) : (
          <SelectPathwayButton slug={spec.slug} />
        )}
      </section>

      <Footer />
    </main>
  );
}
