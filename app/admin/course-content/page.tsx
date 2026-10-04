import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";
import ExternalCourseManager from "@/components/ExternalCourseManager";

export default async function AdminExternalCourseContentPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data: courses, error: coursesError }, { data: specializations, error: specsError }] = await Promise.all([
    admin.from("courses").select("*").or("is_in_house.is.null,is_in_house.eq.false").order("title"),
    admin.from("specializations").select("id, name, track_type").order("name"),
  ]);

  const courseIds = (courses || []).map((course) => course.id);
  const { data: syllabus } = courseIds.length
    ? await admin.from("course_syllabus_items").select("id, course_id, order_index, title, description").in("course_id", courseIds).order("order_index")
    : { data: [] };

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">External Course Content</h1>
        <p className="mt-2 max-w-2xl text-carinex-navy/70">Add and update external course listings, provider details, links, descriptions and syllabus items without editing Supabase manually.</p>
        <AdminTabs />
        {(coursesError || specsError) ? (
          <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load course content: {coursesError?.message || specsError?.message}</p>
        ) : (
          <ExternalCourseManager courses={courses || []} specializations={specializations || []} syllabus={syllabus || []} />
        )}
      </section>
      <Footer />
    </main>
  );
}
