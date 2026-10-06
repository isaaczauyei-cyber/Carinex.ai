
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import RichTextEditor from "@/components/RichTextEditor";

type Section = {
  id: string;
  module_id: string;
  order_index: number;
  section_type: string;
  title: string;
  instructions: string | null;
  config: Record<string, unknown>;
  is_required: boolean;
  is_graded: boolean;
};

type Question = {
  id: string;
  module_id: string;
  order_index: number;
  prompt: string;
  question_type: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
  points: number;
};

type ModuleRow = {
  id: string;
  course_id: number;
  order_index: number;
  title: string;
  summary: string | null;
  quiz_passing_score: number | null;
};

const sectionTypeLabels: Record<string, string> = {
  course_material: "Course Material",
  exercise: "Exercise",
  practical_assignment: "Practical Assignment",
  key_takeaways: "Key Takeaways",
  career_application: "Career Application",
  training_activity: "AI/Data Training Activity",
};

export default function AdminModuleEditor({
  module,
  initialSections,
  initialQuestions,
}: {
  module: ModuleRow;
  initialSections: Section[];
  initialQuestions: Question[];
}) {
  const supabase = createClient();

  async function markCoursePrivate() {
    const { error } = await supabase.from("courses").update({ is_published: false }).eq("id", module.course_id).eq("is_in_house", true);
    if (error) throw new Error(error.message);
  }

  const [title, setTitle] = useState(module.title || "");
  const [summary, setSummary] = useState(module.summary || "");
  const [passingScore, setPassingScore] = useState(
    String(module.quiz_passing_score ?? 70)
  );
  const [savingMeta, setSavingMeta] = useState(false);

  const [sections, setSections] = useState<Section[]>(initialSections || []);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    setTitle(module.title || "");
    setSummary(module.summary || "");
    setPassingScore(String(module.quiz_passing_score ?? 70));
    setSections(initialSections || []);
    setQuestions(initialQuestions || []);
    setExpandedSection(null);
  }, [
    module.id,
    module.title,
    module.summary,
    module.quiz_passing_score,
    initialSections,
    initialQuestions,
  ]);

  async function saveModuleMeta() {
    setSavingMeta(true);

    let error: { message: string } | null = null;
    try { await markCoursePrivate(); } catch (e) { setSavingMeta(false); alert("Could not prepare the course for editing: " + (e instanceof Error ? e.message : "Unknown error")); return; }

    ({ error } = await supabase
      .from("course_modules")
      .update({
        title,
        summary: summary || null,
        quiz_passing_score: Number(passingScore) || 70,
      })
      .eq("id", module.id));

    setSavingMeta(false);

    if (error) {
      alert("Could not save module details: " + error.message);
      return;
    }

    alert("Module details saved.");
  }

  async function addSection(type: string) {
    try { await markCoursePrivate(); } catch (e) { alert("Could not prepare the course for editing: " + (e instanceof Error ? e.message : "Unknown error")); return; }
    const nextOrder =
      sections.length > 0
        ? Math.max(...sections.map((s) => s.order_index)) + 1
        : 1;

    const { data, error } = await supabase
      .from("module_sections")
      .insert({
        module_id: module.id,
        order_index: nextOrder,
        section_type: type,
        title: sectionTypeLabels[type] || "New Section",
        instructions: "",
        config: {},
        is_required: true,
        is_graded:
          type === "practical_assignment" || type === "training_activity",
      })
      .select()
      .single();

    if (error) {
      alert("Could not add section: " + error.message);
      return;
    }

    if (data) {
      setSections((prev) => [...prev, data as Section]);
      setExpandedSection(data.id);
    }
  }

  async function updateSection(id: string, patch: Partial<Section>) {
    try { await markCoursePrivate(); } catch (e) { alert("Could not prepare the course for editing: " + (e instanceof Error ? e.message : "Unknown error")); return; }
    const { error } = await supabase
      .from("module_sections")
      .update(patch)
      .eq("id", id);

    if (error) {
      alert("Could not save section: " + error.message);
      return;
    }

    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, ...patch } : section
      )
    );
  }

  async function deleteSection(id: string) {
    try { await markCoursePrivate(); } catch (e) { alert("Could not prepare the course for editing: " + (e instanceof Error ? e.message : "Unknown error")); return; }
    if (!confirm("Delete this section? This cannot be undone.")) return;

    const { error } = await supabase
      .from("module_sections")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Could not delete section: " + error.message);
      return;
    }

    setSections((prev) => prev.filter((section) => section.id !== id));

    if (expandedSection === id) {
      setExpandedSection(null);
    }
  }

  async function uploadFile(
    file: File,
    folder: string
  ): Promise<string | null> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${folder}/${module.id}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("course-content")
      .upload(path, file, { upsert: false });

    if (error) {
      alert("Upload failed: " + error.message);
      return null;
    }

    return path;
  }

  async function addQuestion() {
    try { await markCoursePrivate(); } catch (e) { alert("Could not prepare the course for editing: " + (e instanceof Error ? e.message : "Unknown error")); return; }
    const nextOrder =
      questions.length > 0
        ? Math.max(...questions.map((q) => q.order_index)) + 1
        : 1;

    const { data, error } = await supabase
      .from("assessment_questions")
      .insert({
        module_id: module.id,
        order_index: nextOrder,
        prompt: "",
        question_type: "mcq",
        options: [
          { id: "a", text: "" },
          { id: "b", text: "" },
        ],
        correct_option_id: "a",
        points: 1,
      })
      .select()
      .single();

    if (error) {
      alert("Could not add question: " + error.message);
      return;
    }

    if (data) {
      setQuestions((prev) => [...prev, data as Question]);
    }
  }

  async function updateQuestion(id: string, patch: Partial<Question>) {
    try { await markCoursePrivate(); } catch (e) { alert("Could not prepare the course for editing: " + (e instanceof Error ? e.message : "Unknown error")); return; }
    const { error } = await supabase
      .from("assessment_questions")
      .update(patch)
      .eq("id", id);

    if (error) {
      alert("Could not save question: " + error.message);
      return;
    }

    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id ? { ...question, ...patch } : question
      )
    );
  }

  async function deleteQuestion(id: string) {
    try { await markCoursePrivate(); } catch (e) { alert("Could not prepare the course for editing: " + (e instanceof Error ? e.message : "Unknown error")); return; }
    if (!confirm("Delete this question? This cannot be undone.")) return;

    const { error } = await supabase
      .from("assessment_questions")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Could not delete question: " + error.message);
      return;
    }

    setQuestions((prev) => prev.filter((question) => question.id !== id));
  }

  const sortedSections = [...sections].sort(
    (a, b) => a.order_index - b.order_index
  );

  const sortedQuestions = [...questions].sort(
    (a, b) => a.order_index - b.order_index
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="rounded-xl border border-carinex-navy/10 p-5">
        <p className="text-sm font-bold text-carinex-navy">
          Module details
        </p>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Module title"
          className="mt-3 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />

        <div className="mt-3">
          <p className="mb-1 text-xs font-semibold text-carinex-navy/50">Module summary</p>
          <RichTextEditor
            value={summary}
            onSave={setSummary}
            placeholder="Short summary (optional)"
            rows={3}
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-carinex-navy">
            Quiz pass mark (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
            className="w-24 rounded-lg border border-carinex-navy/20 px-3 py-2 focus:border-carinex-emerald focus:outline-none"
          />
        </div>

        <button
          onClick={saveModuleMeta}
          disabled={savingMeta}
          className="mt-4 rounded-full bg-carinex-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {savingMeta ? "Saving…" : "Save module details"}
        </button>
      </div>

      <div>
        <p className="text-lg font-bold text-carinex-navy">Sections</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(sectionTypeLabels).map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => addSection(type)}
              className="rounded-full border border-dashed border-carinex-navy/30 px-3 py-1.5 text-xs font-semibold text-carinex-navy/70 hover:border-carinex-emerald hover:text-carinex-emerald"
            >
              + {label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {sortedSections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              expanded={expandedSection === section.id}
              onToggle={() =>
                setExpandedSection(
                  expandedSection === section.id ? null : section.id
                )
              }
              onUpdate={(patch) => updateSection(section.id, patch)}
              onDelete={() => deleteSection(section.id)}
              onUploadFile={uploadFile}
            />
          ))}

          {sortedSections.length === 0 && (
            <p className="text-sm text-carinex-navy/50">
              No sections yet — add one above.
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-carinex-navy">
            Assessment / Quiz
          </p>

          <button
            type="button"
            onClick={addQuestion}
            className="rounded-full bg-carinex-navy px-4 py-2 text-sm font-semibold text-white"
          >
            + Add question
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {sortedQuestions.map((question) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onUpdate={(patch) => updateQuestion(question.id, patch)}
              onDelete={() => deleteQuestion(question.id)}
            />
          ))}

          {sortedQuestions.length === 0 && (
            <p className="text-sm text-carinex-navy/50">
              No questions yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  onUploadFile,
}: {
  section: Section;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Section>) => Promise<void>;
  onDelete: () => void;
  onUploadFile: (file: File, folder: string) => Promise<string | null>;
}) {
  const [title, setTitle] = useState(section.title);
  const [instructions, setInstructions] = useState(section.instructions || "");
  const [config, setConfig] = useState<Record<string, unknown>>(section.config || {});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setTitle(section.title);
    setInstructions(section.instructions || "");
    setConfig(section.config || {});
  }, [section.id, section.title, section.instructions, section.config]);

  function patchConfig(next: Record<string, unknown>) {
    const merged = { ...config, ...next };
    setConfig(merged);
    void onUpdate({ config: merged });
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    mediaType?: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = await onUploadFile(file, section.section_type);
    setUploading(false);
    if (path) {
      patchConfig(mediaType ? { file_url: path, media_type: mediaType } : { file_url: path });
    }
    e.target.value = "";
  }

  const legacyMode =
    section.section_type === "exercise"
      ? config.mode === "checklist" ? "checklist" : config.mode === "text" ? "text" : null
      : section.section_type === "practical_assignment"
        ? config.submission_type === "file" ? "file" : config.submission_type === "text" ? "text" : null
        : section.section_type === "career_application"
          ? config.input_mode || "file"
          : section.section_type === "training_activity"
            ? config.activity_format === "table" ? "table" : config.activity_format === "freeform" ? "freeform" : null
            : null;

  const selectedMode = (config.input_mode as string) || legacyMode || "freeform";
  const interactiveSection = ["exercise", "practical_assignment", "career_application"].includes(section.section_type);

  function setInputMode(mode: string) {
    const next: Record<string, unknown> = { input_mode: mode };
    if (section.section_type === "exercise") {
      next.mode = mode === "checklist" ? "checklist" : "text";
    }
    if (section.section_type === "practical_assignment") {
      next.submission_type = mode === "file" ? "file" : "text";
    }
    if (section.section_type === "training_activity") {
      next.activity_format = mode === "table" ? "table" : "freeform";
    }
    patchConfig(next);
  }

  return (
    <div className="rounded-xl border border-carinex-navy/10">
      <div className="flex items-center justify-between p-4">
        <button onClick={onToggle} className="flex-1 text-left">
          <span className="rounded-full bg-carinex-navy/5 px-2.5 py-1 text-xs font-semibold text-carinex-navy/60">
            {sectionTypeLabels[section.section_type] || section.section_type}
          </span>
          <p className="mt-1 font-semibold text-carinex-navy">{section.title}</p>
        </button>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-carinex-navy/60">
            <input type="checkbox" checked={section.is_required} onChange={(e) => void onUpdate({ is_required: e.target.checked })} />
            Required to advance
          </label>
          <button onClick={onDelete} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
          <button onClick={onToggle} className="text-carinex-navy/40">{expanded ? "▲" : "▼"}</button>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-carinex-navy/10 p-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => void onUpdate({ title })} placeholder="Section title" className="rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm" />
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} onBlur={() => void onUpdate({ instructions })} placeholder="Instructions" rows={3} className="rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm" />

          {section.section_type === "course_material" && (
            <div className="rounded-lg border border-carinex-navy/10 p-4">
              <p className="text-sm font-semibold text-carinex-navy">Course media</p>
              <p className="mt-1 text-xs text-carinex-navy/50">Upload a video, PDF, or audio file for learners.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-full border border-carinex-navy/20 px-4 py-2 text-sm font-semibold text-carinex-navy">
                  {uploading ? "Uploading…" : "Upload video / PDF / audio"}
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.pdf,audio/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const type = e.target.files?.[0]?.type || "";
                      void handleFileUpload(e, type.startsWith("video") ? "video" : type.startsWith("audio") ? "audio" : "pdf");
                    }}
                  />
                </label>
              </div>
              {!!config.file_url && <p className="mt-2 text-xs text-carinex-navy/50">Saved: {String(config.media_type || "file")} ✓</p>}
            </div>
          )}

          {(interactiveSection || section.section_type === "training_activity") && (
            <div className="rounded-lg border border-carinex-navy/10 p-4">
              <p className="text-sm font-semibold text-carinex-navy">Learner response format</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["table", "Tabular"],
                  ["freeform", "Freeform"],
                  ["checklist", "Checklist"],
                  ["text", "Fill-in text"],
                  ["file", "File upload"],
                ].map(([mode, label]) => (
                  <button key={mode} type="button" onClick={() => setInputMode(mode)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedMode === mode ? "bg-carinex-navy text-white" : "border border-carinex-navy/20 text-carinex-navy"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {selectedMode === "checklist" && (
                <div className="mt-4">
                  <p className="mb-1 text-xs font-semibold text-carinex-navy/50">Checklist items — one per line</p>
                  <textarea value={((config.items as string[]) || []).join("\n")} onChange={(e) => patchConfig({ items: e.target.value.split("\n") })} rows={5} placeholder="Item 1\nItem 2" className="w-full rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm" />
                </div>
              )}

              {selectedMode === "table" && (
                <AdminTableBuilder config={config} onChange={patchConfig} />
              )}

              {selectedMode === "file" && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-carinex-navy/50">Learners will be able to upload a file when completing this section.</p>
                  <p className="text-xs font-semibold text-carinex-emerald">File upload enabled ✓</p>
                </div>
              )}
            </div>
          )}

          {section.section_type === "key_takeaways" && (
            <div>
              <p className="mb-1 text-xs font-semibold text-carinex-navy/50">Key takeaways</p>
              <RichTextEditor value={(config.body as string) || ""} onSave={(next) => patchConfig({ body: next })} placeholder="Write the key takeaways here" rows={6} />
            </div>
          )}

          {section.section_type === "training_activity" && (
            <div>
              <p className="mb-1 text-xs font-semibold text-carinex-navy/50">Why this matters</p>
              <RichTextEditor value={(config.why_it_matters as string) || ""} onSave={(next) => patchConfig({ why_it_matters: next })} placeholder="Why this matters for healthcare AI teams" rows={4} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminTableBuilder({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const columns = (config.columns as string[]) || ["S/N", "Column 1", "Column 2"];
  const rowLabels = (config.row_labels as string[]) || ["1", "2", "3"];
  const raw = Array.isArray(config.table_rows) ? (config.table_rows as unknown[]) : [];
  const width = Math.max(columns.length - 1, 1);
  const rows = rowLabels.map((_, i) => {
    const row = Array.isArray(raw[i]) ? (raw[i] as unknown[]) : [];
    return Array.from({ length: width }, (_, j) => String(row[j] ?? ""));
  });

  function save(nextRows: string[][], nextLabels = rowLabels, nextColumns = columns) {
    onChange({
      columns: nextColumns,
      row_labels: nextLabels,
      table_rows: nextRows,
    });
  }

  function updateCell(r: number, c: number, value: string) {
    const next = rows.map((row) => [...row]);
    if (!next[r]) next[r] = Array.from({ length: width }, () => "");
    next[r][c] = value;
    save(next);
  }

  function updateLabel(r: number, value: string) {
    const labels = [...rowLabels];
    labels[r] = value;
    save(rows, labels);
  }

  function updateHeader(index: number, value: string) {
    const nextColumns = [...columns];
    nextColumns[index] = value;
    save(rows, rowLabels, nextColumns);
  }

  function addColumn() {
    const nextColumns = [...columns, `Column ${columns.length}`];
    const nextRows = rows.map((row) => [...row, ""]);
    save(nextRows, rowLabels, nextColumns);
  }

  function removeColumn() {
    if (columns.length <= 2) return;
    const nextColumns = columns.slice(0, -1);
    const nextRows = rows.map((row) => row.slice(0, -1));
    save(nextRows, rowLabels, nextColumns);
  }

  function addRow() {
    save(
      [...rows, Array.from({ length: width }, () => "")],
      [...rowLabels, String(rowLabels.length + 1)]
    );
  }

  function removeRow(index: number) {
    save(
      rows.filter((_, i) => i !== index),
      rowLabels.filter((_, i) => i !== index)
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-carinex-navy/50">
          Column headers — edit each header directly
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addColumn}
            className="text-xs font-semibold text-carinex-emerald hover:underline"
          >
            + Add column
          </button>
          {columns.length > 2 && (
            <button
              type="button"
              onClick={removeColumn}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Remove last column
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((column, index) => (
          <input
            key={index}
            value={column}
            onChange={(e) => updateHeader(index, e.target.value)}
            placeholder={index === 0 ? "S/N" : `Column ${index}`}
            className="w-full rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
          />
        ))}
      </div>

      <p className="mb-1 mt-4 text-xs font-semibold text-carinex-navy/50">
        Rows and cell content — every box is editable by the admin
      </p>

      <div className="overflow-x-auto rounded-lg border border-carinex-navy/20">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="border border-carinex-navy/20 bg-carinex-navy/[0.03] p-2 text-left font-semibold"
                >
                  {column || `Column ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <td className="border border-carinex-navy/20 p-2">
                  <input
                    value={rowLabels[r] || ""}
                    onChange={(e) => updateLabel(r, e.target.value)}
                    className="w-full rounded border border-carinex-navy/15 px-2 py-1.5"
                  />
                </td>
                {row.map((cell, c) => (
                  <td key={c} className="border border-carinex-navy/20 p-2">
                    <input
                      value={cell}
                      onChange={(e) => updateCell(r, c, e.target.value)}
                      placeholder="Admin content"
                      className="w-full rounded border border-carinex-navy/15 px-2 py-1.5"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-semibold text-carinex-emerald hover:underline"
        >
          + Add row
        </button>
        {rows.length > 1 && (
          <button
            type="button"
            onClick={() => removeRow(rows.length - 1)}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Remove last row
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionEditor({
  question,
  onUpdate,
  onDelete,
}: {
  question: Question;
  onUpdate: (patch: Partial<Question>) => Promise<void>;
  onDelete: () => void;
}) {
  const [correctId, setCorrectId] = useState(question.correct_option_id);
  const [options, setOptions] = useState(question.options || []);

  useEffect(() => {
    setOptions(question.options || []);
    setCorrectId(question.correct_option_id);
  }, [question.id, question.options, question.correct_option_id]);

  async function saveOption(id: string, text: string) {
    const nextOptions = options.map((option) => option.id === id ? { ...option, text } : option);
    setOptions(nextOptions);
    await onUpdate({ options: nextOptions });
  }

  async function addOption() {
    const used = new Set(options.map((option) => option.id));
    let code = 97;
    while (used.has(String.fromCharCode(code)) && code < 123) code++;
    const nextOptions = [...options, { id: String.fromCharCode(code), text: "" }];
    setOptions(nextOptions);
    await onUpdate({ options: nextOptions });
  }

  return (
    <div className="rounded-xl border border-carinex-navy/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold text-carinex-navy/50">Question prompt</p>
          <RichTextEditor
            value={question.prompt}
            onSave={(next) => void onUpdate({ prompt: next })}
            placeholder="Write the question prompt"
            rows={4}
          />
        </div>
        <button type="button" onClick={onDelete} className="shrink-0 text-xs font-semibold text-red-600 hover:underline">Delete</button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {options.map((option) => (
          <div key={option.id} className="flex items-start gap-2">
            <input
              type="radio"
              className="mt-3"
              name={`correct-${question.id}`}
              checked={correctId === option.id}
              onChange={() => { setCorrectId(option.id); void onUpdate({ correct_option_id: option.id }); }}
              aria-label={`Mark option ${option.id} as correct`}
            />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold text-carinex-navy/50">Option {option.id.toUpperCase()}</p>
              <input
                type="text"
                defaultValue={option.text}
                onBlur={(e) => void saveOption(option.id, e.target.value)}
                placeholder={`Enter option ${option.id.toUpperCase()}`}
                className="w-full rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => void addOption()} className="w-fit text-xs font-semibold text-carinex-emerald hover:underline">+ Add option</button>
      </div>
      <p className="mt-2 text-xs text-carinex-navy/40">Select the radio button next to the correct answer. Answer options are plain text and save when you leave the field.</p>
    </div>
  );
}
