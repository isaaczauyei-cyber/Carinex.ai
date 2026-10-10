import { createAdminClient } from "@/lib/supabase/admin";

/** Send one payment confirmation for a server-verified and finalized Paystack reference. */
export async function sendPaymentConfirmationEmail(reference: string) {
  const admin = createAdminClient();

  const { data: alreadySent, error: lookupError } = await admin
    .from("payment_confirmation_email_events")
    .select("reference")
    .eq("reference", reference)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (alreadySent) return { sent: false, duplicate: true };

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("id,user_id,amount,currency,status")
    .eq("paystack_ref", reference)
    .maybeSingle();
  if (paymentError || !payment) throw paymentError || new Error("Payment record not found");
  if (payment.status !== "success") throw new Error("Payment is not finalized as successful");

  const { data: authData, error: userError } = await admin.auth.admin.getUserById(payment.user_id);
  if (userError) throw userError;
  const to = authData.user?.email;
  if (!to) throw new Error("Payment user's email address was not found");

  const { data: details, error: detailsError } = await admin
    .from("course_payment_details")
    .select("package_type,courses(title)")
    .eq("payment_id", payment.id)
    .maybeSingle();
  if (detailsError) throw detailsError;
  const courseRelation: any = details?.courses;
  const course = Array.isArray(courseRelation) ? courseRelation[0] : courseRelation;
  const courseTitle = course?.title || "your Carinex course";
  const amount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: payment.currency || "NGN",
    minimumFractionDigits: 2,
  }).format(Number(payment.amount));
  const packageLabel = details?.package_type === "course_plus_guide"
    ? "Course + interview guide"
    : "Course purchase";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.carinex.info").replace(/\/$/, "");

  // Unique primary key on reference prevents duplicate emails when Paystack retries a webhook.
  const { error: reserveError } = await admin
    .from("payment_confirmation_email_events")
    .insert({ reference });
  if (reserveError) {
    if (reserveError.code === "23505") return { sent: false, duplicate: true };
    throw reserveError;
  }

  try {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      throw new Error("RESEND_API_KEY or EMAIL_FROM is missing");
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `payment-confirmation-${reference}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject: `Payment confirmed for ${courseTitle} | Carinex`,
        text: `Hello,\n\nWe have confirmed your payment for ${courseTitle}.\n\nPackage: ${packageLabel}\nAmount: ${amount}\nPayment reference: ${reference}\n\nYour enrollment is recorded and may require administrator approval before course access is granted. You can check your learning dashboard here: ${siteUrl}/dashboard/learning\n\nIf you have questions, contact ${process.env.SUPPORT_EMAIL || "support@carinex.info"}.\n\nCarinex Notifications`,
        reply_to: process.env.SUPPORT_EMAIL || "support@carinex.info",
      }),
    });
    if (!response.ok) {
      const message = await response.text();
      await admin.from("payment_confirmation_email_events").delete().eq("reference", reference);
      throw new Error(`Resend rejected payment confirmation email: ${message}`);
    }
    return { sent: true };
  } catch (error) {
    // Release the reservation on failed sends so a webhook retry can try again.
    await admin.from("payment_confirmation_email_events").delete().eq("reference", reference);
    throw error;
  }
}
