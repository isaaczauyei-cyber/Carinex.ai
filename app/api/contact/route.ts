import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("contact_messages")
    .insert({ name, email, message });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Carinex <onboarding@resend.dev>",
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: `New contact message from ${name}`,
        text: `From: ${name} (${email})\n\n${message}`,
      }),
    });
  } catch {
    // Message is already saved in Supabase either way — email is a
    // notification convenience, not the source of truth.
  }

  return NextResponse.json({ success: true });
}
