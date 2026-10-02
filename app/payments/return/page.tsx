import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentReturnPage({ searchParams }: { searchParams: { reference?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const reference = searchParams.reference;
  if (!reference) return <main className="mx-auto max-w-xl px-6 py-24"><h1 className="text-2xl font-bold">Payment status unavailable</h1><Link href="/courses/23" className="mt-4 inline-block underline">Return to course</Link></main>;
  const { data: payment } = await supabase.from("payments").select("id, status").eq("paystack_ref", reference).eq("user_id", user.id).maybeSingle();
  const { data: enrollment } = payment ? await supabase.from("course_enrollments").select("status, has_interview_guide").eq("payment_id", payment.id).maybeSingle() : { data: null };
  return <main className="mx-auto max-w-xl px-6 py-24">
    <h1 className="text-2xl font-bold text-carinex-navy">{payment?.status === "success" ? "Payment received" : "Payment is being confirmed"}</h1>
    <p className="mt-3 text-carinex-navy/70">{enrollment?.status === "approved" ? "Your enrolment is approved. You can now access the course." : payment?.status === "success" ? "Your payment has been verified. Your enrolment is awaiting manual admin approval; course access is not active yet." : "Do not pay again yet. Paystack confirmation may take a moment. Refresh this page shortly or contact support if the status does not update."}</p>
    <Link href={enrollment?.status === "approved" ? "/dashboard/learning/inhouse/23/start" : "/courses/23"} className="mt-6 inline-block rounded-full bg-carinex-emerald px-6 py-3 text-sm font-semibold text-white">{enrollment?.status === "approved" ? "Open course" : "Back to course"}</Link>
  </main>;
}
