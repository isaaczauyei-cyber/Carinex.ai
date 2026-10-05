import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";
import AddInHouseCourseForm from "@/components/AddInHouseCourseForm";

export const dynamic = "force-dynamic";

export default async function NewInHouseCoursePage() {
  const supabase = await requireAdmin();
  const { data: specializations, error } = await supabase.from("specializations").select("id, name").order("name");
  if (error) throw new Error(`Unable to load specializations: ${error.message}`);

  return <main><Navbar /><section className="mx-auto max-w-3xl px-6 py-12">
    <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
    <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">Add In-House Course</h1>
    <AdminTabs />
    <div className="mt-8"><AddInHouseCourseForm specializations={specializations || []} /></div>
  </section><Footer /></main>;
}
