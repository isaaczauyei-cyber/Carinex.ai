export default function DashboardHero({
  firstName,
  streak,
  coursesCompleted,
  coursesInProgress,
  specializationsUnlocked,
}: {
  firstName: string;
  streak: number;
  coursesCompleted: number;
  coursesInProgress: number;
  specializationsUnlocked: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-carinex-navy via-carinex-navy to-carinex-emerald p-8 text-carinex-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-carinex-white/60">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
        </div>
        {streak > 0 && (
          <div className="flex flex-col items-center rounded-2xl bg-carinex-white/10 px-5 py-3">
            <span className="text-2xl">🔥</span>
            <span className="text-lg font-bold">{streak}</span>
            <span className="text-xs text-carinex-white/70">day streak</span>
          </div>
        )}
      </div>

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
          <p className="text-2xl font-bold">{specializationsUnlocked}</p>
          <p className="mt-1 text-xs text-carinex-white/70">Unlocked</p>
        </div>
      </div>
    </div>
  );
}
