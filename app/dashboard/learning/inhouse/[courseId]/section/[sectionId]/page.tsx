
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCourseApproval } from "@/lib/course-access";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCourseStructure,
  getProgress,
  flattenSequence,
} from "@/lib/course-content";
import CoursePlayerHeader from "@/components/CoursePlayerHeader";
import SectionActions from "@/components/SectionActions";
import PdfViewer from "@/components/PdfViewer";
import RichText from "@/components/RichText";

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

  if (!Number.isInteger(courseId)) notFound();

  await requireCourseApproval(user.id, courseId);

  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("title")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) notFound();

  const { data: section } = await admin
    .from("module_sections")
    .select("*")
    .eq("id", params.sectionId)
    .maybeSingle();

  if (!section) notFound();

  // Confirm this section belongs to a module in this course.
  const { data: module } = await admin
    .from("course_modules")
    .select("id")
    .eq("id", section.module_id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!module) notFound();

  const { data: progressRow } = await admin
    .from("nurse_section_progress")
    .select("status, submission_text")
    .eq("nurse_id", profile.id)
    .eq("section_id", section.id)
    .maybeSingle();

  const structure = await getCourseStructure(courseId);

  const {
    completedSectionIds,
    passedModuleIds,
  } = await getProgress(profile.id, courseId);

  const sequence = flattenSequence(structure);

  const currentIndex = sequence.findIndex(
    (item) => item.type === "section" && item.id === section.id
  );

  const next = currentIndex >= 0
    ? sequence[currentIndex + 1]
    : null;

  const config = (section.config || {}) as Record<string, unknown>;

  const filePath =
    typeof config.file_url === "string"
      ? config.file_url
      : null;

  const mediaType =
    typeof config.media_type === "string"
      ? config.media_type.toLowerCase()
      : "";

  let signedFileUrl: string | null = null;
  let fileError: string | null = null;

  if (
    (section.section_type === "course_material" ||
      section.section_type === "career_application") &&
    filePath
  ) {
    const { data, error } = await admin.storage
      .from("course-content")
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error("Course file signed URL error:", error.message);
      fileError = "The course file could not be loaded. Please try again later.";
    } else {
      signedFileUrl = data?.signedUrl || null;

      if (!signedFileUrl) {
        fileError = "The course file is currently unavailable.";
      }
    }
  }

  const isAudio = mediaType === "audio";
  const isPdf =
    mediaType === "pdf" ||
    filePath?.toLowerCase().endsWith(".pdf") ||
    false;

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

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-carinex-navy">
          {section.title}
        </h1>

        {section.instructions && (
          <p className="mt-3 leading-relaxed text-carinex-navy/70">
            {section.instructions}
          </p>
           <div className="mt-4">
            <RichText text={section.instructions} />
          </div>
        )}

        {(section.section_type === "course_material" ||
          section.section_type === "career_application") && (
          <div className="mt-6">
            {fileError && (
              <p className="rounded-lg bg-red-50 p-4 text-red-700">
                {fileError}
              </p>
            )}

            {!filePath && (
              <p className="rounded-lg bg-gray-50 p-4 text-gray-600">
                No file has been uploaded for this section yet.
              </p>
            )}

            {signedFileUrl && isAudio && (
              <audio
                controls
                preload="metadata"
                src={signedFileUrl}
                className="w-full"
              />
            )}

            {signedFileUrl && !isAudio && isPdf && (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <PdfViewer fileUrl={signedFileUrl} />

                <div className="border-t bg-gray-50 p-3">
                  <a
                    href={signedFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-carinex-navy underline"
                  >
                  </a>
                </div>
              </div>
            )}

            {signedFileUrl && !isAudio && !isPdf && (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <PdfViewer fileUrl={signedFileUrl} />
                <div className="border-t bg-gray-50 p-3">
                  <a
                    href={signedFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-carinex-navy underline"
                  >
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {section.section_type === "key_takeaways" && (
          <div className="mt-6 flex flex-col gap-3">
            <RichText text={config.body as string} />
          </div>
            {((config.body as string) || "")
              .split(/\n\s*\n/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, index) => (
                <p
                  key={index}
                  className="leading-relaxed text-carinex-navy/80"
                >
                  {paragraph}
                </p>
              ))}
          </div>
        )}
      </div>

      <SectionActions
        nurseId={profile.id}
        section={{
          id: section.id,
          section_type: section.section_type,
          config,
        }}
        initialProgress={progressRow || null}
        nextHref={
          next
            ? next.type === "section"
              ? `/dashboard/learning/inhouse/${courseId}/section/${next.id}`
              : `/dashboard/learning/inhouse/${courseId}/quiz/${next.moduleId}`
            : "/dashboard/learning"
        }
      />
    </main>
  );
}
