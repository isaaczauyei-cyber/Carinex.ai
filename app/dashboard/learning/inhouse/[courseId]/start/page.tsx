import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getCourseStructure, getProgress, flattenSequence } from "@/lib/course-content";

export default async function StartCoursePage({ params }: { params: { courseId: string } }) {
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

  const courseId = Number(params.courseId);
  const structure = await getCourseStructure(courseId);
  const sequence = flattenSequence(structure);

  if (sequence.length === 0) {
    return (
      <main>
        <Navbar />
        <section className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="text-2xl font-bold text-carinex-navy">Course content is on its way</h1>
          <p className="mt-3 text-carinex-navy/70">
            The lessons for this course are still being prepared. Check back soon.
          </p>
          <Link
            href="/dashboard/learning"
            className="mt-6 inline-block rounded-full bg-carinex-emerald px-6 py-2.5 text-sm font-semibold text-carinex-white"
          >
            Back to Learning Hub
          </Link>
        </section>
      </main>
    );
  }

  const { completedLessonIds, passedModuleIds } = await getProgress(profile.id, courseId);

  const firstUnfinished = sequence.find((s) =>
    s.type === "lesson" ? !completedLessonIds.has(s.id) : !passedModuleIds.has(s.id)
  );
  const target = firstUnfinished || sequence[0];

  redirect(
    target.type === "lesson"
      ? `/dashboard/learning/inhouse/${courseId}/lesson/${target.id}`
      : `/dashboard/learning/inhouse/${courseId}/quiz/${target.moduleId}`
  );
}
