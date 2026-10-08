export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  /*
   * These two queries are independent.
   */
  const [{ data: userRow }, { data: profile }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, full_name")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("nurse_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const firstName =
    userRow?.first_name ||
    userRow?.full_name?.split(" ")[0] ||
    "there";

  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  /*
   * These are now independent once the profile is known.
   */
  const [
    progress,
    streak,
    { data: completions },
    { data: nurseSkills },
    { data: nurseServices },
    { data: nurseSpecs },
  ] = await Promise.all([
    getSpecializationProgress(profile.id),

    recordActivityAndGetStreak(profile.id),

    supabase
      .from("nurse_course_completions")
      .select("status, courses(title)")
      .eq("nurse_id", profile.id),

    supabase
      .from("nurse_skills")
      .select("skills(id, name)")
      .eq("nurse_id", profile.id),

    supabase
      .from("nurse_services")
      .select("services(id, name)")
      .eq("nurse_id", profile.id),

    supabase
      .from("nurse_specializations")
      .select("specializations(id, name)")
      .eq("nurse_id", profile.id),
  ]);

  const completedTitles = new Set(
    (completions || [])
      .filter((c) => c.status === "completed")
      .map(
        (c) =>
          (c.courses as unknown as { title: string })?.title
      )
      .filter(Boolean)
  );

  const coursesCompleted = completedTitles.size;

  const specializationsEnrolled = progress.length;

  const roadmapsCompleted = progress.filter(
    (p) => p.status === "unlocked"
  ).length;

  const skills = (nurseSkills || [])
    .map(
      (r) =>
        r.skills as unknown as {
          id: number;
          name: string;
        }
    )
    .filter(Boolean);

  const services = (nurseServices || [])
    .map(
      (r) =>
        r.services as unknown as {
          id: number;
          name: string;
        }
    )
    .filter(Boolean);

  const interests = (nurseSpecs || [])
    .map(
      (r) =>
        r.specializations as unknown as {
          id: number;
          name: string;
        }
    )
    .filter(Boolean);
