import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers.get("x-paystack-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });

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
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
