import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase.from("payments").select("id, status").eq("paystack_ref", reference).eq("user_id", user.id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  const { data: enrollment } = await supabase.from("course_enrollments").select("status, has_interview_guide").eq("payment_id", data.id).maybeSingle();
  return NextResponse.json({ paymentStatus: data.status, enrollmentStatus: enrollment?.status ?? null, hasInterviewGuide: enrollment?.has_interview_guide ?? false });
}
