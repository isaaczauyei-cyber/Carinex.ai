export default function DashboardHero({
  firstName,
  streak,
  coursesCompleted,
  coursesInProgress,
  specializationsCompleted,
}: {
  firstName: string;
  streak: number;
  coursesCompleted: number;
  coursesInProgress: number;
  specializationsCompleted: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-carinex-navy via-carinex-navy to-carinex-emerald p-8 text-carinex-white">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-carinex-white/60">
          Dashboard
        </p>
        {streak > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-carinex-white/15 px-2.5 py-0.5 text-xs font-semibold">
            🔥 {streak}
          </span>
        )}
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back, Nurse {firstName}</h1>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-carinex-white/10 p-4">
          <p className="text-2xl font-bold">{coursesCompleted}</p>
          <p className="mt-1 text-xs text-carinex-white/70">Courses completed</p>
        </div>
        <div className="rounded-xl bg-carinex-white/10 p-4">
          <p className="text-2xl font-bold">{coursesInProgress}</p>
          <p className="mt-1 text-xs text-carinex-white/70">In progress</p>
        </div>
        <div className="rounded-xl bg-carinex-white/10 p-4">
          <p className="text-2xl font-bold">{specializationsCompleted}</p>
          <p className="mt-1 text-xs text-carinex-white/70">Completed</p>
        </div>
      </div>
    </div>
  );
}
