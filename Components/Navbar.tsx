import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/pathways", label: "Pathways" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-carinex-navy/10 bg-carinex-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/carinex-logo.svg" alt="Carinex" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-bold tracking-tight text-carinex-navy">
            Carinex
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-carinex-navy/70 transition hover:text-carinex-navy"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-carinex-navy/70 transition hover:text-carinex-navy sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-carinex-emerald px-5 py-2.5 text-sm font-semibold text-carinex-white transition hover:bg-carinex-emerald/90"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
