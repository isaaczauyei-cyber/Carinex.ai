"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/courses", label: "Course Reviews" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="mt-6 flex gap-2 border-b border-carinex-navy/10">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-semibold ${
              active
                ? "border-b-2 border-carinex-emerald text-carinex-navy"
                : "text-carinex-navy/50 hover:text-carinex-navy"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
