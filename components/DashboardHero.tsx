export default function DashboardHero({
  firstName,
  streak,
  coursesCompleted,
  specializationsEnrolled,
  roadmapsCompleted,
}: {
  firstName: string;
  streak: number;
  coursesCompleted: number;
  specializationsEnrolled: number;
  roadmapsCompleted: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-8 text-white backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
          Dashboard
        </p>
        {streak > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
            🔥 {streak}
          </span>
        )}
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back, Nurse {firstName}</h1>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-2xl font-bold">{coursesCompleted}</p>
          <p className="mt-1 text-xs text-white/70">Courses completed</p>
        </div>
        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-2xl font-bold">{specializationsEnrolled}</p>
          <p className="mt-1 text-xs text-white/70">Specializations enrolled</p>
        </div>
        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-2xl font-bold">{roadmapsCompleted}</p>
          <p className="mt-1 text-xs text-white/70">Roadmaps completed</p>
        </div>
      </div>
    </div>
  );
}
