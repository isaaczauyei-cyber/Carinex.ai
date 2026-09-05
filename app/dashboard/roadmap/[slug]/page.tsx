import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getRoadmap } from "@/lib/roadmap";

type Course = { id: string; title: string; [key: string]: unknown };

const courseStatusStyles: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-carinex-emerald/10 text-carinex-emerald" },
  verification_pending: { label: "Pending review", className: "bg-amber-50 text-amber-700" },
  in_progress: { label: "In progress", className: "bg-blue-50 text-blue-700" },
};
const notStartedStyle = { label: "Not started", className: "bg-carinex-navy/5 text-carinex-navy/50" };

function dedupeCourses(courses: Course[], completionByCourseId: Map<string, { status: string }>) {
  const seen = new Map<string, Course>();
  for (const c of courses) {
    const existing = seen.get(c.title);
    if (!existing) {
      seen.set(c.title, c);
      continue;
    }
    const existingHasProgress = completionByCourseId.has(existing.id);
    const currentHasProgress = completionByCourseId.has(c.id);
    if (!existingHasProgress && currentHasProgress) {
      seen.set(c.title, c);
    }
  }
  return Array.from(seen.values());
}

export default async function RoadmapPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const roadmap = await getRoadmap(user.id, profile.id, params.slug);
  if (!roadmap) notFound();

  const { spec, skillsHave, skillsGap, courses, completionByCourseId, certifications, milestones } = roadmap;
  const dedupedCourses = dedupeCourses(courses as Course[], completionByCourseId);

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <a href="/dashboard" className="text-sm font-semibold text-carinex-emerald hover:underline">
          ← Dashboard
        </a>

        <span className="mt-4 block text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Career Roadmap
        </span>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-carinex-navy">{spec.title}</h1>

        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">Milestones</h2>
          <div className="mt-3 flex flex-col gap-2">
            {milestones.map((m) => (
              <div key={m.label} className="flex items-center gap-3 rounded-lg border border-carinex-navy/10 p-3">
                <span className={`text-lg ${m.done ? "text-carinex-emerald" : "text-carinex-navy/20"}`}>
                  {m.done ? "✓" : "○"}
                </span>
                <span className={`text-sm ${m.done ? "text-carinex-navy" : "text-carinex-navy/50"}`}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">Current skills for this pathway</h2>
          {skillsHave.length === 0 ? (
            <p className="mt-2 text-sm text-carinex-navy/50">
              None of your tagged skills match this pathway&apos;s core skills yet.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {skillsHave.map((s) => (
                <span key={s} className="rounded-full bg-carinex-emerald/10 px-3 py-1 text-xs text-carinex-emerald">
                  {s}
                </span>
              ))}
            </div>
          )}

          {skillsGap.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-semibold text-carinex-navy/70">Skills gap</h3>
              <p className="mt-1 text-sm text-carinex-navy/50">
                Add these to your profile once you&apos;ve built them, or work on them through the courses below.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {skillsGap.map((s) => (
                  <span key={s} className="rounded-full border border-dashed border-carinex-navy/20 px-3 py-1 text-xs text-carinex-navy/50">
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">Recommended courses</h2>
          {dedupedCourses.length === 0 ? (
            <p className="mt-2 text-sm text-carinex-navy/50">No courses available for this pathway yet.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dedupedCourses.map((c) => {
                const completion = completionByCourseId.get(c.id);
                const style = completion?.status ? courseStatusStyles[completion.status] || notStartedStyle : notStartedStyle;
                return (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-xl border border-carinex-navy/10 bg-white p-4 transition hover:border-carinex-emerald/40 hover:shadow-sm"
                  >
                    <span className="text-sm font-semibold text-carinex-navy">{c.title}</span>
                    <span className={`mt-3 inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
                      {style.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <a href={`/pathways/${spec.slug}`} className="mt-4 inline-block text-sm font-semibold text-carinex-emerald hover:underline">
            Go to course pathway →
          </a>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">Certifications</h2>
          {certifications.length === 0 ? (
            <p className="mt-2 text-sm text-carinex-navy/50">No external certifications added yet.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              {certifications.map((c) => (
                <div key={c.id} className="rounded-lg border border-carinex-navy/10 p-3 text-sm text-carinex-navy">
                  {c.title} · {c.issuing_organization}
                </div>
              ))}
            </div>
          )}
          <a href="/dashboard/profile" className="mt-3 inline-block text-sm font-semibold text-carinex-emerald hover:underline">
            Add a certification →
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}
