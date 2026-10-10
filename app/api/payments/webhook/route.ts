import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCourseEmail } from "@/lib/course-emails";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers.get("x-paystack-signature");
  // Do not let test-mode webhook events finalize production course payments.
  if (process.env.PAYSTACK_LIVE_PAYMENTS_ENABLED !== "true" || !secret || !secret.startsWith("sk_live_")) {
    return NextResponse.json({ error: "Live payment processing is disabled" }, { status: 503 });
  }
  if (!signature) return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });

  const rawBody = await req.text();
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "hex"); } catch { return NextResponse.json({ error: "Invalid signature" }, { status: 401 }); }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (event.event !== "charge.success") return NextResponse.json({ received: true });

  const reference = event?.data?.reference;
  if (typeof reference !== "string" || !reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  try {
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` }, cache: "no-store",
    });
    const verification = await verifyResponse.json();
    const tx = verification?.data;
    if (!verifyResponse.ok || !verification.status || tx?.status !== "success" || tx?.reference !== reference) {
      return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 });
    }
    if (!Number.isSafeInteger(tx.amount) || tx.currency !== "NGN") {
      return NextResponse.json({ error: "Invalid verified transaction details" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.rpc("finalize_course_payment", {
      p_reference: reference,
      p_verified_amount_kobo: tx.amount,
      p_verified_currency: tx.currency,
    });
    if (error) {
      console.error("Payment finalization failed", error.message);
      return NextResponse.json({ error: "Could not finalize payment" }, { status: 500 });
    }
    // Send a payment confirmation only after Paystack verification and DB finalization.
    try {
      const { data: payment } = await admin.from("payments").select("id,user_id").eq("paystack_ref", reference).maybeSingle();
      if (payment?.id && payment.user_id) {
        const { data: detail } = await admin.from("course_payment_details").select("course_id").eq("payment_id", payment.id).maybeSingle();
        if (detail?.course_id) {
          const { data: enrollment } = await admin.from("course_enrollments").select("id").eq("user_id", payment.user_id).eq("course_id", detail.course_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (enrollment?.id) await sendCourseEmail(enrollment.id, "payment_confirmed");
        }
      }
    } catch (emailError) {
      // Email delivery must not undo a verified payment.
      console.error("Payment confirmation email failed", emailError);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
