import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!user.email_confirmed_at) {
      return NextResponse.json({ sent: false, reason: "email_not_confirmed" });
    }

    const admin = createAdminClient();
    const { data: adminUserData, error: adminUserError } = await admin.auth.admin.getUserById(user.id);
    if (adminUserError || !adminUserData.user) {
      console.error("Welcome email: could not load account metadata.", adminUserError);
      return NextResponse.json({ error: "Could not prepare welcome email." }, { status: 500 });
    }

    const appMetadata = adminUserData.user.app_metadata ?? {};
    if (appMetadata.carinex_welcome_email_sent === true) {
      return NextResponse.json({ sent: false, reason: "already_sent" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const sender = process.env.EMAIL_FROM || "Carinex <noreply@carinex.info>";
    if (!apiKey) {
      console.error("Welcome email: RESEND_API_KEY is missing.");
      return NextResponse.json({ error: "Email service is not configured." }, { status: 503 });
    }

    const nameValue = user.user_metadata?.full_name;
    const firstName = typeof nameValue === "string" && nameValue.trim()
      ? nameValue.trim().split(/\s+/)[0]
      : "there";
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://carinex.info").replace(/\/$/, "");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: user.email,
        reply_to: "support@carinex.info",
        subject: "Welcome to Carinex!",
        text: `Hello ${firstName},\n\nWelcome to Carinex! We're glad you're here.\n\nCarinex helps you build your professional journey with learning resources, career pathways, and opportunities.\n\nGet started here: ${siteUrl}/dashboard\n\nIf you need help, reply to this email or contact support@carinex.info.\n\nBest regards,\nThe Carinex Team`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172b4d;max-width:600px;margin:0 auto"><h1 style="color:#087f68">Welcome to Carinex!</h1><p>Hello ${escapeHtml(firstName)},</p><p>We're glad you're here.</p><p>Carinex helps you build your professional journey with learning resources, career pathways, and opportunities.</p><p><a href="${siteUrl}/dashboard" style="display:inline-block;background:#087f68;color:#fff;text-decoration:none;padding:12px 20px;border-radius:24px">Get started</a></p><p>If you need help, reply to this email or contact <a href="mailto:support@carinex.info">support@carinex.info</a>.</p><p>Best regards,<br>The Carinex Team</p></div>`,
      }),
    });

    if (!response.ok) {
      console.error("Welcome email: Resend request failed.", await response.text());
      return NextResponse.json({ error: "Welcome email could not be sent." }, { status: 502 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...appMetadata, carinex_welcome_email_sent: true },
    });
    if (updateError) {
      console.error("Welcome email sent, but deduplication metadata could not be saved.", updateError);
      return NextResponse.json({ sent: true, warning: "deduplication_flag_not_saved" });
    }
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Welcome email route failed:", error);
    return NextResponse.json({ error: "Welcome email could not be processed." }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}
