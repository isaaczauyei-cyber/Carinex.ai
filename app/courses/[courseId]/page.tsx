import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import CourseEnrollAction from "@/components/CourseEnrollAction";

export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient();
  const courseId = Number(params.courseId);

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) notFound();

  const { data: syllabus } = await supabase
    .from("course_syllabus_items")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nurseId: string | null = null;
  let completion: { id: string; status: string } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("nurse_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      nurseId = profile.id;
      const { data: existing } = await supabase
        .from("nurse_course_completions")
        .select("id, status")
        .eq("nurse_id", profile.id)
        .eq("course_id", courseId)
        .maybeSingle();
      completion = existing;
    }
  }

  const descriptionParagraphs = (course.description_long || course.summary || "")
    .split(/\n\s*\n/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <main>
      <Navbar />

      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-carinex-navy to-carinex-emerald">
        {course.image_url && (
          <img
            src={course.image_url}
            alt={course.title}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        )}
      </div>

      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex flex-wrap items-center gap-2">
          {course.is_in_house && (
            <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/60">
              Carinex Original
            </span>
          )}
          {course.duration_display && (
            <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs text-carinex-navy/70">
              ⏱ {course.duration_display}
            </span>
          )}
          {course.level && (
            <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs text-carinex-navy/70">
              🎯 {course.level}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-carinex-navy">{course.title}</h1>
        <p className="mt-1 text-carinex-navy/60">
          {course.provider}
          {course.price_display ? ` · ${course.price_display}` : ""}
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {descriptionParagraphs.length > 0 ? (
            descriptionParagraphs.map((para: string, i: number) => (
              <p key={i} className="leading-relaxed text-carinex-navy/80">
                {para}
              </p>
            ))
          ) : (
            <p className="text-carinex-navy/50">No description available yet.</p>
          )}
        </div>

        {syllabus && syllabus.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-carinex-navy">Syllabus</h2>
            <div className="mt-4 flex flex-col gap-3">
              {syllabus.map((item, i) => (
                <div key={item.id} className="rounded-lg border border-carinex-navy/10 p-4">
                  <p className="font-semibold text-carinex-navy">
                    {i + 1}. {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-sm leading-relaxed text-carinex-navy/70">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <CourseEnrollAction
            courseId={course.id}
            isInHouse={course.is_in_house}
            affiliateLink={course.affiliate_link}
            nurseId={nurseId}
            completionStatus={completion?.status || null}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
