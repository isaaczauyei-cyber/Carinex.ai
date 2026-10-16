"use client";

import { useEffect, useState } from "react";
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
  submission_file_url?: string | null;
};

const modes = ["none", "table", "freeform", "checklist", "text", "file"];

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
  const [hasSaved, setHasSaved] = useState(
    initialProgress?.status === "completed"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mode = getMode(section);

  const columns = (section.config.columns as string[]) || [];
  const rowLabels = (section.config.row_labels as string[]) || [];

  const adminRows = normalizeRows(
    section.config.table_rows,
    rowLabels.length,
    Math.max(columns.length - 1, 1)
  );

  /*
   * Learner responses are stored separately from the admin's
   * fixed values, but in the same table structure.
   *
   * If an admin cell contains text, that value always wins.
   * If the admin cell is empty, the learner's saved response
   * is used.
   */
  const getSavedRows = (): string[][] => {
    try {
      const saved = initialProgress?.submission_text
        ? JSON.parse(initialProgress.submission_text)
        : null;

      if (Array.isArray(saved)) {
        return saved;
      }
    } catch {}

    return [];
  };

  const buildLearnerRows = (
    fixedRows: string[][],
    savedRows: unknown
  ): string[][] => {
    const saved = Array.isArray(savedRows)
      ? (savedRows as unknown[])
      : [];

    return fixedRows.map((adminRow, rIdx) =>
      adminRow.map((adminValue, cIdx) => {
        /*
         * Non-empty admin value is fixed.
         */
        if (adminValue.trim() !== "") {
          return adminValue;
        }

        /*
         * Empty admin cell remains available to the learner.
         */
        const savedRow = Array.isArray(saved[rIdx])
          ? (saved[rIdx] as unknown[])
          : [];

        return String(savedRow[cIdx] ?? "");
      })
    );
  };

  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = initialProgress?.submission_text
        ? JSON.parse(initialProgress.submission_text)
        : [];

      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  });

  const [textValue, setTextValue] = useState(
    mode !== "checklist" && mode !== "table"
      ? initialProgress?.submission_text || ""
      : ""
  );

  const [rows, setRows] = useState<string[][]>(() => {
    return buildLearnerRows(adminRows, getSavedRows());
  });

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (mode === "table") {
      setRows(buildLearnerRows(adminRows, getSavedRows()));
    }
  }, [
    section.id,
    section.config.table_rows,
    section.config.row_labels,
    section.config.columns,
    mode,
  ]);

  function isAdminCell(rowIdx: number, colIdx: number) {
    return (adminRows[rowIdx]?.[colIdx] || "").trim() !== "";
  }

  function updateCell(
    rowIdx: number,
    colIdx: number,
    value: string
  ) {
    /*
     * Never allow the learner to modify an admin-filled cell.
     */
    if (isAdminCell(rowIdx, colIdx)) {
      return;
    }

    setRows((prev) => {
      const next = prev.map((r) => [...r]);

      if (!next[rowIdx]) {
        next[rowIdx] = [];
      }

      next[rowIdx][colIdx] = value;

      return next;
    });
  }

  async function upsertProgress(
    patch: Record<string, unknown>
  ): Promise<boolean> {
    setSaving(true);
    setError("");

    const supabase = createClient();

    const { error: err } = await supabase
      .from("nurse_section_progress")
      .upsert(
        {
          nurse_id: nurseId,
          section_id: section.id,
          status: "completed",
          completed_at: new Date().toISOString(),
          ...patch,
        },
        {
          onConflict: "nurse_id,section_id",
        }
      );

    setSaving(false);

    if (err) {
      setError(err.message);
      return false;
    }

    setHasSaved(true);
    return true;
  }

  async function submit() {
    if (section.section_type === "course_material" || mode === "none") {
      const saved = await upsertProgress({ submission_text: null, submission_file_url: null });
      if (saved && section.section_type === "course_material") router.push(nextHref);
      return;
    }

    if (mode === "checklist") {
      await upsertProgress({
        submission_text: JSON.stringify(
          Array.from(checked)
        ),
      });
      return;
    }

    if (mode === "table") {
      /*
       * Save the complete table.
       *
       * Admin-filled cells remain exactly as configured.
       * Learner responses are saved only in cells that were
       * left empty by the admin.
       */
      const finalRows = rows.map((row, rIdx) =>
        row.map((value, cIdx) => {
          const adminValue =
            adminRows[rIdx]?.[cIdx] || "";

          return adminValue.trim() !== ""
            ? adminValue
            : value;
        })
      );

      await upsertProgress({
        submission_text: JSON.stringify(finalRows),
      });

      return;
    }

    if (mode === "file") {
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

      if (!user) {
        setSaving(false);
        setError("Please sign in again.");
        return;
      }

      const path = `${user.id}/${section.id}-${Date.now()}-${file.name.replace(
        /\s+/g,
        "-"
      )}`;

      const { error: uploadError } = await supabase.storage
        .from("assignment-submissions")
        .upload(path, file);

      if (uploadError) {
        setSaving(false);
        setError(
          "Upload failed: " + uploadError.message
        );
        return;
      }

      await upsertProgress({
        submission_file_url: path,
      });

      return;
    }

    if (!textValue.trim()) {
      setError(
        "Fill in your response before submitting."
      );
      return;
    }

    await upsertProgress({
      submission_text: textValue,
    });
  }

  const responseBlocks = Array.isArray(section.config.response_blocks) ? section.config.response_blocks as any[] : [];

  if (responseBlocks.length > 0) {
    return <MultiFunctionSubmission
      nurseId={nurseId}
      section={section}
      blocks={responseBlocks}
      initialProgress={initialProgress}
      nextHref={nextHref}
    />;
  }

  return (
    <div>
      {section.section_type === "course_material" &&
        !!section.config.file_url && (
          <CourseMaterialMedia config={section.config} />
        )}

      {mode === "checklist" && (
        <div className="mx-auto flex max-w-2xl flex-col gap-2 px-6 pb-6">
          {((section.config.items as string[]) || []).map(
            (item) => (
              <label
                key={item}
                className="flex items-center gap-3 rounded-lg border border-carinex-navy/20 px-4 py-3 text-sm text-carinex-navy"
              >
                <input
                  type="checkbox"
                  checked={checked.has(item)}
                  onChange={() =>
                    setChecked((prev) => {
                      const next = new Set(prev);

                      if (next.has(item)) {
                        next.delete(item);
                      } else {
                        next.add(item);
                      }

                      return next;
                    })
                  }
                />

                <span className="min-w-0 flex-1">
                  {item}
                </span>
              </label>
            )
          )}
        </div>
      )}

      {mode === "table" && (
        <div className="mx-auto w-full max-w-5xl px-2 pb-6 sm:px-6">
          {/* Keep the same tabular layout on every screen size.
              On narrow screens, learners can scroll horizontally rather than
              having the table converted into stacked cards or squeezed. */}
          <div className="w-full overflow-x-auto rounded-lg border border-carinex-navy/20">
            <table className="w-full min-w-[900px] table-auto border-collapse text-sm">
              <thead>
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={`${col}-${index}`}
                      className={`border border-carinex-navy/20 bg-carinex-navy/[0.03] p-3 text-left font-semibold text-carinex-navy ${
                        index === 0 ? "min-w-[170px]" : "min-w-[190px]"
                      }`}
                    >
                      <div className="whitespace-normal break-words">{col}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowLabels.map((label, rIdx) => (
                  <tr key={rIdx}>
                    <td className="min-w-[170px] border border-carinex-navy/20 p-3 align-top font-medium text-carinex-navy">
                      <div className="whitespace-normal break-words">{label}</div>
                    </td>
                    {(rows[rIdx] || []).map((cell, cIdx) => {
                      const fixed = isAdminCell(rIdx, cIdx);
                      const columnLabel = columns[cIdx + 1] || `Response ${cIdx + 1}`;
                      return (
                        <td
                          key={cIdx}
                          className="min-w-[190px] border border-carinex-navy/20 p-2 align-top"
                        >
                          {fixed ? (
                            <div className="w-full whitespace-pre-wrap break-words leading-relaxed text-carinex-navy">
                              {cell}
                            </div>
                          ) : (
                            <textarea
                              value={cell}
                              onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                              rows={4}
                              className="block min-h-[100px] w-full resize-y rounded border border-carinex-navy/20 bg-white px-3 py-2 text-sm leading-6 text-carinex-navy placeholder:text-carinex-navy/40 focus:border-carinex-emerald focus:outline-none"
                              placeholder={`Enter ${columnLabel.toLowerCase()}…`}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-carinex-navy/60 sm:hidden">
            Swipe left or right to view all table columns.
          </p>
        </div>
      )}

      {(mode === "freeform" || mode === "text") && (
        <div className="mx-auto max-w-2xl px-6 pb-6">
          <textarea
            value={textValue}
            onChange={(e) =>
              setTextValue(e.target.value)
            }
            rows={8}
            placeholder={
              mode === "freeform"
                ? "Write your response here"
                : "Fill in your answer here"
            }
            className="w-full rounded-lg border border-carinex-navy/20 px-4 py-3 focus:border-carinex-emerald focus:outline-none"
          />
        </div>
      )}

      {mode === "file" && (
        <div className="mx-auto max-w-2xl px-6 pb-6">
          <input
            type="file"
            onChange={(e) =>
              setFile(
                e.target.files?.[0] || null
              )
            }
            className="text-sm text-carinex-navy/70"
          />

          {initialProgress?.submission_file_url &&
            !file && (
              <p className="mt-2 text-xs text-carinex-navy/50">
                A file was submitted previously. Choose a
                new file to replace it.
              </p>
            )}
        </div>
      )}

      {error && (
        <p className="mx-auto max-w-2xl px-6 pb-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 flex items-center justify-between border-t border-carinex-navy/10 bg-white px-6 py-4">
        <button
          onClick={() => void submit()}
          disabled={saving || ((section.section_type === "course_material" || mode === "none") && hasSaved)}
          className="rounded-full bg-carinex-navy px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving
            ? "Saving…"
            : (section.section_type === "course_material" || mode === "none")
            ? hasSaved ? "Completed" : "Mark as complete"
            : hasSaved
            ? "Save changes"
            : "Submit"}
        </button>

        <a
          href={nextHref}
          aria-label="Next"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-carinex-emerald text-white hover:bg-carinex-emerald/90"
        >
          →
        </a>
      </div>
    </div>
  );
}

type ResponseBlock = {
  id: string;
  type: "instructions" | "text" | "table" | "checklist" | "file";
  title?: string;
  content?: string;
  prompt?: string;
  required?: boolean;
  items?: string[];
  columns?: string[];
  row_labels?: string[];
  table_rows?: string[][];
};

function MultiFunctionSubmission({
  nurseId,
  section,
  blocks,
  initialProgress,
  nextHref,
}: {
  nurseId: string;
  section: Section;
  blocks: ResponseBlock[];
  initialProgress: Progress | null;
  nextHref: string;
}) {
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const parsed = initialProgress?.submission_text ? JSON.parse(initialProgress.submission_text) : {};
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch { return {}; }
  });
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(initialProgress?.status === "completed");

  function updateAnswer(id: string, value: any) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  async function submit() {
    setError("");
    for (const block of blocks) {
      if (block.required === false || block.type === "instructions") continue;
      if (block.type === "text" && !String(answers[block.id] || "").trim()) {
        setError(`Complete “${block.title || "Written response"}” before submitting.`); return;
      }
      if (block.type === "file" && !files[block.id] && !answers[block.id]?.path) {
        setError(`Choose a file for “${block.title || "File submission"}”.`); return;
      }
      if (block.type === "checklist" && !(Array.isArray(answers[block.id]) && answers[block.id].length)) {
        setError(`Complete “${block.title || "Checklist"}” before submitting.`); return;
      }
      if (block.type === "table") {
        const rows = Array.isArray(answers[block.id]) ? answers[block.id] as unknown[] : [];
        const hasResponse = rows.some((row) => Array.isArray(row) && row.some((cell) => String(cell || "").trim()));
        if (!hasResponse) { setError(`Enter at least one response in “${block.title || "Exercise table"}”.`); return; }
      }
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");
      const payload: Record<string, any> = { ...answers };
      for (const [blockId, file] of Object.entries(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${user.id}/${section.id}/${blockId}-${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("assignment-submissions").upload(path, file, { upsert: false });
        if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);
        payload[blockId] = { path, name: file.name, size: file.size, type: file.type };
      }
      const { error: saveError } = await supabase.from("nurse_section_progress").upsert({
        nurse_id: nurseId,
        section_id: section.id,
        status: "completed",
        completed_at: new Date().toISOString(),
        submission_text: JSON.stringify(payload),
        submission_file_url: null,
      }, { onConflict: "nurse_id,section_id" });
      if (saveError) throw new Error(saveError.message);
      setAnswers(payload);
      setFiles({});
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit this section.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-3 pb-6 sm:px-6">
    {blocks.map((block, index) => {
      const cols = Array.isArray(block.columns) ? block.columns : ["Criterion", "Your response"];
      const labels = Array.isArray(block.row_labels) ? block.row_labels : [];
      const fixedRows = Array.isArray(block.table_rows) ? block.table_rows : [];
      const width = Math.max(cols.length - 1, 1);
      const tableAnswers = Array.isArray(answers[block.id]) ? answers[block.id] : [];
      return <section key={block.id || index} className="rounded-xl border border-carinex-navy/15 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-carinex-navy">{block.title || `Activity ${index + 1}`}</h2>
        {block.type === "instructions" && <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-carinex-navy">{block.content}</div>}
        {block.type === "text" && <div className="mt-3"><p className="mb-2 text-sm text-carinex-navy/70">{block.prompt}</p><textarea value={String(answers[block.id] || "")} onChange={(e) => updateAnswer(block.id, e.target.value)} rows={5} className="w-full rounded-lg border border-carinex-navy/20 px-3 py-3 text-sm focus:border-carinex-emerald focus:outline-none" placeholder="Write your response here…" /></div>}
        {block.type === "file" && <div className="mt-3"><p className="mb-2 text-sm text-carinex-navy/70">{block.prompt}</p><input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 20 * 1024 * 1024) { setError("Files must be 20 MB or smaller."); return; } setFiles((prev) => ({ ...prev, [block.id]: f })); setSaved(false); } }} className="block w-full text-sm" />{answers[block.id]?.name && !files[block.id] && <p className="mt-2 text-xs text-carinex-navy/60">Previously submitted: {answers[block.id].name}</p>}{files[block.id] && <p className="mt-2 text-xs text-carinex-emerald">Selected: {files[block.id].name}</p>}</div>}
        {block.type === "checklist" && <div className="mt-3 flex flex-col gap-2">{(block.items || []).map((item) => { const checked = Array.isArray(answers[block.id]) ? answers[block.id] as string[] : []; return <label key={item} className="flex items-start gap-3 rounded-lg border border-carinex-navy/15 px-3 py-3 text-sm"><input type="checkbox" checked={checked.includes(item)} onChange={(e) => updateAnswer(block.id, e.target.checked ? [...checked, item] : checked.filter((x) => x !== item))} className="mt-1" /><span>{item}</span></label>; })}</div>}
        {block.type === "table" && <div className="mt-3"><div className="overflow-x-auto rounded-lg border border-carinex-navy/20"><table className="w-full min-w-[760px] border-collapse text-sm"><thead><tr>{cols.map((col, i) => <th key={i} className="border border-carinex-navy/20 bg-gray-50 p-3 text-left font-semibold">{col}</th>)}</tr></thead><tbody>{labels.map((label, r) => <tr key={r}><th className="border border-carinex-navy/20 p-3 text-left align-top">{label}</th>{Array.from({ length: width }, (_, c) => { const fixed = String(fixedRows[r]?.[c] || ""); const row = Array.isArray(tableAnswers[r]) ? tableAnswers[r] : []; const value = fixed.trim() ? fixed : String(row[c] || ""); return <td key={c} className="min-w-[190px] border border-carinex-navy/20 p-2 align-top">{fixed.trim() ? <div className="whitespace-pre-wrap">{fixed}</div> : <textarea value={value} onChange={(e) => { const next = labels.map((_, ri) => Array.from({ length: width }, (_, ci) => String((Array.isArray(tableAnswers[ri]) ? tableAnswers[ri] : [])[ci] || ""))); next[r][c] = e.target.value; updateAnswer(block.id, next); }} rows={3} className="w-full min-h-[84px] rounded border border-carinex-navy/20 p-2" placeholder="Your response" />}</td>; })}</tr>)}</tbody></table></div><p className="mt-2 text-xs text-carinex-navy/50">Swipe horizontally on mobile to view all columns.</p></div>}
      </section>;
    })}
    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    <div className="sticky bottom-0 flex items-center justify-between border-t border-carinex-navy/10 bg-white px-2 py-4">
      <button onClick={() => void submit()} disabled={saving} className="rounded-full bg-carinex-navy px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Submitting…" : saved ? "Save changes" : "Submit responses"}</button>
      <a href={nextHref} aria-label="Next" className="flex h-11 w-11 items-center justify-center rounded-full bg-carinex-emerald text-white">→</a>
    </div>
  </div>;
}

function getMode(section: Section): string {
  const c = section.config;
  const mode = String(c.input_mode || "");

  if (modes.includes(mode)) {
    return mode;
  }

  if (section.section_type === "exercise") {
    if (c.mode === "checklist") return "checklist";
    if (c.mode === "text") return "text";
    return "none";
  }

  if (section.section_type === "practical_assignment") {
    if (c.submission_type === "file") return "file";
    if (c.submission_type === "text") return "text";
    return "none";
  }

  if (section.section_type === "career_application") {
    return String(c.input_mode || "none");
  }

  if (section.section_type === "training_activity") {
    if (c.activity_format === "table") return "table";
    if (c.activity_format === "freeform") return "freeform";
    return "none";
  }

  return "none";
}

function normalizeRows(
  value: unknown,
  rowCount: number,
  width: number
): string[][] {
  const raw = Array.isArray(value)
    ? (value as unknown[])
    : [];

  return Array.from(
    { length: rowCount },
    (_, r) => {
      const row = Array.isArray(raw[r])
        ? (raw[r] as unknown[])
        : [];

      return Array.from(
        { length: width },
        (_, c) => String(row[c] ?? "")
      );
    }
  );
}

function CourseMaterialMedia({
  config,
}: {
  config: Record<string, unknown>;
}) {
  const [url, setUrl] = useState<string | null>(
    null
  );

  const path = String(
    config.file_url || ""
  );

  const type = String(
    config.media_type || "pdf"
  );

  useEffect(() => {
    if (!path) return;

    const supabase = createClient();

    const { data } = supabase.storage
      .from("course-content")
      .getPublicUrl(path);

    setUrl(data.publicUrl);
  }, [path]);

  if (!url) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 pb-8">
      {type === "video" ? (
        <video
          controls
          className="w-full rounded-xl"
          src={url}
        />
      ) : type === "audio" ? (
        <audio
          controls
          className="w-full"
          src={url}
        />
      ) : null}
    </div>
  );
}
