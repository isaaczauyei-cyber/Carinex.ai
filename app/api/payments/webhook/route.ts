import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function sendPaymentConfirmation(args: {
  reference: string;
  email: string;
  firstName?: string;
  courseTitle: string;
  amountNaira: number;
  createdAt?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Payment confirmation email skipped: RESEND_API_KEY is not configured.");
    return;
  }

  const from = process.env.EMAIL_FROM || "Carinex <noreply@carinex.info>";
  const date = args.createdAt
    ? new Date(args.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })
    : new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
  const amount = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(args.amountNaira);
  const greeting = args.firstName ? `Hello ${args.firstName},` : "Hello,";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Resend deduplicates retries for the same verified Paystack reference.
      "Idempotency-Key": `carinex-payment-confirmation-${args.reference}`,
    },
    body: JSON.stringify({
      from,
      to: args.email,
      subject: `Payment confirmed: ${args.courseTitle} | Carinex`,
      text: `${greeting}

We've successfully verified your payment for ${args.courseTitle}.

Payment details
Course: ${args.courseTitle}
Amount paid: ${amount}
Payment reference: ${args.reference}
Payment date: ${date}

Your payment is confirmed. If this course requires enrollment approval, your access will become available after that approval is completed.

You can visit your Carinex dashboard here:
https://carinex.info/dashboard/learning

If you have questions, contact support@carinex.info.

Best regards,
Carinex Team`,
      reply_to: "support@carinex.info",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Payment confirmation email failed:", await response.text());
  }
}

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

    // Send a confirmation only after Paystack verification and database finalization succeed.
    // The Resend idempotency key prevents duplicate messages for retried webhooks.
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("id, user_id, amount, status, created_at")
      .eq("paystack_ref", reference)
      .maybeSingle();

    if (paymentError) {
      console.error("Could not load finalized payment for email:", paymentError.message);
    } else if (payment?.status === "success" && payment.user_id) {
      const [{ data: detail, error: detailError }, { data: authResult, error: authError }] = await Promise.all([
        admin.from("course_payment_details").select("course_id, package_type").eq("payment_id", payment.id).maybeSingle(),
        admin.auth.admin.getUserById(payment.user_id),
      ]);

      if (detailError || authError) {
        console.error("Could not load payment confirmation details:", detailError?.message || authError?.message);
      } else if (detail && authResult.user?.email) {
        const { data: course, error: courseError } = await admin
          .from("courses")
          .select("title")
          .eq("id", detail.course_id)
          .maybeSingle();

        if (courseError || !course?.title) {
          console.error("Could not load course title for payment confirmation:", courseError?.message);
        } else {
          const fullName = typeof authResult.user.user_metadata?.full_name === "string"
            ? authResult.user.user_metadata.full_name
            : typeof authResult.user.user_metadata?.name === "string"
              ? authResult.user.user_metadata.name
              : "";
          await sendPaymentConfirmation({
            reference,
            email: authResult.user.email,
            firstName: fullName.trim().split(/\s+/)[0] || undefined,
            courseTitle: course.title,
            amountNaira: Number(payment.amount),
            createdAt: payment.created_at,
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
