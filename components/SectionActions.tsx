"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Section = {
  id: string;
  section_type: string;
  config: Record<string, unknown>;
};

type Progress = {
  status: string;
  submission_text: string | null;
};

export default function SectionActions({
  nurseId,
  section,
  initialProgress,
  nextHref,
}: {
  nurseId: string;
  section: Section;
  initialProgress: Progress | null;
  nextHref: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialProgress?.status || "not_started");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const completed = status === "completed";

  // Exercise — checklist
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = initialProgress?.submission_text ? JSON.parse(initialProgress.submission_text) : [];
      return new Set(saved);
    } catch {
      return new Set();
    }
  });

  // Exercise (text) / Practical assignment (text) / Training activity (freeform)
  const [textValue, setTextValue] = useState(
    section.section_type !== "exercise" || (section.config.mode as string) !== "checklist"
      ? initialProgress?.submission_text || ""
      : ""
  );

  // Practical assignment — file
  const [file, setFile] = useState<File | null>(null);

  // Training activity — table
  const columns = (section.config.columns as string[]) || [];
  const [rows, setRows] = useState<string[][]>(() => {
    try {
      if (initialProgress?.submission_text) return JSON.parse(initialProgress.submission_text);
    } catch {}
    return Array.from({ length: 4 }, () => columns.map(() => ""));
  });

  function updateCell(rowIdx: number, colIdx: number, value: string) {
    setRows((prev) => {
      const next = prev.map((r) => [...r]);
      next[rowIdx][colIdx] = value;
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, columns.map(() => "")]);
  }

  async function upsertProgress(patch: Record<string, unknown>, finalStatus: string) {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("nurse_section_progress")
      .upsert(
        { nurse_id: nurseId, section_id: section.id, status: finalStatus, completed_at: new Date().toISOString(), ...patch },
        { onConflict: "nurse_id,section_id" }
      );
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStatus(finalStatus);
  }

  async function markSimpleComplete() {
    await upsertProgress({}, "completed");
  }

  function toggleCheck(item: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  async function saveExerciseChecklist() {
    await upsertProgress({ submission_text: JSON.stringify(Array.from(checked)) }, "completed");
  }

  async function saveExerciseText() {
    if (!textValue.trim()) {
      setError("Fill in a response before marking complete.");
      return;
    }
    await upsertProgress({ submission_text: textValue }, "completed");
  }

  async function submitAssignment() {
    const submissionType = section.config.submission_type as string;
    if (submissionType === "file") {
      if (!file) {
        setError("Choose a file to submit.");
        return;
      }
      setSaving(true);
      setError("");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const path = `${user!.id}/${section.id}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("assignment-submissions").upload(path, file);
      if (uploadError) {
        setSaving(false);
        setError("Upload failed: " + uploadError.message);
        return;
      }
      await upsertProgress({ submission_file_url: path }, "completed");
    } else {
      if (!textValue.trim()) {
        setError("Write your response before submitting.");
        return;
      }
      await upsertProgress({ submission_text: textValue }, "completed");
    }
  }

  async function submitActivity() {
    const format = section.config.activity_format as string;
    const payload = format === "table" ? JSON.stringify(rows) : textValue;
    if (format !== "table" && !textValue.trim()) {
      setError("Fill in the activity before submitting.");
      return;
    }
    await upsertProgress({ submission_text: payload }, "completed");
  }

  return (
    <div>
      {/* Interactive body, by type */}
      {section.section_type === "exercise" && section.config.mode === "checklist" && (
        <div className="mx-auto max-w-2xl px-6 pb-6">
          <div className="flex flex-col gap-2">
            {((section.config.items as string[]) || []).map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 rounded-lg border border-carinex-navy/20 px-4 py-3 text-sm text-carinex-navy"
              >
                <input type="checkbox" checked={checked.has(item)} onChange={() => toggleCheck(item)} disabled={completed} />
                {item}
              </label>
            ))}
          </div>
        </div>
      )}

      {section.section_type === "exercise" && section.config.mode === "text" && (
        <div className="mx-auto max-w-2xl px-6 pb-6">
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            disabled={completed}
            rows={6}
            placeholder="Write your response here"
            className="w-full rounded-lg border border-carinex-navy/20 px-4 py-3 focus:border-carinex-emerald focus:outline-none"
          />
        </div>
      )}

      {section.section_type === "practical_assignment" && (
        <div className="mx-auto max-w-2xl px-6 pb-6">
          {section.config.submission_type === "file" ? (
            <input
              type="file"
              disabled={completed}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm text-carinex-navy/70"
            />
          ) : (
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              disabled={completed}
              rows={6}
              placeholder="Write your submission here"
              className="w-full rounded-lg border border-carinex-navy/20 px-4 py-3 focus:border-carinex-emerald focus:outline-none"
            />
          )}
        </div>
      )}

      {section.section_type === "training_activity" && (
        <div className="mx-auto max-w-2xl px-6 pb-6">
          {section.config.activity_format === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="border-b border-carinex-navy/10 p-2 text-left font-semibold text-carinex-navy">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="border-b border-carinex-navy/5 p-2">
                          <input
                            type="text"
                            value={cell}
                            disabled={completed}
                            onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                            className="w-full rounded border border-carinex-navy/15 px-2 py-1.5 text-sm focus:border-carinex-emerald focus:outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!completed && (
                <button onClick={addRow} className="mt-2 text-xs font-semibold text-carinex-emerald hover:underline">
                  + Add row
                </button>
              )}
            </div>
          ) : (
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              disabled={completed}
              rows={6}
              placeholder="Complete the activity here"
              className="w-full rounded-lg border border-carinex-navy/20 px-4 py-3 focus:border-carinex-emerald focus:outline-none"
            />
          )}

          {!!section.config.why_it_matters && (
            <div className="mt-4 rounded-xl border border-carinex-emerald/20 bg-carinex-emerald/5 p-4">
              <p className="text-sm font-bold text-carinex-navy">Why this matters for healthcare AI teams</p>
              <p className="mt-1 text-sm leading-relaxed text-carinex-navy/70">
                {section.config.why_it_matters as string}
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="mx-auto max-w-2xl px-6 pb-3 text-sm text-red-600">{error}</p>}

      <div className="sticky bottom-0 flex items-center justify-between border-t border-carinex-navy/10 bg-white px-6 py-4">
        <button
          onClick={() => {
            if (completed) return;
            if (section.section_type === "exercise") {
              section.config.mode === "checklist" ? saveExerciseChecklist() : saveExerciseText();
            } else if (section.section_type === "practical_assignment") {
              submitAssignment();
            } else if (section.section_type === "training_activity") {
              submitActivity();
            } else {
              markSimpleComplete();
            }
          }}
          disabled={saving || completed}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold ${
            completed ? "bg-carinex-emerald/10 text-carinex-emerald" : "bg-carinex-navy text-carinex-white disabled:opacity-60"
          }`}
        >
          {completed
            ? "✓ Completed"
            : saving
            ? "Saving…"
            : section.section_type === "practical_assignment" || section.section_type === "training_activity"
            ? "Submit"
            : "Mark as completed"}
        </button>

        <button
          onClick={() => router.push(nextHref)}
          aria-label="Next"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-carinex-emerald text-white hover:bg-carinex-emerald/90"
        >
          →
        </button>
      </div>
    </div>
  );
}
