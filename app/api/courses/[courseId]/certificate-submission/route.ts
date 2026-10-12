import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { courseId: string } }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Please sign in to submit a certificate." }, { status: 401 });

  const courseId = Number(params.courseId);
  if (!Number.isInteger(courseId) || courseId <= 0) return NextResponse.json({ error: "Invalid course." }, { status: 400 });

  const body = await request.json().catch(() => null);
  const proofPath = typeof body?.proofPath === "string" ? body.proofPath : "";
  if (!proofPath || !proofPath.startsWith(`${user.id}/${courseId}/`) || proofPath.includes("..")) {
    return NextResponse.json({ error: "Invalid certificate upload path." }, { status: 400 });
  }

  const { data: course, error: courseError } = await supabase.from("courses").select("id, is_in_house").eq("id", courseId).maybeSingle();
  if (courseError || !course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  if (course.is_in_house === true) return NextResponse.json({ error: "Certificate submission is only available for external courses." }, { status: 400 });

  const { data: profile, error: profileError } = await supabase.from("nurse_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (profileError || !profile) return NextResponse.json({ error: "Complete your learner profile before submitting a certificate." }, { status: 400 });

  const { data: completion, error: lookupError } = await supabase.from("nurse_course_completions").select("id, status").eq("nurse_id", profile.id).eq("course_id", courseId).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Could not check your course enrollment." }, { status: 500 });
  if (!completion) return NextResponse.json({ error: "Enroll in this external course from Carinex before submitting its certificate." }, { status: 409 });
  if (completion.status === "completed") return NextResponse.json({ error: "This course is already marked completed." }, { status: 409 });

  const { error: updateError } = await supabase.from("nurse_course_completions").update({ status: "verification_pending", proof_doc_url: proofPath }).eq("id", completion.id).eq("nurse_id", profile.id);
  if (updateError) return NextResponse.json({ error: updateError.message || "Could not submit the certificate for review." }, { status: 500 });

  return NextResponse.json({ ok: true, status: "verification_pending" });
}
