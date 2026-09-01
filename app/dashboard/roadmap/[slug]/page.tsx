import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { getRoadmap } from "@/lib/roadmap";

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

        {/* Milestones */}
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

        {/* Skills */}
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

        {/* Courses */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-carinex-navy">Recommended courses</h2>
          {courses.length === 0 ? (
            <p className="mt-2 text-sm text-carinex-navy/50">No courses available for this pathway yet.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              {courses.map((c) => {
                const completion = completionByCourseId.get(c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-carinex-navy/10 p-3">
                    <span className="text-sm text-carinex-navy">{c.title}</span>
                    <span className="text-xs font-semibold text-carinex-navy/50">
                      {completion?.status === "completed" ? "Completed" : completion?.status === "verification_pending" ? "Pending review" : completion?.status === "in_progress" ? "In progress" : "Not started"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <a href={`/pathways/${spec.slug}`} className="mt-3 inline-block text-sm font-semibold text-carinex-emerald hover:underline">
            Go to course pathway →
          </a>
        </div>

        {/* Certifications */}
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

        {/* Portfolio — honest gap */}
        <div className="mt-10 rounded-xl border border-dashed border-carinex-navy/20 p-5">
          <h2 className="text-lg font-bold text-carinex-navy/70">Portfolio requirements</h2>
          <p className="mt-2 text-sm text-carinex-navy/50">
            Not yet defined for this pathway — this section will be added once
            specific portfolio requirements are established.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
