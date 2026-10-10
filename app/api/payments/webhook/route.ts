import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.FLW_SECRET_KEY;
  const secretHash = process.env.FLW_SECRET_HASH;
  if (process.env.FLW_LIVE_PAYMENTS_ENABLED !== "true" || !secret || !secret.startsWith("FLWSECK-") || secret.includes("TEST")) {
    return NextResponse.json({ error: "Live payment processing is disabled" }, { status: 503 });
  }
  if (!secretHash) return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });

  // Flutterwave sends the dashboard-configured webhook secret in the verif-hash header.
  const suppliedHash = req.headers.get("verif-hash");
  if (!suppliedHash || suppliedHash !== secretHash) return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });

  let event: any;
  try { event = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const data = event?.data;
  const reference = data?.tx_ref;
  const transactionId = data?.id;
  if (event?.event !== "charge.completed" || typeof reference !== "string" || !reference || !transactionId) {
    return NextResponse.json({ received: true });
  }

  try {
    const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`, {
      headers: { Authorization: `Bearer ${secret}` }, cache: "no-store",
    });
    const verification = await verifyResponse.json();
    const tx = verification?.data;
    if (!verifyResponse.ok || verification?.status !== "success" || tx?.status !== "successful" || tx?.tx_ref !== reference) {
      return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 });
    }
    if (tx.currency !== "NGN" || typeof tx.amount !== "number" || !Number.isFinite(tx.amount) || tx.amount <= 0) {
      return NextResponse.json({ error: "Invalid verified transaction details" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.rpc("finalize_course_payment", {
      p_reference: reference,
      // Existing SQL finalizer expects integer kobo; convert verified NGN to kobo.
      p_verified_amount_kobo: Math.round(tx.amount * 100),
      p_verified_currency: tx.currency,
    });
    if (error) {
      console.error("Flutterwave payment finalization failed", error.message);
      return NextResponse.json({ error: "Could not finalize payment" }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Flutterwave webhook error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
