import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import AdminModuleEditor from "@/components/AdminModuleEditor";

export default async function AdminModuleEditPage({
  params,
}: {
  params: { courseId: string; moduleId: string };
}) {
  const supabase = await requireAdmin();

  const { data: module } = await supabase
    .from("course_modules")
    .select("*")
    .eq("id", params.moduleId)
    .maybeSingle();

  const { data: sections } = await supabase
    .from("module_sections")
    .select("*")
    .eq("module_id", params.moduleId)
    .order("order_index");

  const { data: questions } = await supabase
    .from("assessment_questions")
    .select("*")
    .eq("module_id", params.moduleId)
    .order("order_index");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href={`/admin/courses/${params.courseId}`}
          className="text-sm font-semibold text-carinex-emerald hover:underline"
        >
          ← All modules
        </Link>
        <span className="mt-4 block text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Editing module
        </span>

        <div className="mt-8">
          <AdminModuleEditor
            module={module}
            initialSections={sections || []}
            initialQuestions={questions || []}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
