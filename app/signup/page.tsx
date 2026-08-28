import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SignUpForm from "@/components/SignUpForm";

export default function SignUpPage() {
  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-md px-6 py-24">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Get Started
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Create your account
        </h1>
        <p className="mt-3 text-carinex-navy/70">
          Sign up to explore pathways, track courses, and build your profile.
        </p>

        <div className="mt-8">
          <SignUpForm />
        </div>

        <p className="mt-6 text-center text-sm text-carinex-navy/60">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-carinex-emerald hover:underline">
            Log in
          </a>
        </p>
      </section>

      <Footer />
    </main>
  );
}
