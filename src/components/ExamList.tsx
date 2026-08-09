"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, Check, GraduationCap, Calendar } from "lucide-react";
import { Exam } from "@/lib/types";
import { btnPrimary, btnSecondary, countdownBadge, microLabel, panel } from "@/lib/ui";

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
    <div className={panel}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={microLabel}>Exams</h2>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="btn btn-secondary flex items-center gap-1.5">
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
            <div className="panel-inset space-y-3 p-3">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setIsAdding(false); setName(""); setExamDate(""); }
                }}
                placeholder="Exam name..."
                className="input-field w-full px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="input-field w-full px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={!name.trim()} className={btnPrimary}>
                  <Check className="h-3.5 w-3.5" />
                  Add
                </button>
                <button
                  onClick={() => { setIsAdding(false); setName(""); setExamDate(""); }}
                  className={btnSecondary}
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
          <div className="empty-state py-8">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No exams yet. Add one to get started.</p>
          </div>
        )}
        <AnimatePresence>
          {exams.map((exam) => {
            const days = daysUntil(exam.examDate);
            const badge = countdownBadge(days);
            const progress = topicProgress[exam.id];
            const isSelected = selectedExamId === exam.id;

            return (
              <motion.div
                key={exam.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(exam)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(exam); } }}
                className={`group flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "chip-selected" : ""
                }`}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "color-mix(in oklch, var(--accent) 40%, transparent)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <GraduationCap className="h-4 w-4 shrink-0" style={{ color: isSelected ? "var(--foreground)" : "var(--muted-foreground)" }} />
                  <div className="min-w-0">
                    <span className="font-display block truncate text-sm" style={{ color: "var(--foreground)" }}>{exam.name}</span>
                    {progress && progress.total > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="progress-track w-16">
                          <div
                            className="progress-fill transition-all"
                            style={{ width: `${(progress.revised / progress.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                          {progress.revised}/{progress.total}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {badge && (
                    <span className={badge.className}>{badge.text}</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(exam.id); }}
                    className="btn-icon btn-danger-ghost opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
