import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COURSE_PRICES, isCoursePackage, PAID_COURSE_ID, type CoursePackage } from "@/lib/course-pricing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "Sign in with an email address before purchasing." }, { status: 401 });

    const body = await req.json();
    if (Number(body.courseId) !== PAID_COURSE_ID || !isCoursePackage(body.packageType)) {
      return NextResponse.json({ error: "Invalid course or package." }, { status: 400 });
    }

    const { data: course } = await supabase.from("courses").select("id, is_in_house").eq("id", PAID_COURSE_ID).maybeSingle();
    if (!course?.is_in_house) return NextResponse.json({ error: "This course is not available for in-house purchase." }, { status: 404 });

    const admin = createAdminClient();
    const { data: prior } = await admin.from("course_enrollments").select("id, status").eq("user_id", user.id).eq("course_id", PAID_COURSE_ID).in("status", ["pending_approval", "approved"]).limit(1).maybeSingle();
    if (prior) return NextResponse.json({ error: prior.status === "approved" ? "You already have access to this course." : "Your payment is already awaiting admin approval." }, { status: 409 });

    const packageType: CoursePackage = body.packageType;
    const amountNaira = COURSE_PRICES[packageType];
    const reference = `CRX-${crypto.randomUUID()}`;
    const { data: payment, error: paymentError } = await admin.from("payments").insert({
      user_id: user.id,
      type: "course_purchase",
      amount: amountNaira,
      currency: "NGN",
      paystack_ref: reference,
      status: "pending",
    }).select("id").single();
    if (paymentError || !payment) throw paymentError || new Error("Could not create payment record");

    const { error: detailError } = await admin.from("course_payment_details").insert({
      payment_id: payment.id,
      course_id: PAID_COURSE_ID,
      package_type: packageType,
    });
    if (detailError) {
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
      throw detailError;
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Payment provider is not configured");
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount: amountNaira * 100,
        currency: "NGN",
        reference,
        callback_url: `${baseUrl}/payments/return?reference=${encodeURIComponent(reference)}`,
        metadata: { user_id: user.id, course_id: PAID_COURSE_ID, package_type: body.packageType },
      }),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
      console.error("Paystack initialization failed", result.message);
      return NextResponse.json({ error: "Unable to start payment. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference });
  } catch (error) {
    console.error("Payment initialization error", error);
    return NextResponse.json({ error: "Unable to start payment. Please try again." }, { status: 500 });
  }
}
