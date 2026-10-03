import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminTabs from "@/components/AdminTabs";
import AdminJobForm from "@/components/AdminJobForm";

export const dynamic = "force-dynamic";

export default async function EditJobPage({ params }: { params: { jobId: string } }) {
  const supabase = await requireAdmin();

  const { data: job } = await supabase.from("jobs").select("*").eq("id", params.jobId).maybeSingle();
  if (!job) notFound();

  const { data: employers } = await supabase.from("employer_profiles").select("id, company_name").order("company_name");
  const { data: specializations } = await supabase.from("specializations").select("id, name").order("name");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-2xl px-6 py-12">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Admin</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">Edit job</h1>

        <AdminTabs />

        <div className="mt-8">
          <AdminJobForm
            jobId={job.id}
            initialValues={job}
            employers={employers || []}
            specializations={specializations || []}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
