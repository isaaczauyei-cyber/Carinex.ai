import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCourseApproval } from "@/lib/course-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseStructure, getProgress, flattenSequence } from "@/lib/course-content";
import CoursePlayerHeader from "@/components/CoursePlayerHeader";
import SectionActions from "@/components/SectionActions";

export default async function SectionPage({
  params,
}: {
  params: { courseId: string; sectionId: string };
}) {
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
  await requireCourseApproval(user.id, courseId);
  const admin = createAdminClient();

  const { data: course } = await admin.from("courses").select("title").eq("id", courseId).maybeSingle();
  if (!course) notFound();

  const { data: section } = await admin
    .from("module_sections")
    .select("*")
    .eq("id", params.sectionId)
    .maybeSingle();
  if (!section) notFound();

  const { data: progressRow } = await admin
    .from("nurse_section_progress")
    .select("status, submission_text")
    .eq("nurse_id", profile.id)
    .eq("section_id", section.id)
    .maybeSingle();

  const structure = await getCourseStructure(courseId);
  const { completedSectionIds, passedModuleIds } = await getProgress(profile.id, courseId);
  const sequence = flattenSequence(structure);
  const currentIndex = sequence.findIndex((s) => s.type === "section" && s.id === section.id);
  const next = currentIndex >= 0 ? sequence[currentIndex + 1] : null;

  const config = (section.config || {}) as Record<string, unknown>;

  let signedFileUrl: string | null = null;
  if ((section.section_type === "course_material" || section.section_type === "career_application") && config.file_url) {
    const { data: signed } = await admin.storage
      .from("course-content")
      .createSignedUrl(config.file_url as string, 3600);
    signedFileUrl = signed?.signedUrl || null;
  }

  return (
    <main className="min-h-screen bg-white">
      <CoursePlayerHeader
        courseTitle={course.title}
        courseId={courseId}
        structure={structure}
        completedSectionIds={completedSectionIds}
        passedModuleIds={passedModuleIds}
        currentSectionId={section.id}
      />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold text-carinex-navy">{section.title}</h1>
        {section.instructions && (
          <p className="mt-3 leading-relaxed text-carinex-navy/70">{section.instructions}</p>
        )}

        {section.section_type === "course_material" && signedFileUrl && (
          <div className="mt-6">
            {config.media_type === "audio" ? (
              <audio controls src={signedFileUrl} className="w-full" />
            ) : (
              <iframe src={signedFileUrl} className="h-[70vh] w-full rounded-lg border border-carinex-navy/10" />
            )}
          </div>
        )}

        {section.section_type === "key_takeaways" && (
          <div className="mt-6 flex flex-col gap-3">
            {((config.body as string) || "")
              .split(/\n\s*\n/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, i) => (
                <p key={i} className="leading-relaxed text-carinex-navy/80">
                  {p}
                </p>
              ))}
          </div>
        )}

        {section.section_type === "career_application" && signedFileUrl && (
          <div className="mt-6">
            <iframe src={signedFileUrl} className="h-[70vh] w-full rounded-lg border border-carinex-navy/10" />
          </div>
        )}
      </div>

      <SectionActions
        nurseId={profile.id}
        section={{ id: section.id, section_type: section.section_type, config }}
        initialProgress={progressRow || null}
        nextHref={
          next
            ? next.type === "section"
              ? `/dashboard/learning/inhouse/${courseId}/section/${next.id}`
              : `/dashboard/learning/inhouse/${courseId}/quiz/${next.moduleId}`
            : `/dashboard/learning`
        }
      />
    </main>
  );
}
