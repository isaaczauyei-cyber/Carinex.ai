import { createClient } from "@/lib/supabase/server";

export async function recordActivityAndGetStreak(
  nurseId: string
): Promise<number> {
  const supabase = await createClient();

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  /*
   * Keep the existing activity recording behavior.
   */
  await supabase
    .from("nurse_activity_log")
    .upsert(
      {
        nurse_id: nurseId,
        activity_date: todayKey,
      },
      {
        onConflict: "nurse_id,activity_date",
      }
    );

  /*
   * A streak cannot extend beyond one year.
   * Avoid downloading years of activity history.
   */
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - 366);

  const startDateKey = startDate.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("nurse_activity_log")
    .select("activity_date")
    .eq("nurse_id", nurseId)
    .gte("activity_date", startDateKey)
    .order("activity_date", { ascending: false });

  const activeDates = new Set(
    (data || []).map((row) => row.activity_date)
  );

  let streak = 0;
  const cursor = new Date(today);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);

    if (!activeDates.has(key)) {
      break;
    }

    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
