"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const quickLinks = [
  { label: "Explore Pathways", href: "/pathways" },
  { label: "Create an Account", href: "/signup" },
  { label: "Log In", href: "/login" },
];

const legalLinks = [
  { label: "Terms and Conditions", href: "#" },
  { label: "Privacy Policy", href: "#" },
];

const specializationLinks = [
  { label: "Telehealth Nursing", href: "/pathways#telehealth-nursing" },
  { label: "Remote Patient Monitoring", href: "/pathways#remote-patient-monitoring" },
  { label: "Telemedicine Coordination", href: "/pathways#telemedicine-coordination" },
  { label: "Healthcare Data & AI Automation", href: "/pathways#healthcare-data-ai-automation" },
  { label: "Medical Scribing", href: "/pathways#medical-scribing" },
  { label: "Virtual Assistance", href: "/pathways#virtual-assistance" },
  { label: "Medical Coding & Billing", href: "/pathways#medical-coding-billing" },
  { label: "Case Management", href: "/pathways#case-management" },
];

export default function Footer() {
  const pathname = usePathname();
  const hideFooter = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin");

  if (hideFooter) return null;

  return (
    <footer className="border-t border-carinex-navy/10 bg-carinex-navy text-carinex-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/carinex-logo.svg" alt="Carinex" width={40} height={40} />
          <span className="text-2xl font-bold">Carinex</span>
        </Link>

        <p className="mt-4 max-w-xl text-carinex-white/70">
          Carinex is a Nigerian-born career platform helping licensed nurses discover,
          prepare for, and access remote and telehealth healthcare careers — verified
          license status, a real course pathway, and roles matched to what you&apos;re
          actually eligible for, in one place.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-carinex-white/50">
              Quick Links
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-carinex-white/70 hover:text-carinex-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-carinex-white/50">
              Specializations
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {specializationLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-carinex-white/70 hover:text-carinex-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-carinex-white/50">Legal</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-carinex-white/70 hover:text-carinex-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-carinex-white/50">Lagos, Nigeria (registered address TBD)</p>
          </div>
        </div>

        <p className="mt-10 border-t border-carinex-white/10 pt-6 text-xs text-carinex-white/40">
          © {new Date().getFullYear()} Carinex. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
