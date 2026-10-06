import Navbar from "@/components/Navbar";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function CourseSessionNavbar({ courseId }: { courseId: number }) {
  const admin = createAdminClient();

  const [{ data: course }, { data: modules }] = await Promise.all([
    admin.from("courses").select("id, title").eq("id", courseId).maybeSingle(),
    admin.from("course_modules").select("id, title, order_index").eq("course_id", courseId).order("order_index"),
  ]);

  if (!course) return <Navbar />;

  const moduleIds = (modules || []).map((m) => m.id);
  const [{ data: sections }, { data: questions }] = await Promise.all([
    moduleIds.length
      ? admin.from("module_sections").select("id, module_id, order_index, title").in("module_id", moduleIds).order("order_index")
      : Promise.resolve({ data: [] as any[] }),
    moduleIds.length
      ? admin.from("assessment_questions").select("id, module_id").in("module_id", moduleIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const [{ data: progress }, { data: quizAttempts }] = await Promise.all([
    admin.from("nurse_section_progress").select("section_id, status"),
    admin.from("nurse_quiz_attempts").select("module_id, passed").eq("course_id", courseId).eq("passed", true),
  ]);

  const doneSections = new Set((progress || []).filter((p) => p.status === "completed").map((p) => p.section_id));
  const passedModules = new Set((quizAttempts || []).map((q) => q.module_id));

  return (
    <Navbar
      courseSession={{
        title: course.title,
        modules: (modules || []).map((module) => ({
          id: module.id,
          orderIndex: module.order_index,
          title: module.title,
          items: [
            ...(sections || [])
              .filter((section) => section.module_id === module.id)
              .sort((a, b) => a.order_index - b.order_index)
              .map((section) => ({
                id: section.id,
                title: section.title,
                sectionType: section.section_type,
                href: `/dashboard/learning/inhouse/${courseId}/section/${section.id}`,
                kind: "section" as const,
                completed: doneSections.has(section.id),
              })),
            ...((questions || []).some((q) => q.module_id === module.id)
              ? [{
                  id: module.id,
                  title: "Module quiz",
                  href: `/dashboard/learning/inhouse/${courseId}/quiz/${module.id}`,
                  kind: "quiz" as const,
                  completed: passedModules.has(module.id),
                }]
              : []),
          ],
        })),
      }}
    />
  );
}
