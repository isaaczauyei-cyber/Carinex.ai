import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-md px-6 py-24">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Welcome back
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Log in
        </h1>
        <p className="mt-3 text-carinex-navy/70">
          Enter your details to continue to your dashboard.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-carinex-navy/60">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-semibold text-carinex-emerald hover:underline">
            Sign up
          </a>
        </p>
      </section>

      <Footer />
    </main>
  );
}
