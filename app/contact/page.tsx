import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto max-w-lg px-6 py-20">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Contact
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">Get in touch</h1>
        <p className="mt-2 text-carinex-navy/70">
          Questions about a pathway, your account, or partnering with Carinex — send a message and we&apos;ll respond by email.
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}
