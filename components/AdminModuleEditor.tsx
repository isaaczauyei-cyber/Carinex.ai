"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  const [title, setTitle] = useState(module?.title || "");
  const [summary, setSummary] = useState(module?.summary || "");
  const [passingScore, setPassingScore] = useState(module?.quiz_passing_score?.toString() || "70");
  const [savingMeta, setSavingMeta] = useState(false);

  const [sections, setSections] = useState<Section[]>(initialSections);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  async function saveModuleMeta() {
    setSavingMeta(true);
    await supabase
      .from("course_modules")
      .update({ title, summary, quiz_passing_score: Number(passingScore) || 70 })
      .eq("id", module.id);
    setSavingMeta(false);
  }

  async function addSection(type: string) {
    const nextOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.order_index)) + 1 : 1;
    const { data } = await supabase
      .from("module_sections")
      .insert({
        module_id: module.id,
        order_index: nextOrder,
        section_type: type,
        title: sectionTypeLabels[type],
        instructions: "",
        config: {},
        is_required: true,
        is_graded: type === "practical_assignment" || type === "training_activity",
      })
      .select()
      .single();
    if (data) {
      setSections((prev) => [...prev, data]);
      setExpandedSection(data.id);
    }
  }

  async function updateSection(id: string, patch: Partial<Section>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await supabase.from("module_sections").update(patch).eq("id", id);
  }

  async function deleteSection(id: string) {
    if (!confirm("Delete this section?")) return;
    await supabase.from("module_sections").delete().eq("id", id);
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("course-content").upload(path, file);
    if (error) {
      alert("Upload failed: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from("course-content").getPublicUrl(path);
    return data.publicUrl;
  }

  async function addQuestion() {
    const nextOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.order_index)) + 1 : 1;
    const { data } = await supabase
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
    if (data) setQuestions((prev) => [...prev, data]);
  }

  async function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    await supabase.from("assessment_questions").update(patch).eq("id", id);
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await supabase.from("assessment_questions").delete().eq("id", id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="flex flex-col gap-10">
      {/* Module meta */}
      <div className="rounded-xl border border-carinex-navy/10 p-5">
        <p className="text-sm font-bold text-carinex-navy">Module details</p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Module title"
          className="mt-3 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Short summary (optional)"
          rows={2}
          className="mt-3 w-full rounded-lg border border-carinex-navy/20 px-4 py-2.5 focus:border-carinex-emerald focus:outline-none"
        />
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-carinex-navy">Quiz pass mark (%)</label>
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

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-carinex-navy">Sections</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(sectionTypeLabels).map(([type, label]) => (
            <button
              key={type}
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
              onToggle={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              onUpdate={(patch) => updateSection(section.id, patch)}
              onDelete={() => deleteSection(section.id)}
              onUploadFile={uploadFile}
            />
          ))}
          {sortedSections.length === 0 && (
            <p className="text-sm text-carinex-navy/50">No sections yet — add one above.</p>
          )}
        </div>
      </div>

      {/* Quiz */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-carinex-navy">Assessment / Quiz</p>
          <button
            onClick={addQuestion}
            className="rounded-full bg-carinex-navy px-4 py-2 text-sm font-semibold text-white"
          >
            + Add question
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {questions
            .sort((a, b) => a.order_index - b.order_index)
            .map((q) => (
              <QuestionEditor
                key={q.id}
                question={q}
                onUpdate={(patch) => updateQuestion(q.id, patch)}
                onDelete={() => deleteQuestion(q.id)}
              />
            ))}
          {questions.length === 0 && (
            <p className="text-sm text-carinex-navy/50">No questions yet.</p>
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
  onUpdate: (patch: Partial<Section>) => void;
  onDelete: () => void;
  onUploadFile: (file: File, folder: string) => Promise<string | null>;
}) {
  const [title, setTitle] = useState(section.title);
  const [instructions, setInstructions] = useState(section.instructions || "");
  const [config, setConfig] = useState<Record<string, unknown>>(section.config || {});
  const [uploading, setUploading] = useState(false);

  function patchConfig(next: Record<string, unknown>) {
    const merged = { ...config, ...next };
    setConfig(merged);
    onUpdate({ config: merged });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, mediaType?: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await onUploadFile(file, section.section_type);
    setUploading(false);
    if (url) {
      patchConfig(mediaType ? { file_url: url, media_type: mediaType } : { file_url: url });
    }
  }

  return (
    <div className="rounded-xl border border-carinex-navy/10">
      <div className="flex items-center justify-between p-4">
        <button onClick={onToggle} className="flex-1 text-left">
          <span className="rounded-full bg-carinex-navy/5 px-2.5 py-1 text-xs font-semibold text-carinex-navy/60">
            {sectionTypeLabels[section.section_type]}
          </span>
          <p className="mt-1 font-semibold text-carinex-navy">{section.title}</p>
        </button>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-carinex-navy/60">
            <input
              type="checkbox"
              checked={section.is_required}
              onChange={(e) => onUpdate({ is_required: e.target.checked })}
            />
            Required to advance
          </label>
          <button onClick={onDelete} className="text-xs font-semibold text-red-600 hover:underline">
            Delete
          </button>
          <button onClick={onToggle} className="text-carinex-navy/40">
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 border-t border-carinex-navy/10 p-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => onUpdate({ title })}
            placeholder="Section title"
            className="rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
          />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            onBlur={() => onUpdate({ instructions })}
            placeholder="Instructions (manually written)"
            rows={3}
            className="rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
          />

          {/* Course material: PDF or audio upload */}
          {section.section_type === "course_material" && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => (document.getElementById(`file-${section.id}`) as HTMLInputElement)?.click()}
                  className="rounded-full border border-carinex-navy/20 px-4 py-2 text-sm font-semibold text-carinex-navy"
                >
                  {uploading ? "Uploading…" : "Upload PDF or audio"}
                </button>
                <input
                  id={`file-${section.id}`}
                  type="file"
                  accept=".pdf,audio/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e, e.target.files?.[0]?.type.startsWith("audio") ? "audio" : "pdf")
                  }
                />
              </div>
              {!!config.file_url && (
                <p className="text-xs text-carinex-navy/50">
                  Uploaded: {config.media_type === "audio" ? "🎧 audio file" : "📄 PDF"} ✓
                </p>
              )}
            </div>
          )}

          {/* Exercise: mode toggle + items/prompt */}
          {section.section_type === "exercise" && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => patchConfig({ mode: "checklist" })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    config.mode === "checklist" ? "bg-carinex-navy text-white" : "border border-carinex-navy/20"
                  }`}
                >
                  Checklist
                </button>
                <button
                  type="button"
                  onClick={() => patchConfig({ mode: "text" })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    config.mode === "text" ? "bg-carinex-navy text-white" : "border border-carinex-navy/20"
                  }`}
                >
                  Fill-in text
                </button>
              </div>
              {config.mode === "checklist" && (
                <textarea
                  defaultValue={((config.items as string[]) || []).join("\n")}
                  onBlur={(e) => patchConfig({ items: e.target.value.split("\n").filter(Boolean) })}
                  placeholder="One checklist item per line"
                  rows={4}
                  className="rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
                />
              )}
            </div>
          )}

          {/* Practical assignment: submission type */}
          {section.section_type === "practical_assignment" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => patchConfig({ submission_type: "file" })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  config.submission_type === "file" ? "bg-carinex-navy text-white" : "border border-carinex-navy/20"
                }`}
              >
                File submission
              </button>
              <button
                type="button"
                onClick={() => patchConfig({ submission_type: "text" })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  config.submission_type === "text" ? "bg-carinex-navy text-white" : "border border-carinex-navy/20"
                }`}
              >
                Text submission
              </button>
            </div>
          )}

          {/* Key takeaways: static body text */}
          {section.section_type === "key_takeaways" && (
            <textarea
              defaultValue={(config.body as string) || ""}
              onBlur={(e) => patchConfig({ body: e.target.value })}
              placeholder="Write the key takeaways here"
              rows={5}
              className="rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
            />
          )}

          {/* Career application: PDF upload */}
          {section.section_type === "career_application" && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => (document.getElementById(`file-${section.id}`) as HTMLInputElement)?.click()}
                className="w-fit rounded-full border border-carinex-navy/20 px-4 py-2 text-sm font-semibold text-carinex-navy"
              >
                {uploading ? "Uploading…" : "Upload PDF"}
              </button>
              <input
                id={`file-${section.id}`}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e)}
              />
              {!!config.file_url && <p className="text-xs text-carinex-navy/50">Uploaded ✓</p>}
            </div>
          )}

          {/* Training activity: tabular or freeform + why it matters */}
          {section.section_type === "training_activity" && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => patchConfig({ activity_format: "table" })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    config.activity_format === "table" ? "bg-carinex-navy text-white" : "border border-carinex-navy/20"
                  }`}
                >
                  Tabular
                </button>
                <button
                  type="button"
                  onClick={() => patchConfig({ activity_format: "freeform" })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    config.activity_format === "freeform" ? "bg-carinex-navy text-white" : "border border-carinex-navy/20"
                  }`}
                >
                  Freeform
                </button>
              </div>
              {config.activity_format === "table" && (
                <input
                  type="text"
                  defaultValue={((config.columns as string[]) || []).join(", ")}
                  onBlur={(e) =>
                    patchConfig({ columns: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) })
                  }
                  placeholder="Column headers, comma-separated (e.g. Data Point, AI Suggestion, Nurse Judgment)"
                  className="rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
                />
              )}
              <textarea
                defaultValue={(config.why_it_matters as string) || ""}
                onBlur={(e) => patchConfig({ why_it_matters: e.target.value })}
                placeholder="Why this matters for healthcare AI teams (shown in a highlighted box after the activity)"
                rows={3}
                className="rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionEditor({
  question,
  onUpdate,
  onDelete,
}: {
  question: Question;
  onUpdate: (patch: Partial<Question>) => void;
  onDelete: () => void;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [options, setOptions] = useState(question.options);
  const [correctId, setCorrectId] = useState(question.correct_option_id);

  function updateOption(id: string, text: string) {
    const next = options.map((o) => (o.id === id ? { ...o, text } : o));
    setOptions(next);
  }

  function addOption() {
    const nextId = String.fromCharCode(97 + options.length);
    setOptions((prev) => [...prev, { id: nextId, text: "" }]);
  }

  function save() {
    onUpdate({ prompt, options, correct_option_id: correctId });
  }

  return (
    <div className="rounded-xl border border-carinex-navy/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={save}
          placeholder="Question prompt"
          rows={2}
          className="flex-1 rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
        />
        <button onClick={onDelete} className="shrink-0 text-xs font-semibold text-red-600 hover:underline">
          Delete
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2">
            <input
              type="radio"
              checked={correctId === opt.id}
              onChange={() => {
                setCorrectId(opt.id);
                onUpdate({ correct_option_id: opt.id });
              }}
            />
            <input
              type="text"
              value={opt.text}
              onChange={(e) => updateOption(opt.id, e.target.value)}
              onBlur={save}
              placeholder={`Option ${opt.id.toUpperCase()}`}
              className="flex-1 rounded-lg border border-carinex-navy/20 px-3 py-2 text-sm focus:border-carinex-emerald focus:outline-none"
            />
          </div>
        ))}
        <button onClick={addOption} className="w-fit text-xs font-semibold text-carinex-emerald hover:underline">
          + Add option
        </button>
      </div>
      <p className="mt-2 text-xs text-carinex-navy/40">Select the radio button next to the correct answer.</p>
    </div>
  );
}
