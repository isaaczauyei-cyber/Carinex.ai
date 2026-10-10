import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCourseEmail } from "@/lib/course-emails";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const received = req.headers.get("authorization");

  console.info("Cron authentication diagnostic", {
    secretConfigured: Boolean(expected),
    authorizationHeaderPresent: Boolean(received),
    bearerPrefixPresent: received?.startsWith("Bearer ") ?? false,
    secretLength: expected?.length ?? 0,
    receivedLength: received?.startsWith("Bearer ")
      ? received.length - 7
      : null,
  });

  if (!expected || received !== `Bearer ${expected}`) {
    console.error("Course trial cron authentication failed");

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const now = Date.now();

  const { data: rows, error } = await admin
    .from("course_enrollments")
    .select(
      "id,trial_started_at,trial_expires_at,status,access_type,courses!inner(trial_enabled)"
    )
    .eq("status", "approved")
    .eq("access_type", "trial")
    .not("trial_expires_at", "is", null)
    .limit(500);

  if (error) {
    console.error("Could not load trial enrollments", error);

    return NextResponse.json(
      { error: "Could not load trial enrollments" },
      { status: 500 }
    );
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows || []) {
    const course: any = Array.isArray((row as any).courses)
      ? (row as any).courses[0]
      : (row as any).courses;

    if (course?.trial_enabled !== true) continue;

    const expires = new Date(row.trial_expires_at!).getTime();

    if (!Number.isFinite(expires)) {
      console.error("Invalid trial expiry timestamp", row.id);
      failed++;
      continue;
    }

    const due:
      | "trial_2_days_left"
      | "trial_1_day_left"
      | "trial_expired"
      | null =
      now >= expires
        ? "trial_expired"
        : now >= expires - 86400000
          ? "trial_1_day_left"
          : now >= expires - 2 * 86400000
            ? "trial_2_days_left"
            : null;

    if (!due) continue;

    try {
      const result = await sendCourseEmail(row.id, due);

      if (result.sent) sent++;
    } catch (e) {
      failed++;
      console.error("Trial reminder failed", row.id, due, e);
    }
  }

  return NextResponse.json({
    scanned: rows?.length || 0,
    sent,
    failed,
    checkedAt: new Date(now).toISOString(),
  });
}
