import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import CourseEnrollAction from "@/components/CourseEnrollAction";
import RichText from "@/components/RichText";
import { formatNaira } from "@/lib/course-pricing";
import ExternalCertificateSubmission from "@/components/ExternalCertificateSubmission";

export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const supabase = await createClient();
  const courseId = Number(params.courseId);
  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
  if (!course) notFound();
  if (course.is_in_house && course.is_published !== true) notFound();
  const { data: syllabus } = await supabase.from("course_syllabus_items").select("*").eq("course_id", courseId).order("order_index");
  const { data: { user } } = await supabase.auth.getUser();
  let nurseId: string | null = null;
  let completion: { id: string; status: string; proof_doc_url?: string | null } | null = null;
  let enrollmentStatus: string | null = null;
  let trialExpired = false;
  let existingAccessType: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("nurse_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (profile) {
      nurseId = profile.id;
      const { data: existing } = await supabase.from("nurse_course_completions").select("id, status, proof_doc_url").eq("nurse_id", profile.id).eq("course_id", courseId).maybeSingle();
      completion = existing;
      if (course.is_in_house) {
        const { data: enrollment } = await supabase.from("course_enrollments").select("status, access_type, trial_expires_at").eq("user_id", user.id).eq("course_id", courseId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        enrollmentStatus = enrollment?.status || null;
        existingAccessType = enrollment?.access_type || null;
        trialExpired = enrollment?.access_type === "trial" && Boolean(enrollment?.trial_expires_at) && new Date(enrollment!.trial_expires_at) <= new Date();
      }
    }
  }
  const courseOnlyPrice = Number(course.price_course_only || 0);
  const coursePlusGuidePrice = course.price_course_plus_guide == null ? null : Number(course.price_course_plus_guide);
  const isFreeCourse = course.is_free === true || (!course.is_in_house && String(course.price_display || "").trim().toLowerCase() === "free");
  const hasPaidPricing = course.is_in_house && !isFreeCourse && courseOnlyPrice > 0;
  const priceLine = isFreeCourse
    ? (course.is_in_house && course.trial_enabled === true ? "3-day free trial" : "Free")
    : hasPaidPricing
      ? coursePlusGuidePrice && coursePlusGuidePrice > 0
        ? `${formatNaira(courseOnlyPrice)} course / ${formatNaira(coursePlusGuidePrice)} with interview guide`
        : formatNaira(courseOnlyPrice)
      : course.price_display || "";
  const descriptionText = course.description_long || course.summary || "";

  return <main className="min-h-screen bg-[#F4F7F8] text-carinex-navy">
    <Navbar />
    <section className="bg-gradient-to-br from-carinex-navy via-[#123B46] to-carinex-emerald text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] lg:gap-12 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <a href="/dashboard/learning" className="inline-flex items-center gap-2 text-sm font-medium text-white/75 transition hover:text-white">← Back to Learning Hub</a>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {course.is_in_house && <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">Carinex Original</span>}
            {course.duration_display && <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">◷ {course.duration_display}</span>}
            {course.level && <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">◎ {course.level}</span>}
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{course.title}</h1>
          <p className="mt-4 text-base font-medium text-white/80 sm:text-lg">{course.provider}</p>
          {course.summary && descriptionText !== course.summary && <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">{course.summary}</p>}
        </div>
        <div className="w-full max-w-md md:justify-self-end"><div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-3 shadow-xl backdrop-blur-sm">
          {course.image_url ? <img src={course.image_url} alt={course.title} className="h-44 w-full rounded-xl object-cover sm:h-52 md:h-44" /> : <div className="flex h-44 items-center justify-center rounded-xl bg-white/10 text-5xl" aria-hidden="true">✦</div>}
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/65">Course overview</p><p className="mt-1 text-sm font-semibold">{course.title}</p>
        </div></div>
      </div>
    </section>
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
      <div className="min-w-0 space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald" aria-hidden="true">▤</span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-carinex-emerald">ABOUT THIS COURSE</p><h2 className="mt-1 text-xl font-bold sm:text-2xl">Course overview</h2></div></div>
          <div className="mt-5">{descriptionText ? <RichText text={descriptionText} /> : <p className="text-sm leading-6 text-slate-500">Course description will be available soon.</p>}</div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-carinex-emerald" aria-hidden="true">☷</span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-carinex-emerald">COURSE CONTENT</p><h2 className="mt-1 text-xl font-bold sm:text-2xl">Syllabus</h2></div></div>
          {syllabus && syllabus.length > 0 ? <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">{syllabus.map((item, i) => <div key={item.id} className="flex gap-4 p-4 sm:p-5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">{String(i + 1).padStart(2, "0")}</div><div className="min-w-0 flex-1"><h3 className="font-semibold">{item.title}</h3>{item.description && <div className="mt-2"><RichText text={item.description} /></div>}</div></div>)}</div> : <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">The course outline has not been added yet.</p>}
        </section>
      </div>
      <aside className="min-w-0 lg:sticky lg:top-6"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-carinex-navy to-carinex-emerald px-5 py-4 text-white"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">ENROLMENT</p><p className="mt-1 text-2xl font-extrabold">{priceLine || "Course access"}</p><p className="mt-1 text-xs text-white/75">{isFreeCourse ? "Start learning at no course cost" : "Review the available access options below"}</p></div>
        <div className="p-5"><div className="mb-5 space-y-3 text-sm text-slate-600">
          {course.provider && <div className="flex items-start gap-3"><span className="text-carinex-emerald" aria-hidden="true">✓</span><span>Provided by <strong className="font-semibold text-carinex-navy">{course.provider}</strong></span></div>}
          {course.duration_display && <div className="flex items-start gap-3"><span className="text-carinex-emerald" aria-hidden="true">✓</span><span>{course.duration_display} estimated duration</span></div>}
          {course.level && <div className="flex items-start gap-3"><span className="text-carinex-emerald" aria-hidden="true">✓</span><span>{course.level} level</span></div>}
          {course.is_in_house && <div className="flex items-start gap-3"><span className="text-carinex-emerald" aria-hidden="true">✓</span><span>Learn directly on Carinex</span></div>}
        </div>
        <CourseEnrollAction courseId={course.id} isInHouse={course.is_in_house} isFree={isFreeCourse} isTrial={course.is_in_house && (course.trial_enabled === true || existingAccessType === "trial")} trialExpired={trialExpired} affiliateLink={course.affiliate_link} nurseId={nurseId} completionStatus={completion?.status || null} enrollmentStatus={enrollmentStatus} pricing={{ courseOnly: courseOnlyPrice, coursePlusGuide: coursePlusGuidePrice }} />
        {!course.is_in_house && user && nurseId && completion && completion.status !== "completed" && <div className="mt-6 border-t border-slate-200 pt-6"><ExternalCertificateSubmission courseId={courseId} courseTitle={course.title} initialStatus={completion.status} existingProofPath={completion.proof_doc_url || null} /></div>}
        {!course.is_in_house && <p className="mt-4 text-center text-xs leading-5 text-slate-500">Carinex does not automatically receive progress from external providers. After completing the course, return here and submit your certificate for review.</p>}
        {course.is_in_house && <p className="mt-4 text-center text-xs leading-5 text-slate-500">Your in-house course access and progress are managed through your Carinex account.</p>}</div>
      </div></aside>
    </div>
    <Footer />
  </main>;
}
