import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("tx_ref");
  const transactionId = req.nextUrl.searchParams.get("transaction_id");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
  if (!user) return NextResponse.redirect(new URL("/login", baseUrl));
  if (!reference || !transactionId) {
    return NextResponse.redirect(new URL(`/payments/return?reference=${encodeURIComponent(reference || "")}`, baseUrl));
  }

  try {
    const admin = createAdminClient();
    const { data: payment } = await admin.from("payments").select("id, amount, currency, status")
      .eq("paystack_ref", reference).eq("user_id", user.id).maybeSingle();
    if (!payment) return NextResponse.redirect(new URL("/payments/return?status=not_found", baseUrl));

    const secret = process.env.FLW_SECRET_KEY;
    if (!secret || !secret.startsWith("FLWSECK-") || secret.includes("TEST")) {
      return NextResponse.redirect(new URL(`/payments/return?reference=${encodeURIComponent(reference)}`, baseUrl));
    }
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
      headers: { Authorization: `Bearer ${secret}` }, cache: "no-store",
    });
    const verification = await response.json();
    const tx = verification?.data;
    if (response.ok && verification?.status === "success" && tx?.status === "successful" && tx?.tx_ref === reference && tx?.currency === "NGN" && typeof tx?.amount === "number" && Number.isFinite(tx.amount) && tx.amount > 0) {
      const { error } = await admin.rpc("finalize_course_payment", {
        p_reference: reference,
        p_verified_amount_kobo: Math.round(tx.amount * 100),
        p_verified_currency: tx.currency,
      });
      if (error) console.error("Flutterwave callback finalization failed", error.message);
    }
    return NextResponse.redirect(new URL(`/payments/return?reference=${encodeURIComponent(reference)}`, baseUrl));
  } catch (error) {
    console.error("Flutterwave callback verification error", error);
    return NextResponse.redirect(new URL(`/payments/return?reference=${encodeURIComponent(reference)}`, baseUrl));
  }
}
