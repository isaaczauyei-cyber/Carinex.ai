import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SelectPathwayButton from "@/components/SelectPathwayButton";
import CourseTracker from "@/components/CourseTracker";
import { getSpecializationBySlug } from "@/lib/data";
import { specializationExtras, tierStyles } from "@/lib/specialization-extras";
import { createClient } from "@/lib/supabase/server";

const trackLabel: Record<string, string> = {
  national: "Nigeria-based",
  global: "International",
  both: "Nigeria + International",
};

const workModeLabel: Record<string, string> = {
  sync: "Real-time (scheduled calls/video)",
  async: "Flexible (self-paced, no fixed hours)",
  mixed: "Mix of scheduled and flexible work",
};

export default async function PathwayDetailPage({ params }: { params: { slug: string } }) {
  const spec = getSpecializationBySlug(params.slug);
  if (!spec) notFound();

  const extras = specializationExtras[params.slug];
  const supabase = await createClient();

  const { data: dbSpec } = await supabase
    .from("specializations")
    .select("id")
    .eq("slug", params.slug)
    .maybeSingle();

  const { data: courses } = dbSpec
    ? await supabase.from("courses").select("*").eq("specialization_id", dbSpec.id)
    : { data: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let completionByCourseId = new Map();
  let nurseProfileId: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("nurse_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      nurseProfileId = profile.id;
      const { data: completions } = await supabase
        .from("nurse_course_completions")
        .select("*")
        .eq("nurse_id", profile.id);
      completionByCourseId = new Map((completions || []).map((c) => [c.course_id, c]));
    }
  }

  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <a href="/pathways" className="text-sm font-semibold text-carinex-emerald hover:underline">
          ← All pathways
        </a>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
            {trackLabel[spec.track]}
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
            <p className="mt-2 text-carinex-navy/70">{spec.dayToDay}</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">Work mode</h2>
            <p className="mt-2 text-carinex-navy/70">{workModeLabel[spec.workMode]}</p>
          </div>

          {/* Eligibility shown before the course list, deliberately */}
          <div className="rounded-2xl border border-carinex-navy/10 bg-carinex-navy/5 p-6">
            <h2 className="text-lg font-bold text-carinex-navy">Eligibility</h2>
            <p className="mt-2 text-carinex-navy/70">{spec.eligibilityGate}</p>
          </div>

          {extras?.globalCaveat && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-lg font-bold text-amber-900">Global track — read before applying abroad</h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/80">{extras.globalCaveat}</p>
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">Course pathway</h2>

            {!courses || courses.length === 0 ? (
              <p className="mt-3 text-sm text-carinex-navy/50">
                Courses for this specialization are coming soon.
              </p>
            ) : nurseProfileId ? (
              <div className="mt-4 flex flex-col gap-3">
                {courses.map((course) => (
                  <CourseTracker
                    key={course.id}
                    nurseId={nurseProfileId}
                    course={course}
                    completion={completionByCourseId.get(course.id) || null}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {courses.map((course, i) => (
                  <div key={course.id} className="rounded-xl border border-carinex-navy/10 p-5">
                    <p className="text-xs font-semibold text-carinex-navy/40">Step {i + 1}</p>
                    <p className="mt-1 font-semibold text-carinex-navy">{course.title}</p>
                    <p className="text-sm text-carinex-navy/60">{course.provider}</p>
                  </div>
                ))}
                <p className="mt-1 text-sm text-carinex-navy/50">
                  Sign up to track your progress through these courses.
                </p>
              </div>
            )}
          </div>
        </div>

        <SelectPathwayButton slug={spec.slug} />
      </section>

      <Footer />
    </main>
  );
}
