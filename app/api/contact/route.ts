
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function sendEmail(payload: {
  from: string;
  to: string;
  subject: string;
  text: string;
  reply_to?: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Resend error:", error);
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return NextResponse.json(
        { error: "Please complete all fields." },
        { status: 400 }
      );
    }

    if (
      name.length > 150 ||
      email.length > 254 ||
      message.length > 5000 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return NextResponse.json(
        { error: "Please check your details and try again." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: "We couldn't save your message." },
        { status: 500 }
      );
    }

    const sender = process.env.EMAIL_FROM || "Carinex <noreply@carinex.info>";
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || "support@carinex.info";

    if (!process.env.RESEND_API_KEY) {
      console.error("Email environment variables are missing.");
      return NextResponse.json({ success: true });
    }

    // Email 1: Notify Carinex support.
    const adminSent = await sendEmail({
      from: sender,
      to: adminEmail,
      reply_to: email.trim(),
      subject: `New contact message from ${name.trim()}`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
    });

    // Email 2: Confirm receipt to the person who contacted us.
    const customerSent = await sendEmail({
      from: sender,
      to: email.trim(),
      reply_to: "support@carinex.info",
      subject: "We received your message | Carinex",
      text: `Hello ${name.trim()},

Thank you for contacting Carinex.

We've successfully received your message and our team will review it. We'll get back to you as soon as possible.

Your message:
"${message.trim()}"

Thank you for choosing Carinex.

Best regards,
Carinex Support Team
support@carinex.info`,
    });

    return NextResponse.json({
      success: true,
      adminNotificationSent: adminSent,
      customerConfirmationSent: customerSent,
    });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
