"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  X, Save, Calendar, Plus, Trash2, CheckSquare, Square, ClipboardList, GraduationCap,
} from "lucide-react";
import { Exam, ExamTopic, PracticeTest } from "@/lib/types";

interface ExamDetailProps {
  exam: Exam;
  topics: ExamTopic[];
  practiceTests: PracticeTest[];
  onUpdateExam: (id: string, updates: Partial<Pick<Exam, "name" | "examDate">>) => void;
  onDeleteExam: (id: string) => void;
  onAddTopic: (examId: string, name: string) => void;
  onToggleTopic: (examId: string, topicId: string) => void;
  onDeleteTopic: (examId: string, topicId: string) => void;
  onAddPracticeTest: (examId: string, data: { title: string; score?: number | null; maxScore?: number | null; notes?: string; takenAt?: string }) => void;
  onDeletePracticeTest: (examId: string, testId: string) => void;
  onClose: () => void;
}

const inputStyle = { background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" };
const labelStyle = { color: "var(--muted-fg)" };

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ExamDetail({
  exam, topics, practiceTests,
  onUpdateExam, onDeleteExam,
  onAddTopic, onToggleTopic, onDeleteTopic,
  onAddPracticeTest, onDeletePracticeTest,
  onClose,
}: ExamDetailProps) {
  const [name, setName] = useState(exam.name);
  const [examDate, setExamDate] = useState(exam.examDate?.split("T")[0] ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  const [newTopic, setNewTopic] = useState("");
  const [showTestForm, setShowTestForm] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const [testScore, setTestScore] = useState("");
  const [testMaxScore, setTestMaxScore] = useState("");
  const [testNotes, setTestNotes] = useState("");

  useEffect(() => {
    const changed = name !== exam.name || examDate !== (exam.examDate?.split("T")[0] ?? "");
    setHasChanges(changed);
  }, [name, examDate, exam]);

  const handleSave = () => {
    onUpdateExam(exam.id, {
      name: name.trim(),
      examDate: examDate || null,
    });
    setHasChanges(false);
  };

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    onAddTopic(exam.id, newTopic.trim());
    setNewTopic("");
  };

  const handleAddTest = () => {
    if (!testTitle.trim()) return;
    onAddPracticeTest(exam.id, {
      title: testTitle.trim(),
      score: testScore ? Number(testScore) : null,
      maxScore: testMaxScore ? Number(testMaxScore) : null,
      notes: testNotes.trim(),
    });
    setTestTitle("");
    setTestScore("");
    setTestMaxScore("");
    setTestNotes("");
    setShowTestForm(false);
  };

  const days = daysUntil(exam.examDate);
  const revisedCount = topics.filter((t) => t.revised).length;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-end backdrop-blur-sm"
      style={{ background: "var(--overlay-bg)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-lg overflow-y-auto border-l p-6"
        style={{ background: "var(--detail-bg)", borderColor: "var(--border-color)" }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
              <GraduationCap className="h-4 w-4 text-indigo-400" />
            </div>
            {days !== null && (
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                days < 0 ? "bg-zinc-500/15 text-zinc-400"
                : days === 0 ? "bg-red-500/15 text-red-400"
                : days <= 3 ? "bg-red-500/15 text-red-400"
                : days <= 7 ? "bg-amber-500/15 text-amber-500"
                : "bg-indigo-500/10 text-indigo-400"
              }`}>
                {days < 0 ? "Past due" : days === 0 ? "Exam today!" : `${days} day${days !== 1 ? "s" : ""} left`}
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-md p-1" style={{ color: "var(--muted-fg)" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Name + Date */}
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-xl font-semibold outline-none"
              style={{ color: "var(--fg)" }}
              placeholder="Exam name..."
            />
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs" style={labelStyle}>
                <Calendar className="h-3 w-3" /> Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Topic Checklist */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Topics</h3>
                {topics.length > 0 && (
                  <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}>
                    {revisedCount}/{topics.length}
                  </span>
                )}
              </div>
            </div>

            {topics.length > 0 && (
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--border-color)" }}>
                <motion.div
                  className="h-full rounded-full bg-indigo-500"
                  animate={{ width: `${topics.length > 0 ? (revisedCount / topics.length) * 100 : 0}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}

            <div className="space-y-1">
              <AnimatePresence>
                {topics.map((topic) => (
                  <motion.div
                    key={topic.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <button
                      onClick={() => onToggleTopic(exam.id, topic.id)}
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: topic.revised ? "var(--muted-fg)" : "var(--fg)" }}
                    >
                      {topic.revised ? (
                        <CheckSquare className="h-4 w-4 shrink-0 text-indigo-500" />
                      ) : (
                        <Square className="h-4 w-4 shrink-0" style={{ color: "var(--muted-fg)" }} />
                      )}
                      <span className={topic.revised ? "line-through opacity-60" : ""}>{topic.name}</span>
                    </button>
                    <button
                      onClick={() => onDeleteTopic(exam.id, topic.id)}
                      className="rounded-md p-1 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                      style={{ color: "var(--muted-fg)" }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-2 flex gap-2">
              <input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddTopic(); }}
                placeholder="Add topic..."
                className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-indigo-500/50"
                style={inputStyle}
              />
              <button
                onClick={handleAddTopic}
                disabled={!newTopic.trim()}
                className="rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Practice Tests */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Practice Tests</h3>
                {practiceTests.length > 0 && (
                  <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}>
                    {practiceTests.length}
                  </span>
                )}
              </div>
              {!showTestForm && (
                <button
                  onClick={() => setShowTestForm(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log Test
                </button>
              )}
            </div>

            <AnimatePresence>
              {showTestForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className="space-y-2 rounded-xl border p-3" style={{ background: "var(--surface-hover)", borderColor: "var(--border-color)" }}>
                    <input
                      autoFocus
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      placeholder="Test name..."
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
                      style={inputStyle}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={testScore}
                        onChange={(e) => setTestScore(e.target.value.replace(/\D/g, ""))}
                        placeholder="Score"
                        className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
                        style={inputStyle}
                      />
                      <input
                        value={testMaxScore}
                        onChange={(e) => setTestMaxScore(e.target.value.replace(/\D/g, ""))}
                        placeholder="Max score"
                        className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
                        style={inputStyle}
                      />
                    </div>
                    <input
                      value={testNotes}
                      onChange={(e) => setTestNotes(e.target.value)}
                      placeholder="Notes (optional)..."
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
                      style={inputStyle}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddTest}
                        disabled={!testTitle.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                      <button
                        onClick={() => { setShowTestForm(false); setTestTitle(""); setTestScore(""); setTestMaxScore(""); setTestNotes(""); }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {practiceTests.length === 0 && !showTestForm && (
              <p className="py-3 text-center text-xs" style={{ color: "var(--card-text-secondary)" }}>
                No practice tests logged yet.
              </p>
            )}

            <div className="space-y-1">
              {practiceTests.map((test) => (
                <div
                  key={test.id}
                  className="group flex items-center justify-between rounded-lg px-2 py-2 transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-fg)" }} />
                    <div>
                      <span className="text-sm" style={{ color: "var(--fg)" }}>{test.title}</span>
                      <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--card-text-secondary)" }}>
                        {test.score != null && test.maxScore != null && (
                          <span className="font-medium">
                            {test.score}/{test.maxScore} ({Math.round((test.score / test.maxScore) * 100)}%)
                          </span>
                        )}
                        <span>{format(new Date(test.takenAt), "MMM d")}</span>
                      </div>
                      {test.notes && (
                        <p className="mt-0.5 text-[10px]" style={{ color: "var(--card-text-secondary)" }}>{test.notes}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeletePracticeTest(exam.id, test.id)}
                    className="rounded-md p-1 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    style={{ color: "var(--muted-fg)" }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
              >
                <Save className="h-4 w-4" /> Save Changes
              </motion.button>
            )}
            {!hasChanges && <div />}
            <button
              onClick={() => { onDeleteExam(exam.id); onClose(); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-red-500/10 hover:text-red-400"
              style={{ color: "var(--card-text-secondary)" }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Exam
            </button>
          </div>

          <p className="text-[10px]" style={{ color: "var(--card-text-secondary)" }}>
            Created {format(new Date(exam.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
