export const PAID_COURSE_ID = 23;
export const COURSE_PRICES = {
  course_only: 20_000,
  course_plus_guide: 25_000,
} as const;
export type CoursePackage = keyof typeof COURSE_PRICES;

export function isCoursePackage(value: unknown): value is CoursePackage {
  return value === "course_only" || value === "course_plus_guide";
}
