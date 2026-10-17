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
  const getSavedTableData = (): { rows: string[][]; rowLabels: string[] } => {
    try {
      const saved = initialProgress?.submission_text
        ? JSON.parse(initialProgress.submission_text)
        : null;

      // Accept the legacy array format as well as the current object format.
      if (Array.isArray(saved)) {
        return { rows: saved as string[][], rowLabels: rowLabels };
      }
      if (saved && typeof saved === "object") {
        const savedRows = Array.isArray((saved as { rows?: unknown }).rows)
          ? (saved as { rows: string[][] }).rows
          : [];
        const savedLabels = Array.isArray((saved as { rowLabels?: unknown }).rowLabels)
          ? (saved as { rowLabels: string[] }).rowLabels.map((value) => String(value ?? ""))
          : rowLabels;
        return { rows: savedRows, rowLabels: savedLabels };
      }
    } catch {}

    return { rows: [], rowLabels: rowLabels };
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
    return buildLearnerRows(adminRows, getSavedTableData().rows);
  });
  const [learnerRowLabels, setLearnerRowLabels] = useState<string[]>(() => {
    const savedLabels = getSavedTableData().rowLabels;
    return rowLabels.map((adminLabel, index) => adminLabel.trim() !== "" ? adminLabel : String(savedLabels[index] ?? ""));
  });

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (mode === "table") {
      const savedTable = getSavedTableData();
      setRows(buildLearnerRows(adminRows, savedTable.rows));
      setLearnerRowLabels(rowLabels.map((adminLabel, index) => adminLabel.trim() !== "" ? adminLabel : String(savedTable.rowLabels[index] ?? "")));
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

  function isAdminRowLabel(rowIdx: number) {
    return (rowLabels[rowIdx] || "").trim() !== "";
  }

  function updateRowLabel(rowIdx: number, value: string) {
    // Admin-provided S/N values stay fixed; blank ones are learner-editable.
    if (isAdminRowLabel(rowIdx)) return;
    setLearnerRowLabels((prev) => {
      const next = [...prev];
      next[rowIdx] = value;
      return next;
    });
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
          const adminValue = adminRows[rIdx]?.[cIdx] || "";
          return adminValue.trim() !== "" ? adminValue : value;
        })
      );
      const finalRowLabels = rowLabels.map((adminLabel, index) =>
        adminLabel.trim() !== "" ? adminLabel : String(learnerRowLabels[index] ?? "")
      );

      await upsertProgress({
        submission_text: JSON.stringify({ rows: finalRows, rowLabels: finalRowLabels }),
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

  const responseBlocks = Array.isArray(section.config.response_blocks)
    ? (section.config.response_blocks as Record<string, unknown>[])
    : [];

  if (responseBlocks.length > 0 && ["exercise", "practical_assignment", "career_application", "training_activity"].includes(section.section_type)) {
    return (
      <MultiResponseBlocks
        nurseId={nurseId}
        section={section}
        initialProgress={initialProgress}
        nextHref={nextHref}
        blocks={responseBlocks}
      />
    );
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
        <div className="mx-auto w-full max-w-4xl overflow-hidden px-2 pb-6 sm:px-6">
          <div className="w-full overflow-hidden rounded-lg border border-carinex-navy/20">
            <table className="w-full table-fixed border-collapse text-[11px] sm:text-sm">
              <thead>
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={`${col}-${index}`}
                      className="border border-carinex-navy/20 bg-carinex-navy/[0.03] p-2 text-left font-semibold text-carinex-navy sm:p-3"
                    >
                      <div className="whitespace-normal break-words">
                        {col}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rowLabels.map((label, rIdx) => (
                  <tr key={rIdx}>
                    <td className="border border-carinex-navy/20 p-2 align-top font-medium text-carinex-navy sm:p-3">
                      {isAdminRowLabel(rIdx) ? (
                        <div className="whitespace-normal break-words">{label}</div>
                      ) : (
                        <input
                          value={learnerRowLabels[rIdx] ?? ""}
                          onChange={(e) => updateRowLabel(rIdx, e.target.value)}
                          aria-label={`Enter ${columns[0] || "S/N"} for row ${rIdx + 1}`}
                          placeholder={columns[0]?.toLowerCase().includes("s/n") ? "Enter S/N" : "Your value"}
                          className="w-full min-w-0 rounded border border-carinex-navy/20 bg-white px-2 py-2 text-[11px] font-normal text-carinex-navy placeholder:text-carinex-navy/40 focus:border-carinex-emerald focus:outline-none sm:text-sm"
                        />
                      )}
                    </td>

                    {(rows[rIdx] || []).map(
                      (cell, cIdx) => {
                        const fixed = isAdminCell(
                          rIdx,
                          cIdx
                        );

                        return (
                          <td
                            key={cIdx}
                            className="border border-carinex-navy/20 p-1.5 align-top sm:p-2"
                          >
                            {fixed ? (
                              /*
                               * ADMIN-FILLED CELL
                               *
                               * Learner cannot edit this.
                               */
                              <div className="w-full whitespace-normal break-words leading-relaxed text-carinex-navy">
                                {cell}
                              </div>
                            ) : (
                              /*
                               * EMPTY ADMIN CELL
                               *
                               * Learner can enter their response.
                               */
                              <textarea
                                value={cell}
                                onChange={(e) =>
                                  updateCell(
                                    rIdx,
                                    cIdx,
                                    e.target.value
                                  )
                                }
                                rows={3}
                                className="block w-full resize-y rounded border border-carinex-navy/20 bg-white px-2 py-2 text-[11px] text-carinex-navy placeholder:text-carinex-navy/40 focus:border-carinex-emerald focus:outline-none sm:text-sm"
                                placeholder="Your response"
                              />
                            )}
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

type ResponseBlock = Record<string, unknown> & { id?: string; type?: string };

type MultiResponseValue = {
  text?: string;
  checked?: string[];
  rows?: string[][];
  rowLabels?: string[];
  filePath?: string;
  fileName?: string;
};

function MultiResponseBlocks({
  nurseId,
  section,
  initialProgress,
  nextHref,
  blocks,
}: {
  nurseId: string;
  section: Section;
  initialProgress: Progress | null;
  nextHref: string;
  blocks: ResponseBlock[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(initialProgress?.status === "completed");
  const parseSubmission = (): Record<string, MultiResponseValue> => {
    try {
      const parsed = initialProgress?.submission_text ? JSON.parse(initialProgress.submission_text) : null;
      if (parsed && typeof parsed === "object" && parsed.responseBlocks && typeof parsed.responseBlocks === "object") return parsed.responseBlocks;
    } catch {}
    return {};
  };
  const [values, setValues] = useState<Record<string, MultiResponseValue>>(parseSubmission);
  const [files, setFiles] = useState<Record<string, File>>({});

  const blockKey = (block: ResponseBlock, index: number) => String(block.id || `${block.type || "block"}-${index}`);
  const blockRows = (block: ResponseBlock) => {
    const labels = Array.isArray(block.row_labels) ? block.row_labels.map((v) => String(v ?? "")) : [];
    const columns = Array.isArray(block.columns) ? block.columns.map((v) => String(v ?? "")) : [];
    const width = Math.max(columns.length - 1, 1);
    const adminRows = normalizeRows(block.table_rows, labels.length, width);
    return { labels, columns, adminRows };
  };

  function patchValue(key: string, patch: Partial<MultiResponseValue>) {
    setValues((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  }

  async function submitAll() {
    setError("");
    const nextValues: Record<string, MultiResponseValue> = { ...values };
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const key = blockKey(block, i);
      const value = nextValues[key] || {};
      const type = String(block.type || "");
      if (block.required !== false) {
        if (type === "text" && !String(value.text || "").trim()) {
          setError(`Complete “${String(block.title || "Written response") }” before submitting.`); return;
        }
        if (type === "checklist" && !(value.checked || []).length) {
          setError(`Complete “${String(block.title || "Checklist") }” before submitting.`); return;
        }
        if (type === "file" && !files[key] && !value.filePath) {
          setError(`Choose a file for “${String(block.title || "File upload") }” before submitting.`); return;
        }
      }
      if (type === "table") {
        const { labels, adminRows } = blockRows(block);
        const current = value.rows || [];
        const currentLabels = value.rowLabels || [];
        nextValues[key] = {
          ...value,
          rows: adminRows.map((row, r) => row.map((cell, c) => String(cell || "").trim() ? cell : String(current[r]?.[c] ?? ""))),
          rowLabels: labels.map((label, r) => label.trim() ? label : String(currentLabels[r] ?? "")),
        };
      }
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); setError("Please sign in again."); return; }

    for (const [key, file] of Object.entries(files)) {
      const path = `${user.id}/${section.id}-${key}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("assignment-submissions").upload(path, file);
      if (uploadError) { setSaving(false); setError(`Upload failed: ${uploadError.message}`); return; }
      nextValues[key] = { ...(nextValues[key] || {}), filePath: path, fileName: file.name };
    }

    const { error: saveError } = await supabase.from("nurse_section_progress").upsert({
      nurse_id: nurseId,
      section_id: section.id,
      status: "completed",
      completed_at: new Date().toISOString(),
      submission_text: JSON.stringify({ responseBlocks: nextValues }),
      submission_file_url: null,
    }, { onConflict: "nurse_id,section_id" });
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    setValues(nextValues);
    setFiles({});
    setSaved(true);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-6 sm:px-6">
      <div className="flex flex-col gap-5">
        {blocks.map((block, index) => {
          const key = blockKey(block, index);
          const type = String(block.type || "");
          const value = values[key] || {};
          const title = String(block.title || ({ table: "Tabular response", text: "Written response", checklist: "Checklist", file: "File upload" } as Record<string, string>)[type] || `Response ${index + 1}`);
          const prompt = String(block.prompt || "");
          return <section key={key} className="rounded-xl border border-carinex-navy/15 p-4">
            <h3 className="font-semibold text-carinex-navy">{title}{block.required !== false && <span className="ml-1 text-red-600">*</span>}</h3>
            {prompt && <p className="mt-2 whitespace-pre-wrap text-sm text-carinex-navy/80">{prompt}</p>}
            {type === "text" && <textarea value={String(value.text || "")} onChange={(e) => patchValue(key, { text: e.target.value })} rows={6} placeholder="Write your response here" className="mt-3 w-full rounded-lg border border-carinex-navy/20 px-3 py-2 focus:border-carinex-emerald focus:outline-none" />}
            {type === "checklist" && <div className="mt-3 flex flex-col gap-2">{(Array.isArray(block.items) ? block.items : []).map((item) => { const label = String(item); const checked = value.checked || []; return <label key={label} className="flex items-center gap-3 rounded-lg border border-carinex-navy/15 px-3 py-2 text-sm"><input type="checkbox" checked={checked.includes(label)} onChange={(e) => patchValue(key, { checked: e.target.checked ? [...checked, label] : checked.filter((v) => v !== label) })} /><span>{label}</span></label>; })}</div>}
            {type === "file" && <div className="mt-3"><input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFiles((prev) => ({ ...prev, [key]: f })); }} className="text-sm" />{files[key] && <p className="mt-1 text-xs text-carinex-navy/60">Selected: {files[key].name}</p>}{value.fileName && !files[key] && <p className="mt-1 text-xs text-carinex-navy/60">Previously submitted: {value.fileName}</p>}</div>}
            {type === "table" && (() => {
              const { labels, columns, adminRows } = blockRows(block);
              const width = Math.max(columns.length - 1, 1);
              const learnerRows = Array.from({ length: labels.length }, (_, r) => Array.from({ length: width }, (_, c) => {
                const adminCell = String(adminRows[r]?.[c] || "");
                return adminCell.trim() ? adminCell : String(value.rows?.[r]?.[c] ?? "");
              }));
              const learnerLabels = labels.map((label, r) => label.trim() ? label : String(value.rowLabels?.[r] ?? ""));
              return <div className="mt-3 overflow-x-auto rounded-lg border border-carinex-navy/20"><table className="w-full table-fixed border-collapse text-xs sm:text-sm"><thead><tr>{columns.map((col, c) => <th key={c} className="border border-carinex-navy/20 bg-carinex-navy/[0.03] p-2 text-left">{col}</th>)}</tr></thead><tbody>{labels.map((label, r) => <tr key={r}><td className="border border-carinex-navy/20 p-2">{label.trim() ? <span>{label}</span> : <input value={learnerLabels[r]} onChange={(e) => patchValue(key, { rowLabels: learnerLabels.map((v, i) => i === r ? e.target.value : v) })} placeholder="Enter S/N" aria-label={`Enter ${columns[0] || "S/N"} for row ${r + 1}`} className="w-full min-w-0 rounded border border-carinex-navy/20 px-2 py-2" />}</td>{learnerRows[r].map((cell, c) => <td key={c} className="border border-carinex-navy/20 p-1.5">{String(adminRows[r]?.[c] || "").trim() ? <div className="whitespace-pre-wrap break-words">{cell}</div> : <textarea value={cell} onChange={(e) => patchValue(key, { rows: learnerRows.map((row, ri) => row.map((v, ci) => ri === r && ci === c ? e.target.value : v)) })} rows={3} placeholder="Your response" className="w-full rounded border border-carinex-navy/20 px-2 py-2" />}</td>)}</tr>)}</tbody></table></div>;
            })()}
          </section>;
        })}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="sticky bottom-0 mt-5 flex items-center justify-between border-t border-carinex-navy/10 bg-white py-4">
        <button type="button" onClick={() => void submitAll()} disabled={saving} className="rounded-full bg-carinex-navy px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : saved ? "Save changes" : "Submit"}</button>
        <a href={nextHref} aria-label="Next" className="flex h-11 w-11 items-center justify-center rounded-full bg-carinex-emerald text-white">→</a>
      </div>
    </div>
  );
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
