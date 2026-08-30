import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-2xl px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Legal
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-carinex-navy/50">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-8 flex flex-col gap-6 text-carinex-navy/80">
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            This is a placeholder Privacy Policy. Carinex is pre-launch and
            this document has not yet been reviewed by a lawyer. Do not
            treat this as final until properly drafted and reviewed,
            especially before handling sensitive data like license
            documents at scale.
          </p>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">1. What we collect</h2>
            <p className="mt-2">
              When you create an account, we collect your name, email, and
              password (handled securely via Supabase Auth — we never see
              or store your raw password). As you use Carinex, we store
              information you choose to add: your bio, skills, services,
              experience, certifications, license status, and course
              progress, including any certificate files you upload for
              course verification.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">2. How we use it</h2>
            <p className="mt-2">
              Your information is used to run your dashboard, track pathway
              and course progress, and determine which opportunities you&apos;re
              eligible to see. We do not sell your personal information.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">3. Storage and security</h2>
            <p className="mt-2">
              Data is stored with Supabase, with row-level security policies
              restricting access so that, in general, only you (and Carinex
              admins, for verification purposes) can see your own profile
              data. Uploaded certificates are stored in a private file
              bucket, not publicly accessible.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">4. Third parties</h2>
            <p className="mt-2">
              Course links take you to third-party platforms (like Coursera)
              with their own privacy policies. Applying to a job listing
              takes you to the employer&apos;s own application process,
              outside of Carinex.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-carinex-navy">5. Contact</h2>
            <p className="mt-2">
              Questions about your data can be sent through our{" "}
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
