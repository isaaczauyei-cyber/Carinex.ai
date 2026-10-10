import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPackagePrice, isCoursePackage, type CoursePackage } from "@/lib/course-pricing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Sign in with an email address before purchasing." }, { status: 401 });
    }

    // Fail closed: never send learners to Paystack while the deployment is in test mode.
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const livePaymentsEnabled = process.env.PAYSTACK_LIVE_PAYMENTS_ENABLED === "true";
    if (!livePaymentsEnabled || !secret || !secret.startsWith("sk_live_")) {
      return NextResponse.json(
        { error: "Online payments are temporarily unavailable while Carinex completes live payment activation." },
        { status: 503 },
      );
    }

    const body = await req.json();
    const courseId = Number(body.courseId);
    if (!Number.isInteger(courseId) || courseId <= 0 || !isCoursePackage(body.packageType)) {
      return NextResponse.json({ error: "Invalid course or package." }, { status: 400 });
    }

    const packageType: CoursePackage = body.packageType;
    const admin = createAdminClient();

    // Pricing is always read from the database on the server. The browser
    // cannot choose the Paystack amount.
    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id, title, is_in_house, is_free, trial_enabled, price_course_only, price_course_plus_guide")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError) throw courseError;
    if (!course?.is_in_house) {
      return NextResponse.json({ error: "This course is not available for in-house purchase." }, { status: 404 });
    }

    if (course.is_free === true && course.trial_enabled !== true) {
      return NextResponse.json({ error: "This course is free. You do not need to make a payment." }, { status: 400 });
    }

    const amountNaira = getPackagePrice(
      {
        courseOnly: Number(course.price_course_only || 0),
        coursePlusGuide: course.price_course_plus_guide == null ? null : Number(course.price_course_plus_guide),
      },
      packageType,
    );

    if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
      return NextResponse.json({ error: "This package is not currently available for purchase." }, { status: 400 });
    }

    const { data: prior } = await admin
      .from("course_enrollments")
      .select("id, status, access_type, trial_expires_at")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .in("status", ["pending_approval", "approved"])
      .limit(1)
      .maybeSingle();

    if (prior) {
      return NextResponse.json(
        { error: prior.status === "approved" ? "You already have access to this course." : "Your payment is already awaiting admin approval." },
        { status: 409 },
      );
    }

    const reference = `CRX-${crypto.randomUUID()}`;
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        type: "course_purchase",
        amount: amountNaira,
        currency: "NGN",
        paystack_ref: reference,
        status: "pending",
      })
      .select("id")
      .single();

    if (paymentError || !payment) throw paymentError || new Error("Could not create payment record");

    const { error: detailError } = await admin.from("course_payment_details").insert({
      payment_id: payment.id,
      course_id: courseId,
      package_type: packageType,
    });

    if (detailError) {
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
      throw detailError;
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amountNaira * 100),
        currency: "NGN",
        reference,
        callback_url: `${baseUrl}/payments/return?reference=${encodeURIComponent(reference)}`,
        metadata: {
          user_id: user.id,
          course_id: courseId,
          package_type: packageType,
          course_title: course.title,
        },
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
