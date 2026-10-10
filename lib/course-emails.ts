import { createAdminClient } from "@/lib/supabase/admin";

type EventType = "trial_started" | "trial_2_days_left" | "trial_1_day_left" | "trial_expired" | "enrollment_approved" | "enrollment_rejected" | "course_completed" | "payment_confirmed";

export async function sendCourseEmail(enrollmentId: string, eventType: EventType) {
  const admin = createAdminClient();
  const { data: alreadySent } = await admin.from("course_email_events").select("id").eq("enrollment_id", enrollmentId).eq("event_type", eventType).maybeSingle();
  if (alreadySent) return { sent: false, duplicate: true };
  const { data: enrollment, error } = await admin.from("course_enrollments").select("id,user_id,course_id,status,access_type,trial_expires_at,courses(title),users(email)").eq("id", enrollmentId).maybeSingle();
  if (error || !enrollment) throw new Error("Enrollment/email recipient not found");
  const joined: any = enrollment;
  const course = Array.isArray(joined.courses) ? joined.courses[0] : joined.courses;
  const userRow = Array.isArray(joined.users) ? joined.users[0] : joined.users;
  const { data: authData } = userRow?.email ? { data: null } : await admin.auth.admin.getUserById(enrollment.user_id);
  const to = userRow?.email || authData?.user?.email;
  if (!to) throw new Error("Enrollment user has no email address");
  const title = course?.title || "your Carinex course";
  const expiry = enrollment.trial_expires_at ? new Date(enrollment.trial_expires_at).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Lagos" }) : "";
  const messages: Record<EventType, {subject:string; text:string}> = {
    trial_started: { subject: `Your 7-day course trial has started | Carinex`, text: `Hello,\n\nYour 7-day free trial for ${title} has started. Your access is scheduled to expire on ${expiry} (Nigeria time).\n\nContinue learning here: ${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://carinex.info"}/dashboard/learning\n\nTo keep access after the trial, purchase the course before it expires.\n\nCarinex Support` },
    trial_2_days_left: { subject: `2 days left in your ${title} trial | Carinex`, text: `Hello,\n\nYou have 2 days remaining in your free trial for ${title}. Your trial expires on ${expiry} (Nigeria time). Purchase the course to keep access.\n\nCarinex Support` },
    trial_1_day_left: { subject: `Your ${title} trial ends tomorrow | Carinex`, text: `Hello,\n\nYour free trial for ${title} ends tomorrow, ${expiry} (Nigeria time). Purchase the course to keep access after the trial.\n\nCarinex Support` },
    trial_expired: { subject: `Your free trial has ended | Carinex`, text: `Hello,\n\nYour 7-day free trial for ${title} has expired. Your course progress has been preserved, but trial access is now closed. Purchase the course to regain access.\n\nCarinex Support` },
    enrollment_approved: { subject: `Your course enrollment is approved | Carinex`, text: `Hello,\n\nYour enrollment for ${title} has been approved. You can continue from your Carinex learning dashboard.\n\nCarinex Support` },
    enrollment_rejected: { subject: `Update on your course enrollment | Carinex`, text: `Hello,\n\nUnfortunately, your enrollment for ${title} was not approved. Please contact support if you need clarification.\n\nCarinex Support` },
    payment_confirmed: { subject: `Payment confirmed | Carinex`, text: `Hello,\n\nYour payment for ${title} has been verified successfully. Your enrollment is now awaiting any required approval. You can check your learning dashboard for updates.\n\nCarinex Support` },
    course_completed: { subject: `Congratulations on completing ${title} | Carinex`, text: `Congratulations!\n\nYou have completed ${title}. Thank you for learning with Carinex.\n\nCarinex Support` },
  };
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error("RESEND_API_KEY or EMAIL_FROM is missing");
  // Reserve the event first; unique constraint ensures concurrent cron runs cannot send duplicates.
  const { error: reserveError } = await admin.from("course_email_events").insert({ enrollment_id: enrollmentId, event_type: eventType });
  if (reserveError) {
    if (reserveError.code === "23505") return { sent: false, duplicate: true };
    throw reserveError;
  }
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `course-${enrollmentId}-${eventType}` }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject: messages[eventType].subject, text: messages[eventType].text, reply_to: process.env.SUPPORT_EMAIL || "support@carinex.info" }) });
  if (!response.ok) {
    await admin.from("course_email_events").delete().eq("enrollment_id", enrollmentId).eq("event_type", eventType);
    throw new Error(`Resend rejected course email: ${await response.text()}`);
  }
  return { sent: true };
}
