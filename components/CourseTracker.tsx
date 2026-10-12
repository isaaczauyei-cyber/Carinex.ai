"use client";

type Course = {
  id: number;
  title: string;
  provider: string;
  price_display: string | null;
  duration_display?: string | null;
  level?: string | null;
  summary: string | null;
  image_url?: string | null;
  is_in_house?: boolean;
};

type Completion = {
  status: "in_progress" | "completed" | "verification_pending";
} | null;

const statusStyles: Record<string, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  verification_pending: "border-sky-200 bg-sky-50 text-sky-800",
  in_progress: "border-amber-200 bg-amber-50 text-amber-800",
};
const statusLabels: Record<string, string> = {
  completed: "Completed",
  verification_pending: "Pending review",
  in_progress: "In progress",
};

export default function CourseTracker({
  course,
  completion,
}: {
  nurseId: string;
  course: Course;
  completion: Completion;
}) {
  const courseHref = course.is_in_house
    ? `/dashboard/learning/inhouse/${course.id}/start`
    : `/courses/${course.id}`;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
      <a href={courseHref} aria-label={`Open course: ${course.title}`} className="relative block aspect-[16/9] overflow-hidden bg-slate-100">
        {course.image_url ? (
          <img src={course.image_url} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#102D46] via-[#174C5B] to-[#1F7A63]">
            <span className="text-4xl font-extrabold tracking-tight text-white/90" aria-hidden="true">C<span className="text-emerald-300">+</span></span>
          </div>
        )}
        {course.is_in_house && <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-800 shadow-sm">Carinex Original</span>}
      </a>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold text-slate-500">{course.provider || "Carinex Learning"}</p>
        <a href={courseHref} className="mt-2 line-clamp-2 text-base font-bold leading-6 text-slate-900 transition hover:text-carinex-emerald focus-visible:text-carinex-emerald">
          {course.title}
        </a>
        {course.summary && <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">{course.summary}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {course.duration_display && <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">◷ {course.duration_display}</span>}
          {course.level && <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{course.level}</span>}
          {completion?.status && <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyles[completion.status]}`}>{statusLabels[completion.status]}</span>}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-5">
          <p className="text-sm font-bold text-slate-800">{course.price_display || (course.is_in_house ? "Included in Carinex" : "Course details")}</p>
          <a href={courseHref} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-carinex-emerald px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90 sm:text-sm">
            {completion?.status === "completed" ? "Review course" : completion?.status ? "Continue learning" : "View course"} <span className="ml-1.5" aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </article>
  );
}
