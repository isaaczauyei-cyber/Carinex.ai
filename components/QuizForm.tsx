"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichText from "@/components/RichText";

type Option = { id: string; text: string };
type Question = { id: string; prompt: string; options: Option[] };

export default function QuizForm({ nurseId, courseId, moduleId, questions }: { nurseId: string; courseId: number; moduleId: string; questions: Question[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; courseCompleted?: boolean } | null>(null);
  const [error, setError] = useState("");

  function selectOption(questionId: string, optionId: string) { setAnswers((prev) => ({ ...prev, [questionId]: optionId })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(answers).length < questions.length) { setError("Please answer every question before submitting."); return; }
    setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nurseId, courseId, moduleId, answers }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong — try again."); return; }
      setResult(data);
    } catch { setError("Unable to submit the quiz. Check your connection and try again."); }
    finally { setSubmitting(false); }
  }

  if (result) return (
    <div className="rounded-xl border border-carinex-navy/10 p-6 text-center">
      <p className="text-3xl font-bold text-carinex-navy">{result.score}%</p>
      {result.passed ? <><p className="mt-2 font-semibold text-carinex-emerald">You passed! 🎉</p><button onClick={() => router.push("/dashboard/learning")} className="mt-4 rounded-full bg-carinex-emerald px-6 py-2.5 text-sm font-semibold text-carinex-white">Back to Learning Hub</button></> : <><p className="mt-2 text-amber-700">Not quite — review the lessons and try again.</p><button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-carinex-navy px-6 py-2.5 text-sm font-semibold text-carinex-white">Retake quiz</button></>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {questions.map((q, i) => (
        <div key={q.id}>
          <div className="font-semibold text-carinex-navy"><span>{i + 1}. </span><RichText text={q.prompt} /></div>
          <div className="mt-3 flex flex-col gap-2">
            {q.options.map((opt) => (
              <label key={opt.id} className={`flex items-start gap-3 rounded-lg border px-4 py-2.5 text-sm ${answers[q.id] === opt.id ? "border-carinex-emerald bg-carinex-emerald/5" : "border-carinex-navy/20"}`}>
                <input type="radio" className="mt-1" name={q.id} checked={answers[q.id] === opt.id} onChange={() => selectOption(q.id, opt.id)} />
                <span className="min-w-0 flex-1 whitespace-pre-wrap">{opt.text}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="rounded-full bg-carinex-emerald px-8 py-3 text-sm font-semibold text-carinex-white disabled:opacity-60">{submitting ? "Submitting…" : "Submit quiz"}</button>
    </form>
  );
}
