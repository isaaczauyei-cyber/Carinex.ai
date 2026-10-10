import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Legal</span>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-carinex-navy">Privacy Policy</h1>
        <p className="mt-2 text-sm text-carinex-navy/50">Last updated: October 2026</p>

        <div className="mt-10 flex flex-col gap-10 text-carinex-navy/80">
          <p className="leading-relaxed">
            Carinex (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) helps licensed Nigerian nurses discover,
            prepare for, and access remote and telehealth healthcare careers. This policy explains what
            information we collect, why we collect it, and how it&apos;s protected.
          </p>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">1. Information we collect</h2>
            <ul className="mt-3 flex flex-col gap-2 leading-relaxed">
              <li><strong className="text-carinex-navy">Account information</strong> — your name, email, and phone number when you register.</li>
              <li><strong className="text-carinex-navy">Professional information</strong> — your NMCN license status, years of clinical experience, clinical background, work experience, external certifications, and career goals, which you provide to build your profile and match you to specializations.</li>
              <li><strong className="text-carinex-navy">Course and verification data</strong> — courses you&apos;ve started or completed, quiz scores, exercise and assignment responses, and any certificate files or assignment files you upload for admin review.</li>
              <li><strong className="text-carinex-navy">Usage data</strong> — pages you visit and when you&apos;re active on Carinex, collected by us directly (not by a third-party analytics service) so we can improve the platform and track your progress.</li>
              <li><strong className="text-carinex-navy">Payment information</strong> — if you purchase a paid course, your transaction is processed by Flutterwave . We do not store your card details ourselves.</li>
              <li><strong className="text-carinex-navy">Device information</strong> — browser type and IP address, for security purposes.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">2. How we use your information</h2>
            <ul className="mt-3 flex flex-col gap-2 leading-relaxed">
              <li>To create and manage your Carinex account.</li>
              <li>To match you with specializations and career pathways based on your real eligibility.</li>
              <li>To review and verify course completion certificates and in-house course submissions.</li>
              <li>To process payments for any paid course you choose to purchase.</li>
              <li>To understand how the platform is used, so we can fix problems and improve it.</li>
              <li>To send you account-related emails, such as password resets and submission confirmations.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">3. Data sharing</h2>
            <p className="mt-2 leading-relaxed">
              We do not sell your personal data. We share data only with trusted services necessary to run Carinex:
            </p>
            <ul className="mt-3 flex flex-col gap-2 leading-relaxed">
              <li><strong className="text-carinex-navy">Supabase</strong> — our database, authentication, and file storage infrastructure.</li>
              <li><strong className="text-carinex-navy">Resend</strong> — delivery of account and notification emails.</li>
              <li><strong className="text-carinex-navy">Flutterwave</strong> — payment processing for paid courses. We never receive or store your full card details.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              If you apply to a job listed on Carinex, you&apos;ll be taken to the employer&apos;s own
              application page — Carinex does not control what that employer does with information you
              submit there, and their own privacy policy applies to that step.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">4. Data retention</h2>
            <p className="mt-2 leading-relaxed">
              We keep your personal data only as long as needed to provide your account, resolve disputes,
              prevent fraud, and meet legal obligations. If you ask us to delete your account, we&apos;ll do
              so subject to records we&apos;re required to keep for payment, security, or legal reasons.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">5. Your rights under the Nigeria Data Protection Act</h2>
            <p className="mt-2 leading-relaxed">
              Under the Nigeria Data Protection Act 2023, you may have the right to:
            </p>
            <ul className="mt-3 flex flex-col gap-2 leading-relaxed">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Object to certain processing of your data.</li>
              <li>Withdraw consent where processing relies on it.</li>
              <li>Request restriction or portability of your data, where applicable.</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:support@carinex.info" className="font-semibold text-carinex-emerald hover:underline">
                support@carinex.info
              </a>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">6. Security</h2>
            <p className="mt-2 leading-relaxed">
              We use encrypted connections (HTTPS) and Supabase Row Level Security to keep your data
              compartmentalized — nurses can only see their own records, and admin access is restricted and
              logged. No method of transmission over the internet is completely secure, but we take
              reasonable precautions to protect your information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-carinex-navy">7. Contact</h2>
            <p className="mt-2 leading-relaxed">
              Questions about this policy? Email us at{" "}
              <a href="mailto:support@carinex.info" className="font-semibold text-carinex-emerald hover:underline">
                support@carinex.info
              </a>.
            </p>
          </div>

          <div className="border-t border-carinex-navy/10 pt-10">
            <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">Cookie Policy</span>
            <h2 className="mt-2 text-2xl font-bold text-carinex-navy">How we use cookies</h2>

            <div className="mt-6 flex flex-col gap-6">
              <div>
                <h3 className="font-bold text-carinex-navy">Authentication cookies</h3>
                <p className="mt-1 text-sm text-carinex-navy/60">Strictly necessary — provided by Supabase</p>
                <p className="mt-2 leading-relaxed">
                  Keep you signed in between visits. Carinex cannot function without these — disabling them
                  will prevent you from logging in.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-carinex-navy">Usage tracking</h3>
                <p className="mt-1 text-sm text-carinex-navy/60">First-party — collected directly by Carinex</p>
                <p className="mt-2 leading-relaxed">
                  We record which pages you visit and when you were last active, directly on our own servers
                  — not through a third-party ad or analytics network. This helps us understand how the
                  platform is used and lets you (and our admin team, for verification purposes) see your own
                  activity and progress.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-carinex-navy">Cookie consent preference</h3>
                <p className="mt-1 text-sm text-carinex-navy/60">Stored in your browser&apos;s local storage</p>
                <p className="mt-2 leading-relaxed">
                  Remembers whether you&apos;ve accepted or declined our cookie banner, so we don&apos;t ask
                  again on every visit.
                </p>
              </div>
            </div>

            <p className="mt-6 leading-relaxed">
              You can control cookies through your browser settings. Disabling authentication cookies will
              prevent you from logging in to Carinex.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
