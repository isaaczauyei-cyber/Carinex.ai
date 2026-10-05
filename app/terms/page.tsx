import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Legal</span>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-carinex-navy">Terms of Service</h1>
        <p className="mt-2 text-sm text-carinex-navy/50">Last updated: October 2026</p>

        <div className="mt-10 flex flex-col gap-10 text-carinex-navy/80">
          <p className="leading-relaxed">
            These Terms of Service govern your use of Carinex. By creating an account or using the platform,
            you agree to these terms. Please read them carefully.
          </p>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">1. Who can use Carinex</h2>
            <p className="mt-2 leading-relaxed">
              Carinex is intended for licensed or license-eligible nurses preparing for or working in remote
              and telehealth healthcare roles. You must be at least 18 years old to create an account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">2. Your account</h2>
            <ul className="mt-3 flex flex-col gap-2 leading-relaxed">
              <li>You are responsible for keeping your login credentials secure.</li>
              <li>You must not share your account with others.</li>
              <li>You must provide accurate information, including your NMCN license status — submitting false licensure information may result in account suspension.</li>
              <li>You can request deletion of your account at any time.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">3. Course content and intellectual property</h2>
            <ul className="mt-3 flex flex-col gap-2 leading-relaxed">
              <li>In-house courses built by Carinex — including module content, exercises, and assessments — remain the intellectual property of Carinex.</li>
              <li>You may not copy, reproduce, or redistribute in-house course content outside the platform.</li>
              <li>External courses linked from Carinex (e.g. via Coursera or edX) are governed by that provider&apos;s own terms, not ours.</li>
              <li>Carinex&apos;s branding, design, and software are owned by Carinex and may not be reused without permission.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">4. Payments and access</h2>
            <ul className="mt-3 flex flex-col gap-2 leading-relaxed">
              <li>Some in-house courses require a one-time purchase, processed via [PAYMENT PROCESSOR — confirm].</li>
              <li>Once a course is unlocked, access is granted to your account only and may not be shared or resold.</li>
              <li>Refund policy: refunds available within 24 hours of purchase if no module content has been started. Contact support@carinex.info to request a refund.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">5. Job listings and employer applications</h2>
            <p className="mt-2 leading-relaxed">
              Carinex shows job opportunities from third-party employers once you meet a specialization&apos;s
              requirements. Applying to a listed role takes you to the employer&apos;s own application
              process — Carinex is not a party to that employment relationship and doesn&apos;t guarantee any
              outcome of an application.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">6. Acceptable use</h2>
            <p className="mt-2 leading-relaxed">You agree not to:</p>
            <ul className="mt-3 flex flex-col gap-2 leading-relaxed">
              <li>Submit false licensure, certification, or identity information.</li>
              <li>Attempt to access other users&apos; accounts or data.</li>
              <li>Scrape, copy, or automate requests to the platform.</li>
              <li>Upload false, harmful, or misleading content in course submissions, assignments, or your profile.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">7. Account suspension</h2>
            <p className="mt-2 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms, misrepresent
              licensure, or engage in fraudulent activity. Where possible, we&apos;ll notify you by email
              before taking action.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">8. Disclaimer</h2>
            <p className="mt-2 leading-relaxed">
              Carinex is a career-readiness and verification platform. We do not guarantee employment, visa
              status, or that any specific job opportunity remains available. Course content is provided for
              educational and professional-development purposes and should not replace official licensing
              requirements or professional guidance in your target country.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">9. Governing law</h2>
            <p className="mt-2 leading-relaxed">
              These terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be
              resolved in Nigerian courts.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">10. Changes to these terms</h2>
            <p className="mt-2 leading-relaxed">
              We may update these terms from time to time. We&apos;ll notify you by email of any significant
              changes. Continued use of Carinex after changes means you accept the updated terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">11. Contact</h2>
            <p className="mt-2 leading-relaxed">
              Questions about these terms? Email{" "}
              <a href="mailto:support@carinex.info" className="font-semibold text-carinex-emerald hover:underline">
                support@carinex.info
              </a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
