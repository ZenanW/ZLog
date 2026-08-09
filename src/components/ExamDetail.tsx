"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  X, Save, Calendar, Plus, Trash2, CheckSquare, Square, ClipboardList, GraduationCap, CalendarRange,
} from "lucide-react";
import { Exam, ExamTopic, PracticeTest } from "@/lib/types";
import { WEEK_NUMBERS, formatWeekTitle, parseWeekNumber } from "@/lib/weeks";
import { btnIcon, btnIconDanger, btnPrimary, btnSecondary, countdownBadge, filterActive, filterInactive, input, microLabel } from "@/lib/ui";

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
  const hasChanges = name !== exam.name || examDate !== (exam.examDate?.split("T")[0] ?? "");

  const [newTopic, setNewTopic] = useState("");
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<number>>(new Set());
  const [showTestForm, setShowTestForm] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const [testScore, setTestScore] = useState("");
  const [testMaxScore, setTestMaxScore] = useState("");
  const [testNotes, setTestNotes] = useState("");

  const handleSave = () => {
    onUpdateExam(exam.id, {
      name: name.trim(),
      examDate: examDate || null,
    });
  };

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    onAddTopic(exam.id, newTopic.trim());
    setNewTopic("");
  };

  const existingWeekNumbers = new Set(
    topics.map((t) => parseWeekNumber(t.name)).filter((n): n is number => n !== null)
  );

  const toggleWeek = (w: number) => {
    if (existingWeekNumbers.has(w)) return;
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });
  };

  const handleAddWeeks = () => {
    const sorted = Array.from(selectedWeeks).sort((a, b) => a - b);
    for (const w of sorted) {
      onAddTopic(exam.id, formatWeekTitle(w));
    }
    setSelectedWeeks(new Set());
    setShowWeekPicker(false);
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
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "var(--overlay-bg)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-lg overflow-y-auto border-l p-6"
        style={{ background: "var(--detail-bg)", borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            {days !== null && (() => {
              const badge = countdownBadge(days);
              return badge ? (
                <span className={badge.className}>
                  {days < 0 ? "Past due" : days === 0 ? "Exam today!" : `${days} day${days !== 1 ? "s" : ""} left`}
                </span>
              ) : null;
            })()}
          </div>
          <button onClick={onClose} className={btnIcon}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Name + Date */}
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-display w-full bg-transparent text-2xl outline-none"
              style={{ color: "var(--foreground)" }}
              placeholder="Exam name..."
            />
            <div>
              <label className={`${microLabel} mb-1 flex items-center gap-1`}>
                <Calendar className="h-3 w-3" /> Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className={input}
              />
            </div>
          </div>

          {/* Topic Checklist */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg" style={{ color: "var(--foreground)" }}>Topics</h3>
                {topics.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}>
                    {revisedCount}/{topics.length}
                  </span>
                )}
              </div>
            </div>

            {topics.length > 0 && (
              <div className="progress-track mb-3 w-full">
                <motion.div
                  className="progress-fill"
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
                    className="group flex items-center justify-between px-2 py-1.5 transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <button
                      onClick={() => onToggleTopic(exam.id, topic.id)}
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: topic.revised ? "var(--muted-fg)" : "var(--fg)" }}
                    >
                      {topic.revised ? (
                        <CheckSquare className="h-4 w-4 shrink-0" style={{ color: "var(--active)" }} />
                      ) : (
                        <Square className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                      )}
                      <span className={topic.revised ? "line-through opacity-60" : ""}>{topic.name}</span>
                    </button>
                    <button
                      onClick={() => onDeleteTopic(exam.id, topic.id)}
                      className={btnIconDanger + " opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100"}
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
                className={`${input} flex-1 py-1.5`}
              />
              <button onClick={handleAddTopic} disabled={!newTopic.trim()} className={btnSecondary}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2">
              {!showWeekPicker ? (
                <button
                  onClick={() => setShowWeekPicker(true)}
                  className="btn btn-ghost flex items-center gap-1.5 text-xs"
                >
                  <CalendarRange className="h-3.5 w-3.5" />
                  Add Weeks
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="panel-inset overflow-hidden p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={microLabel}>Select weeks</span>
                    <button
                      onClick={() => { setShowWeekPicker(false); setSelectedWeeks(new Set()); }}
                      className={btnIcon}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {WEEK_NUMBERS.map((w) => {
                      const alreadyExists = existingWeekNumbers.has(w);
                      const isSelected = selectedWeeks.has(w);
                      return (
                        <button
                          key={w}
                          onClick={() => toggleWeek(w)}
                          disabled={alreadyExists}
                          className={`border px-2 py-1.5 text-xs font-medium transition-all ${
                            alreadyExists ? "chip opacity-40" : isSelected ? filterActive : filterInactive
                          }`}
                        >
                          {alreadyExists ? `W${w} ✓` : `Week ${w}`}
                        </button>
                      );
                    })}
                  </div>
                  {selectedWeeks.size > 0 && (
                    <button onClick={handleAddWeeks} className={`${btnPrimary} mt-2.5 w-full justify-center text-xs`}>
                      <Plus className="h-3.5 w-3.5" />
                      Add {selectedWeeks.size} week{selectedWeeks.size !== 1 ? "s" : ""}
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Practice Tests */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg" style={{ color: "var(--foreground)" }}>Practice Tests</h3>
                {practiceTests.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}>
                    {practiceTests.length}
                  </span>
                )}
              </div>
              {!showTestForm && (
                <button onClick={() => setShowTestForm(true)} className={btnSecondary}>
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
                  <div className="panel-inset space-y-2 p-3">
                    <input autoFocus value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder="Test name..." className={input} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={testScore} onChange={(e) => setTestScore(e.target.value.replace(/\D/g, ""))} placeholder="Score" className={input} />
                      <input value={testMaxScore} onChange={(e) => setTestMaxScore(e.target.value.replace(/\D/g, ""))} placeholder="Max score" className={input} />
                    </div>
                    <input value={testNotes} onChange={(e) => setTestNotes(e.target.value)} placeholder="Notes (optional)..." className={input} />
                    <div className="flex gap-2">
                      <button onClick={handleAddTest} disabled={!testTitle.trim()} className={btnPrimary}>
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                      <button
                        onClick={() => { setShowTestForm(false); setTestTitle(""); setTestScore(""); setTestMaxScore(""); setTestNotes(""); }}
                        className={btnSecondary}
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
                  className="group flex items-center justify-between px-2 py-2 transition-colors"
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
                    className={btnIconDanger + " opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100"}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}>
            {hasChanges && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleSave} className={btnPrimary}>
                <Save className="h-4 w-4" /> Save Changes
              </motion.button>
            )}
            {!hasChanges && <div />}
            <button
              onClick={() => { onDeleteExam(exam.id); onClose(); }}
              className="btn btn-ghost flex items-center gap-1.5 text-xs btn-danger-ghost"
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
