import { createClient } from "@/lib/supabase/server";

export async function recordActivityAndGetStreak(nurseId: string): Promise<number> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("nurse_activity_log")
    .upsert({ nurse_id: nurseId, activity_date: today }, { onConflict: "nurse_id,activity_date" });

  const { data } = await supabase
    .from("nurse_activity_log")
    .select("activity_date")
    .eq("nurse_id", nurseId);

  const activeDates = new Set((data || []).map((d) => d.activity_date));

  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (activeDates.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
