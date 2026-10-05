"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RichText from "@/components/RichText";
import RichTextEditor from "@/components/RichTextEditor";

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
  const [hasSaved, setHasSaved] = useState(initialProgress?.status === "completed");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = initialProgress?.submission_text ? JSON.parse(initialProgress.submission_text) : [];
      return new Set(saved);
    } catch {
      return new Set();
    }
  });

  const [textValue, setTextValue] = useState(
    section.section_type !== "exercise" || (section.config.mode as string) !== "checklist"
      ? initialProgress?.submission_text || ""
      : ""
  );

  const [file, setFile] = useState<File | null>(null);

  const columns = (section.config.columns as string[]) || [];
  const rowLabels = (section.config.row_labels as string[]) || [];
  const hasRowLabels = rowLabels.length > 0;
  const editableColumns = hasRowLabels ? columns.slice(1) : columns;

  const [rows, setRows] = useState<string[][]>(() => {
    try {
      if (initialProgress?.submission_text) {
        const parsed = JSON.parse(initialProgress.submission_text);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    const rowCount = hasRowLabels ? rowLabels.length : 4;
    const width = hasRowLabels ? editableColumns.length : columns.length;
    return Array.from({ length: rowCount }, () => Array.from({ length: width }, () => ""));
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

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function upsertProgress(patch: Record<string, unknown>) {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("nurse_section_progress")
      .upsert(
        { nurse_id: nurseId, section_id: section.id, status: "completed", completed_at: new Date().toISOString(), ...patch },
        { onConflict: "nurse_id,section_id" }
      );
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setHasSaved(true);
  }

  async function markSimpleComplete() {
    await upsertProgress({});
  }

  function toggleCheck(item: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  async function saveExerciseChecklist() {
    await upsertProgress({ submission_text: JSON.stringify(Array.from(checked)) });
  }

  async function saveExerciseText() {
    if (!textValue.trim()) {
      setError("Fill in a response before saving.");
      return;
    }
    await upsertProgress({ submission_text: textValue });
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
      await upsertProgress({ submission_file_url: path });
    } else {
      if (!textValue.trim()) {
        setError("Write your response before submitting.");
        return;
      }
      await upsertProgress({ submission_text: textValue });
    }
  }

  async function submitActivity() {
    const format = section.config.activity_format as string;
    const payload = format === "table" ? JSON.stringify(rows) : textValue;
    if (format !== "table" && !textValue.trim()) {
      setError("Fill in the activity before submitting.");
      return;
    }
    await upsertProgress({ submission_text: payload });
  }

  function handleSave() {
    if (section.section_type === "exercise") {
      section.config.mode === "checklist" ? saveExerciseChecklist() : saveExerciseText();
    } else if (section.section_type === "practical_assignment") {
      submitAssignment();
    } else if (section.section_type === "training_activity") {
      submitActivity();
    } else {
      markSimpleComplete();
    }
  }

  const needsInteractiveBody = ["exercise", "practical_assignment", "training_activity"].includes(section.section_type);

  return (
    <div>
      {section.section_type === "exercise" && section.config.mode === "checklist" && (
        <div className="mx-auto max-w-2xl px-6 pb-6">
          <div className="flex flex-col gap-2">
            {((section.config.items as string[]) || []).map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 rounded-lg border border-carinex-navy/20 px-4 py-3 text-sm text-carinex-navy"
              >
                <input type="checkbox" checked={checked.has(item)} onChange={() => toggleCheck(item)} />
                <span className="min-w-0 flex-1"><RichText text={item} /></span>
              </label>
            ))}
          </div>
        </div>
      )}

      {section.section_type === "exercise" && section.config.mode === "text" && (
        <div className="mx-auto max-w-2xl px-6 pb-6">
          <RichTextEditor
            value={textValue}
            onSave={setTextValue}
            rows={6}
            placeholder="Write your response here"
          />
        </div>
      )}

      {section.section_type === "practical_assignment" && (
        <div className="mx-auto max-w-2xl px-6 pb-6">
          {section.config.submission_type === "file" ? (
            <div className="flex flex-col gap-2">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-carinex-navy/70"
              />
              {hasSaved && !file && (
                <p className="text-xs text-carinex-navy/50">
                  A file was submitted previously. Choose a new one to replace it.
                </p>
              )}
            </div>
          ) : (
            <RichTextEditor
              value={textValue}
              onSave={setTextValue}
              rows={6}
              placeholder="Write your submission here"
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
                      <th key={col} className="border border-carinex-navy/20 bg-carinex-navy/[0.03] p-2 text-left font-semibold text-carinex-navy">
                        <RichText text={col} />
                      </th>
                    ))}
                    {!hasRowLabels && <th className="border-b border-carinex-navy/10 p-2" />}
                  </tr>
                </thead>
                <tbody>
                  {hasRowLabels
                    ? rowLabels.map((label, rIdx) => (
                        <tr key={rIdx}>
                          <td className="border border-carinex-navy/15 p-2 align-top text-sm text-carinex-navy">
                            <RichText text={label} />
                          </td>
                          {editableColumns.map((_, cIdx) => (
                            <td key={cIdx} className="border border-carinex-navy/15 p-2">
                              <input
                                type="text"
                                value={rows[rIdx]?.[cIdx] || ""}
                                onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                placeholder="Enter your response"
                                className="w-full rounded border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))
                    : rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-carinex-navy/15 p-2">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                placeholder="Enter your response"
                                className="w-full rounded border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
                              />
                            </td>
                          ))}
                          <td className="border border-carinex-navy/15 p-2">
                            <button
                              type="button"
                              onClick={() => removeRow(rIdx)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {!hasRowLabels && (
                <button onClick={addRow} type="button" className="mt-2 text-xs font-semibold text-carinex-emerald hover:underline">
                  + Add row
                </button>
              )}
            </div>
          ) : (
            <RichTextEditor
              value={textValue}
              onSave={setTextValue}
              rows={6}
              placeholder="Complete the activity here"
            />
          )}

          {!!section.config.why_it_matters && (
            <div className="mt-4 rounded-xl border border-carinex-emerald/20 bg-carinex-emerald/5 p-4">
              <p className="text-sm font-bold text-carinex-navy">Why this matters for healthcare AI teams</p>
              <div className="mt-1">
                <RichText text={section.config.why_it_matters as string} />
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mx-auto max-w-2xl px-6 pb-3 text-sm text-red-600">{error}</p>}

      <div className="sticky bottom-0 flex items-center justify-between border-t border-carinex-navy/10 bg-white px-6 py-4">
        {needsInteractiveBody ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-carinex-navy px-6 py-2.5 text-sm font-semibold text-carinex-white disabled:opacity-60"
          >
            {saving ? "Saving…" : hasSaved ? "Save changes" : section.section_type === "exercise" ? "Mark as completed" : "Submit"}
          </button>
        ) : (
          <button
            onClick={markSimpleComplete}
            disabled={saving || hasSaved}
            className={`rounded-full px-6 py-2.5 text-sm font-semibold ${
              hasSaved ? "bg-carinex-emerald/10 text-carinex-emerald" : "bg-carinex-navy text-carinex-white disabled:opacity-60"
            }`}
          >
            {hasSaved ? "✓ Completed" : saving ? "Saving…" : "Mark as completed"}
          </button>
        )}

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