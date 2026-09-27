import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function InHouseCoursePage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const courseId = Number(params.courseId);

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("is_in_house", true)
    .maybeSingle();

  if (!course) notFound();

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-2xl px-6 py-16">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Carinex Course
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">{course.title}</h1>
        {course.summary && <p className="mt-2 text-carinex-navy/70">{course.summary}</p>}

        <div className="mt-10 flex flex-col gap-8">
          {(lessons || []).map((lesson, i) => (
            <div key={lesson.id}>
              <h2 className="text-lg font-bold text-carinex-navy">
                {i + 1}. {lesson.title}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-carinex-navy/80">{lesson.content}</p>
            </div>
          ))}
        </div>

        <a
          href={`/dashboard/learning/inhouse/${courseId}/quiz`}
          className="mt-10 inline-block rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-carinex-white hover:bg-carinex-emerald/90"
        >
          Take the quiz →
        </a>
      </section>
      <Footer />
    </main>
  );
}
