export type CoursePackage = "course_only" | "course_plus_guide";

export type CoursePricing = {
  courseOnly: number;
  coursePlusGuide: number | null;
};

export function isCoursePackage(value: unknown): value is CoursePackage {
  return value === "course_only" || value === "course_plus_guide";
}

export function getPackagePrice(pricing: CoursePricing, packageType: CoursePackage): number {
  return packageType === "course_only"
    ? Number(pricing.courseOnly || 0)
    : Number(pricing.coursePlusGuide || 0);
}

export function formatNaira(amount: number): string {
  return `₦${Number(amount || 0).toLocaleString("en-NG", {
    maximumFractionDigits: 0,
  })}`;
}
