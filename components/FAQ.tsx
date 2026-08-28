"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Do I need an active NMCN license to join?",
    answer:
      "You can create an account and explore pathways without one, but an active NMCN license is required for most specializations before you can be matched to real opportunities.",
  },
  {
    question: "How is my license verified?",
    answer:
      "You'll submit your NMCN registration number and license documentation through your profile — this is reviewed manually as part of the MVP, not automated yet.",
  },
  {
    question: "Does Carinex charge nurses?",
    answer:
      "Creating an account and exploring pathways is free. Any future costs will be stated clearly before you're asked to pay for anything.",
  },
  {
    question: "Are the courses run by Carinex?",
    answer:
      "No — courses are curated from established platforms like Coursera. Carinex maps them to what each specialization actually requires, so you're not guessing which course matters.",
  },
  {
    question: "Will it work on my phone and my data plan?",
    answer:
      "Yes — Carinex is built mobile-first, since that's how most nurses will actually use it.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <span className="text-sm font-semibold uppercase tracking-wide text-carinex-emerald">
          Questions
        </span>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-carinex-navy">
          Straight answers before you sign up
        </h2>

        <div className="mt-10 flex flex-col divide-y divide-carinex-navy/10">
          {faqs.map((faq, i) => (
            <div key={faq.question} className="py-5">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-base font-semibold text-carinex-navy">
                  {faq.question}
                </span>
                <span className="ml-4 text-xl text-carinex-navy/50">
                  {openIndex === i ? "−" : "+"}
                </span>
              </button>
              {openIndex === i && (
                <p className="mt-3 text-sm leading-relaxed text-carinex-navy/70">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
