import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminVerifyLicenseButton from "@/components/AdminVerifyLicenseButton";
import AdminCourseReviewRow from "@/components/AdminCourseReviewRow";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const supabase = await requireAdmin();

  const { data: profile } = await supabase
    .from("nurse_profiles")
    .select("*, users(full_name, phone)")
    .eq("id", params.id)
    .maybeSingle();

  if (!profile) notFound();

  const userInfo = profile.users as unknown as { full_name: string; phone: string | null };

  const [{ data: experience }, { data: certifications }, { data: completions }] = await Promise.all([
    supabase.from("nurse_experience").select("*").eq("nurse_id", profile.id),
    supabase.from("nurse_certifications").select("*").eq("nurse_id", profile.id),
    supabase
      .from("nurse_course_completions")
      .select("*, courses(title)")
      .eq("nurse_id", profile.id),
  ]);

  const pendingCompletions = (completions || []).filter((c) => c.status === "verification_pending");

  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-12">
        <a href="/admin/users" className="text-sm font-semibold text-carinex-emerald hover:underline">
          ← All users
        </a>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-sm text-carinex-navy/50">{profile.nurse_code}</p>
            <h1 className="text-2xl font-bold tracking-tight text-carinex-navy">{userInfo?.full_name}</h1>
          </div>
          <AdminVerifyLicenseButton nurseProfileId={profile.id} verified={profile.license_verified || false} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-carinex-navy/10 p-4">
            <p className="text-xs font-semibold uppercase text-carinex-navy/50">License status</p>
            <p className="mt-1 text-carinex-navy">{profile.license_status || "Not set"}</p>
          </div>
          <div className="rounded-xl border border-carinex-navy/10 p-4">
            <p className="text-xs font-semibold uppercase text-carinex-navy/50">NMCN registration</p>
            <p className="mt-1 text-carinex-navy">{profile.nmcn_registration_no || "Not provided"}</p>
          </div>
          <div className="rounded-xl border border-carinex-navy/10 p-4">
            <p className="text-xs font-semibold uppercase text-carinex-navy/50">Track</p>
            <p className="mt-1 text-carinex-navy">
              {[profile.track_national && "National", profile.track_global && "Global"].filter(Boolean).join(", ") || "Not set"}
            </p>
          </div>
          <div className="rounded-xl border border-carinex-navy/10 p-4">
            <p className="text-xs font-semibold uppercase text-carinex-navy/50">Career goal</p>
            <p className="mt-1 text-carinex-navy">{profile.career_goal || "Not set"}</p>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-carinex-navy">Bio</h2>
            <p className="mt-2 text-carinex-navy/70">{profile.bio}</p>
          </div>
        )}

        {pendingCompletions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-carinex-navy">Pending course reviews</h2>
            <div className="mt-3 flex flex-col gap-3">
              {pendingCompletions.map((c) => (
                <AdminCourseReviewRow
                  key={c.id}
                  completionId={c.id}
                  courseTitle={(c.courses as unknown as { title: string })?.title || "Course"}
                  proofDocUrl={c.proof_doc_url}
                />
              ))}
            </div>
          </div>
        )}

        {(experience || []).length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-carinex-navy">Experience</h2>
            <div className="mt-3 flex flex-col gap-2">
              {experience!.map((e) => (
                <div key={e.id} className="rounded-lg border border-carinex-navy/10 p-3 text-sm">
                  <p className="font-semibold text-carinex-navy">{e.title} · {e.organization}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(certifications || []).length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-carinex-navy">Certifications</h2>
            <div className="mt-3 flex flex-col gap-2">
              {certifications!.map((c) => (
                <div key={c.id} className="rounded-lg border border-carinex-navy/10 p-3 text-sm">
                  <p className="font-semibold text-carinex-navy">{c.title} · {c.issuing_organization}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
