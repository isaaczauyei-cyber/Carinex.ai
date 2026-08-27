import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main>
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-24">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Dashboard
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Welcome{user.email ? `, ${user.email}` : ""}
        </h1>
        <p className="mt-3 max-w-xl text-carinex-navy/70">
          Your profile, license status, chosen pathway, and course progress
          will live here as those pieces get built out.
        </p>

        <div className="mt-10">
          <LogoutButton />
        </div>
      </section>

      <Footer />
    </main>
  );
}
