import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-carinex-navy/10 bg-carinex-navy text-carinex-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <span className="text-lg font-bold">Carinex</span>
            <p className="mt-2 max-w-xs text-sm text-carinex-white/60">
              Your Next Care, Connected. Verified Nigerian nurses, remote-ready
              skills, and real career pathways — in one place.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-carinex-white/50">
              For nurses
            </h3>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-carinex-white/70">
              <li><Link href="/pathways" className="hover:text-carinex-white">Explore pathways</Link></li>
              <li><Link href="/signup" className="hover:text-carinex-white">Create an account</Link></li>
              <li><Link href="/login" className="hover:text-carinex-white">Log in</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-carinex-white/50">
              Company
            </h3>
            <p className="mt-3 text-sm text-carinex-white/60">
              Lagos, Nigeria (registered address TBD)
            </p>
            <p className="text-sm text-carinex-white/60">
              Phone: TBD upon CAC registration
            </p>
          </div>
        </div>

        <p className="mt-10 border-t border-carinex-white/10 pt-6 text-xs text-carinex-white/40">
          © {new Date().getFullYear()} Carinex. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
