"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, Check, GraduationCap, Calendar } from "lucide-react";
import { Exam } from "@/lib/types";

interface ExamListProps {
  exams: Exam[];
  selectedExamId: string | null;
  onSelect: (exam: Exam) => void;
  onAdd: (name: string, examDate: string | null) => void;
  onDelete: (id: string) => void;
  topicProgress: Record<string, { revised: number; total: number }>;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function countdownBadge(days: number | null) {
  if (days === null) return null;
  if (days < 0) return { text: "Past", className: "bg-zinc-500/15 text-zinc-400" };
  if (days === 0) return { text: "Today", className: "bg-red-500/15 text-red-400" };
  if (days <= 3) return { text: `${days}d`, className: "bg-red-500/15 text-red-400" };
  if (days <= 7) return { text: `${days}d`, className: "bg-amber-500/15 text-amber-500" };
  return { text: `${days}d`, className: "bg-indigo-500/10 text-indigo-400" };
}

export default function ExamList({ exams, selectedExamId, onSelect, onAdd, onDelete, topicProgress }: ExamListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), examDate || null);
    setName("");
    setExamDate("");
    setIsAdding(false);
  };

  return (
    <div className="rounded-2xl border p-5 backdrop-blur-sm" style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>Exams</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="space-y-3 rounded-xl border p-3" style={{ background: "var(--surface-hover)", borderColor: "var(--border-color)" }}>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setIsAdding(false); setName(""); setExamDate(""); }
                }}
                placeholder="Exam name..."
                className="w-full rounded-lg border px-3 py-2 text-sm placeholder-zinc-500 outline-none focus:border-indigo-500/50"
                style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
              />
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-fg)" }} />
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
                  style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!name.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                  Add
                </button>
                <button
                  onClick={() => { setIsAdding(false); setName(""); setExamDate(""); }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ background: "var(--surface-hover)", color: "var(--muted-fg)" }}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        {exams.length === 0 && !isAdding && (
          <p className="py-4 text-center text-sm" style={{ color: "var(--card-text-secondary)" }}>No exams yet. Add one to get started.</p>
        )}
        <AnimatePresence>
          {exams.map((exam) => {
            const days = daysUntil(exam.examDate);
            const badge = countdownBadge(days);
            const progress = topicProgress[exam.id];
            const isSelected = selectedExamId === exam.id;

            return (
              <motion.button
                key={exam.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => onSelect(exam)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "bg-indigo-500/10" : ""
                }`}
                style={!isSelected ? { background: "transparent" } : undefined}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--surface-hover)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <GraduationCap className="h-4 w-4 shrink-0" style={{ color: isSelected ? "#6366f1" : "var(--muted-fg)" }} />
                  <div className="min-w-0">
                    <span className="block truncate text-sm" style={{ color: isSelected ? "#6366f1" : "var(--fg)" }}>{exam.name}</span>
                    {progress && progress.total > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 w-16 overflow-hidden rounded-full" style={{ background: "var(--border-color)" }}>
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${(progress.revised / progress.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px]" style={{ color: "var(--card-text-secondary)" }}>
                          {progress.revised}/{progress.total}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {badge && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}>
                      {badge.text}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(exam.id); }}
                    className="rounded-md p-1 text-zinc-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
