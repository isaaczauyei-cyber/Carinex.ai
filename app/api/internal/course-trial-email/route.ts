import { NextRequest, NextResponse } from "next/server";
import { sendCourseEmail } from "@/lib/course-emails";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("x-internal-email-secret") !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.enrollmentId !== "string" || body.eventType !== "trial_started") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try { return NextResponse.json(await sendCourseEmail(body.enrollmentId, body.eventType)); }
  catch (error) { console.error("Trial email error", error); return NextResponse.json({ error: "Email could not be sent" }, { status: 500 }); }
}
