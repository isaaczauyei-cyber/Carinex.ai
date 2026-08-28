export default function Footer() {
  return (
    <footer className="border-t border-carinex-navy/10 bg-carinex-navy text-carinex-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="text-lg font-bold">Carinex</span>
            <p className="mt-2 max-w-xs text-sm text-carinex-white/60">
              Your Next Care, Connected.
            </p>
          </div>

          <div className="text-sm text-carinex-white/60">
            <p>Phone: TBD upon CAC registration</p>
            <p>www.carinex.com (domain check pending)</p>
            <p>Lagos, Nigeria (registered address TBD)</p>
          </div>
        </div>

        <p className="mt-10 border-t border-carinex-white/10 pt-6 text-xs text-carinex-white/40">
          © {new Date().getFullYear()} Carinex. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
