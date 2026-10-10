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

const modes = ["table", "freeform", "checklist", "text", "file"];

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
    if (section.section_type === "course_material") {
      const saved = await upsertProgress({});
      if (saved) router.push(nextHref);
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
                      <div className="whitespace-normal break-words">
                        {label}
                      </div>
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
          disabled={saving || (section.section_type === "course_material" && hasSaved)}
          className="rounded-full bg-carinex-navy px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving
            ? "Saving…"
            : section.section_type === "course_material"
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

function getMode(section: Section): string {
  const c = section.config;
  const mode = String(c.input_mode || "");

  if (modes.includes(mode)) {
    return mode;
  }

  if (section.section_type === "exercise") {
    return c.mode === "checklist"
      ? "checklist"
      : "text";
  }

  if (
    section.section_type === "practical_assignment"
  ) {
    return c.submission_type === "file"
      ? "file"
      : "text";
  }

  if (
    section.section_type === "career_application"
  ) {
    return String(c.input_mode || "file");
  }

  if (
    section.section_type === "training_activity"
  ) {
    return c.activity_format === "table"
      ? "table"
      : "freeform";
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
