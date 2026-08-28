// app/api/payments/webhook/route.ts
// This is real backend code — it runs on the server, never in the browser,
// and uses the Paystack SECRET key (never NEXT_PUBLIC_...). This is the kind
// of logic that needs a Next.js API route instead of a direct Supabase call.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify the request actually came from Paystack, not a spoofed call
  const signature = req.headers.get("x-paystack-signature");
  const expectedSignature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!) // server-only secret
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const { reference, amount, currency } = event.data;

    const supabase = await createClient();
    const { error } = await supabase
      .from("payments")
      .update({ status: "success" })
      .eq("paystack_ref", reference);

    if (error) {
      console.error("Failed to update payment record:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  }

  // Always return 200 quickly — Paystack retries if it doesn't get one
  return NextResponse.json({ received: true });
}
