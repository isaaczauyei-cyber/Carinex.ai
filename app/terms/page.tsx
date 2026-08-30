import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-2xl px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Legal
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-sm text-carinex-navy/50">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-8 flex flex-col gap-6 text-carinex-navy/80">
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            This is a placeholder Terms and Conditions page. Carinex is
            pre-launch and this document has not yet been reviewed by a
            lawyer. Do not treat this as a final or legally binding
            agreement until it has been properly drafted and reviewed.
          </p>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">1. About Carinex</h2>
            <p className="mt-2">
              Carinex is a platform helping licensed nurses discover, prepare
              for, and access remote and telehealth healthcare career
              opportunities. By creating an account, you agree to these
              terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">2. Your account</h2>
            <p className="mt-2">
              You&apos;re responsible for the accuracy of information you
              provide, including license status and course completion
              claims. Submitting false license information may result in
              account suspension.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">3. Courses and opportunities</h2>
            <p className="mt-2">
              Courses linked from Carinex are hosted by third-party
              providers (such as Coursera) and are not created or delivered
              by Carinex. Job and opportunity listings are provided by
              third-party employers; Carinex does not guarantee employment
              outcomes.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">4. Changes</h2>
            <p className="mt-2">
              These terms may be updated as Carinex develops. Continued use
              of the platform after changes constitutes acceptance of the
              updated terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">5. Contact</h2>
            <p className="mt-2">
              Questions about these terms can be sent through our{" "}
              <a href="/contact" className="font-semibold text-carinex-emerald hover:underline">
                contact page
              </a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
