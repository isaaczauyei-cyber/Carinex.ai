"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "general_admin" | "customer_experience" | "financial" | "course_content";
const tabs = [
  { href: "/admin/users", label: "Users", roles: ["general_admin", "customer_experience"] },
  { href: "/admin/analytics", label: "Analytics", roles: ["general_admin", "customer_experience"] },
  { href: "/admin/enrollments", label: "Paid Enrolments", roles: ["general_admin", "financial"] },
  { href: "/admin/in-house-courses", label: "In-House Courses", roles: ["general_admin", "course_content"] },
  { href: "/admin/courses", label: "Course Reviews", roles: ["general_admin", "course_content"] },
  { href: "/admin/course-content", label: "Course Content", roles: ["general_admin", "course_content"] },
  { href: "/admin/jobs", label: "Jobs", roles: ["general_admin"] },
  { href: "/admin/team", label: "Admin Team", roles: ["general_admin"] },
] as const;
export default function AdminTabs() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => { fetch("/api/admin/me").then(r => r.ok ? r.json() : null).then(d => setRole(d?.role || null)).catch(() => setRole(null)); }, []);
  const visible = tabs.filter(tab => role && (tab.roles as readonly string[]).includes(role));
  return <div className="mt-6 flex gap-2 overflow-x-auto border-b border-carinex-navy/10 pb-px">{visible.map(tab => {
    const active = pathname === tab.href || pathname?.startsWith(tab.href + "/");
    return <Link key={tab.href} href={tab.href} className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-semibold ${active ? "border-b-2 border-carinex-emerald text-carinex-navy" : "text-carinex-navy/50 hover:text-carinex-navy"}`}>{tab.label}</Link>;
  })}</div>;
}
