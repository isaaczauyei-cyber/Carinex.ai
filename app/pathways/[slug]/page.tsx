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

  // --- Pre-signup: teaser only ---
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

        <div className="mt-10 flex flex-col gap-8">
          <div>
            <h2 className="text-lg font-bold text-carinex-navy">What it is</h2>
            <p className="mt-2 text-carinex-navy/70">{spec.whatItIs}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">Why it matters</h2>
            <p className="mt-2 text-carinex-navy/70">{spec.whyItMatters}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">Day to day</h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {spec.dayToDay.map((item, i) => (
                <li key={i} className="text-carinex-navy/70">· {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-carinex-navy/10 bg-carinex-navy/5 p-6">
            <h2 className="text-lg font-bold text-carinex-navy">Eligibility</h2>
            <div className="mt-3 flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-carinex-navy">National track</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {spec.eligibilityNational.map((item, i) => (
                    <li key={i} className="text-sm text-carinex-navy/70">· {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-carinex-navy">Global track</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {spec.eligibilityGlobal.map((item, i) => (
                    <li key={i} className="text-sm text-carinex-navy/70">· {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {extras?.globalCaveat && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-lg font-bold text-amber-900">Global track — read before applying abroad</h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/80">{extras.globalCaveat}</p>
            </div>
          )}

          {spec.certifications.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-carinex-navy">Certifications</h2>
              <div className="mt-3 flex flex-col gap-3">
                {spec.certifications.map((c) => (
                  <div key={c.name} className="rounded-lg border border-carinex-navy/10 p-4">
                    <p className="font-semibold text-carinex-navy">{c.name} · {c.body}</p>
                    <p className="mt-1 text-sm text-carinex-navy/60">{c.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-carinex-navy/10 p-6">
            <h2 className="text-lg font-bold text-carinex-navy">Salary</h2>
            <div className="mt-3 flex flex-col gap-3 text-sm text-carinex-navy/70">
              <p><span className="font-semibold text-carinex-navy">Nigeria: </span>{spec.salaryNational}</p>
              <p><span className="font-semibold text-carinex-navy">Global, realistic entry: </span>{spec.salaryGlobalRealistic}</p>
              <p><span className="font-semibold text-carinex-navy">Global, experienced: </span>{spec.salaryGlobalAspirational}</p>
            </div>
          </div>

          {(spec.employersNational.length > 0 || spec.employersGlobal.length > 0) && (
            <div>
              <h2 className="text-lg font-bold text-carinex-navy">Where you can work</h2>
              {spec.employersNational.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-carinex-navy">Nigeria</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {spec.employersNational.map((e) => (
                      <span key={e} className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs text-carinex-navy/70">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {spec.employersGlobal.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-carinex-navy">Global</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {spec.employersGlobal.map((e) => (
                      <div key={e.name} className="rounded-lg border border-carinex-navy/10 p-3">
                        <p className="text-sm font-semibold text-carinex-navy">{e.name}</p>
                        <p className="mt-0.5 text-sm text-carinex-navy/60">{e.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">Course pathway</h2>

            {courses.length === 0 ? (
              spec.coursePathway.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2">
                  {spec.coursePathway.map((c, i) => (
                    <div key={i} className="rounded-xl border border-carinex-navy/10 p-4 text-sm text-carinex-navy/70">
                      {c}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-carinex-navy/50">Courses for this specialization are coming soon.</p>
              )
            ) : nurseProfileId ? (
              <div className="mt-4 flex flex-col gap-3">
                {courses.map((course) => (
                  <CourseTracker
                    key={course.id}
                    nurseId={nurseProfileId}
                    course={course as never}
                    completion={completionByCourseId.get(course.id) || null}
                  />
                ))}
              </div>
            ) : null}
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
