"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; text: string };
type Question = { id: string; prompt: string; options: Option[] };

export default function QuizForm({
  nurseId,
  courseId,
  moduleId,
  questions,
}: {
  nurseId: string;
  courseId: number;
  moduleId: string;
  questions: Question[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; courseCompleted: boolean } | null>(null);
  const [error, setError] = useState("");

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (Object.keys(answers).length < questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }

    setError("");
    setSubmitting(true);

    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nurseId, courseId, moduleId, answers }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong — try again.");
      return;
    }

    setResult(data);
  }

  if (result) {
    return (
      <div className="rounded-xl border border-carinex-navy/10 p-6 text-center">
        <p className="text-3xl font-bold text-carinex-navy">{result.score}%</p>
        {result.passed ? (
          result.courseCompleted ? (
            <>
              <p className="mt-2 text-lg font-bold text-carinex-emerald">
                🎉 You've completed the full course!
              </p>
              <p className="mt-1 text-sm text-carinex-navy/60">
                Every module is passed — this course now shows as completed.
              </p>
              <button
                onClick={() => router.push("/dashboard/learning")}
                className="mt-4 rounded-full bg-carinex-emerald px-6 py-2.5 text-sm font-semibold text-carinex-white"
              >
                Back to Learning Hub
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 font-semibold text-carinex-emerald">Module passed! 🎉</p>
              <p className="mt-1 text-sm text-carinex-navy/60">
                Other modules still need their quizzes passed before the course is marked complete.
              </p>
              <button
                onClick={() => router.push("/dashboard/learning")}
                className="mt-4 rounded-full bg-carinex-emerald px-6 py-2.5 text-sm font-semibold text-carinex-white"
              >
                Back to Learning Hub
              </button>
            </>
          )
        ) : (
          <>
            <p className="mt-2 text-amber-700">Not quite — review the material and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-carinex-navy px-6 py-2.5 text-sm font-semibold text-carinex-white"
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
      {questions.map((q, i) => (
        <div key={q.id}>
          <p className="font-semibold text-carinex-navy">
            {i + 1}. {q.prompt}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {q.options.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                  answers[q.id] === opt.id
                    ? "border-carinex-emerald bg-carinex-emerald/5"
                    : "border-carinex-navy/20"
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => selectOption(q.id, opt.id)}
                />
                {opt.text}
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-carinex-white disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit quiz"}
      </button>
    </form>
  );
}
