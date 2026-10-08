"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RichText from "@/components/RichText";

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  prompt: string;
  options: Option[];
};

type QuizResult = {
  score: number;
  passed: boolean;
  courseCompleted?: boolean;
};

export default function QuizForm({
  nurseId,
  courseId,
  moduleId,
  questions,
  nextHref,
}: {
  nurseId: string;
  courseId: number;
  moduleId: string;
  questions: Question[];
  nextHref: string;
}) {
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);

  function selectOption(questionId: string, optionId: string) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (Object.keys(answers).length < questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nurseId,
          courseId,
          moduleId,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong — try again.");
        return;
      }

      setResult(data);

      if (data.passed) {
        setLeaving(true);
      }
    } catch {
      setError(
        "Unable to submit the quiz. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!result?.passed) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.push(nextHref);
      router.refresh();
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [result?.passed, nextHref, router]);

  if (result) {
    return (
      <div className="rounded-xl border border-carinex-navy/10 p-8 text-center">
        {result.passed ? (
          <div className="animate-[fadeIn_0.35s_ease-out]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-carinex-emerald/10 text-3xl">
              ✓
            </div>

            <p className="mt-4 text-2xl font-bold text-carinex-navy">
              Module complete! 🎉
            </p>

            <p className="mt-2 font-semibold text-carinex-emerald">
              You scored {result.score}% and passed.
            </p>

            <p className="mt-2 text-sm text-carinex-navy/60">
              Taking you to the next module…
            </p>

            <button
              disabled={leaving}
              onClick={() => {
                setLeaving(true);
                router.push(nextHref);
              }}
              className="mt-5 rounded-full bg-carinex-emerald px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-carinex-navy">
              {result.score}%
            </p>

            <p className="mt-2 text-amber-700">
              Not quite — review the lessons and try again.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-carinex-navy px-6 py-2.5 text-sm font-semibold text-white"
            >
              Retake quiz
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {questions.map((question, index) => (
        <div key={question.id}>
          <div className="font-semibold text-carinex-navy">
            <span>{index + 1}. </span>
            <RichText text={question.prompt} />
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {question.options.map((option) => (
              <label
                key={option.id}
                className={`flex items-start gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                  answers[question.id] === option.id
                    ? "border-carinex-emerald bg-carinex-emerald/5"
                    : "border-carinex-navy/20"
                }`}
              >
                <input
                  type="radio"
                  className="mt-1"
                  name={question.id}
                  checked={answers[question.id] === option.id}
                  onChange={() =>
                    selectOption(question.id, option.id)
                  }
                />

                <span className="min-w-0 flex-1 whitespace-pre-wrap">
                  {option.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit quiz"}
      </button>
    </form>
  );
      }
