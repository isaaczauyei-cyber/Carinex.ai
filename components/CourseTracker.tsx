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
  completed: "bg-carinex-emerald/10 text-carinex-emerald",
  verification_pending: "bg-sky-50 text-sky-700",
  in_progress: "bg-amber-50 text-amber-700",
};

const statusLabels: Record<string, string> = {
  completed: "Completed",
  verification_pending: "Pending Review",
  in_progress: "In Progress",
};

export default function CourseTracker({
  course,
  completion,
}: {
  nurseId: string;
  course: Course;
  completion: Completion;
}) {
  return (
    <a
      href={`/courses/${course.id}`}
      className="block overflow-hidden rounded-xl border border-carinex-navy/10 transition hover:border-carinex-emerald/40 hover:shadow-sm"
    >
      {course.image_url ? (
        <img src={course.image_url} alt={course.title} className="h-28 w-full object-cover" />
      ) : (
        <div className="h-16 w-full bg-gradient-to-br from-carinex-navy to-carinex-emerald" />
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-carinex-navy">{course.title}</p>
          {course.is_in_house && (
            <span className="shrink-0 rounded-full bg-carinex-navy/5 px-2 py-0.5 text-xs font-semibold text-carinex-navy/60">
              Carinex Original
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-carinex-navy/60">
          {course.provider}
          {course.price_display ? ` · ${course.price_display}` : ""}
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {course.duration_display && (
            <span className="rounded-full bg-carinex-navy/5 px-2.5 py-1 text-xs text-carinex-navy/70">
              ⏱ {course.duration_display}
            </span>
          )}
          {course.level && (
            <span className="rounded-full bg-carinex-navy/5 px-2.5 py-1 text-xs text-carinex-navy/70">
              🎯 {course.level}
            </span>
          )}
          {completion?.status && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[completion.status]}`}>
              {statusLabels[completion.status]}
            </span>
          )}
        </div>

        {course.summary && (
          <p className="mt-2 text-sm text-carinex-navy/70">{course.summary}</p>
        )}

        <p className="mt-3 text-sm font-semibold text-carinex-emerald">View details →</p>
      </div>
    </a>
  );
}
