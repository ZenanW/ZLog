"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, Check, GraduationCap, Calendar, FileText } from "lucide-react";
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_LABELS,
  Assignment,
  AssignmentStatus,
  Exam,
  Subject,
} from "@/lib/types";
import { btnPrimary, btnSecondary, countdownBadge, filterActive, filterInactive, microLabel, panel } from "@/lib/ui";
import SubjectBadge from "./SubjectBadge";

interface ExamListProps {
  exams: Exam[];
  assignments: Assignment[];
  subjects: Subject[];
  selectedExamId: string | null;
  selectedAssignmentId: string | null;
  onSelectExam: (exam: Exam) => void;
  onSelectAssignment: (assignment: Assignment) => void;
  onAddExam: (name: string, examDate: string | null, subjectId: string) => void;
  onAddAssignment: (data: { name: string; subjectId: string; dueDate: string | null; status: AssignmentStatus }) => void;
  onDeleteExam: (id: string) => void;
  onDeleteAssignment: (id: string) => void;
  topicProgress: Record<string, { revised: number; total: number }>;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ExamList({
  exams,
  assignments,
  subjects,
  selectedExamId,
  selectedAssignmentId,
  onSelectExam,
  onSelectAssignment,
  onAddExam,
  onAddAssignment,
  onDeleteExam,
  onDeleteAssignment,
  topicProgress,
}: ExamListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [kind, setKind] = useState<"exam" | "assignment">("exam");
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<AssignmentStatus>("not_started");

  const reset = () => {
    setIsAdding(false);
    setKind("exam");
    setName("");
    setSubjectId(null);
    setDate("");
    setStatus("not_started");
  };

  const handleAdd = () => {
    if (!name.trim() || !subjectId) return;
    if (kind === "exam") {
      onAddExam(name.trim(), date || null, subjectId);
    } else {
      onAddAssignment({
        name: name.trim(),
        subjectId,
        dueDate: date || null,
        status,
      });
    }
    reset();
  };

  const empty = exams.length === 0 && assignments.length === 0;

  return (
    <div className={panel}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={microLabel}>Exams/Assignments</h2>
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
              <div className="flex gap-1">
                {(["exam", "assignment"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setKind(value)}
                    className={`flex-1 border px-2 py-1.5 text-xs font-medium capitalize ${kind === value ? filterActive : filterInactive}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") reset();
                }}
                placeholder={kind === "exam" ? "Exam name..." : "Assignment name..."}
                className="input-field w-full px-3 py-2 text-sm"
              />
              <div>
                <label className={`${microLabel} mb-1.5 block`}>Subject</label>
                {subjects.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Add subjects on the Lectures tab first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map((subject) => (
                      <SubjectBadge
                        key={subject.id}
                        name={subject.name}
                        color={subject.color}
                        active={subjectId === subject.id}
                        onClick={() => setSubjectId(subject.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field w-full px-3 py-2 text-sm"
                  aria-label={kind === "exam" ? "Exam date" : "Due date"}
                />
              </div>
              {kind === "assignment" && (
                <div className="flex flex-wrap gap-1">
                  {ASSIGNMENT_STATUSES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatus(value)}
                      className={`${status === value ? filterActive : filterInactive} px-2 py-1 text-[10px]`}
                    >
                      {ASSIGNMENT_STATUS_LABELS[value]}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={!name.trim() || !subjectId} className={btnPrimary}>
                  <Check className="h-3.5 w-3.5" />
                  Add
                </button>
                <button onClick={reset} className={btnSecondary}>
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        {empty && !isAdding && (
          <div className="empty-state py-8">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No exams or assignments yet.</p>
          </div>
        )}
        <AnimatePresence>
          {exams.map((exam) => {
            const days = daysUntil(exam.examDate);
            const badge = countdownBadge(days);
            const progress = topicProgress[exam.id];
            const isSelected = selectedExamId === exam.id;
            const subject = subjects.find((s) => s.id === exam.subjectId);

            return (
              <motion.div
                key={exam.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                role="button"
                tabIndex={0}
                onClick={() => onSelectExam(exam)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectExam(exam); } }}
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
                    {subject && (
                      <span className="block truncate text-[10px]" style={{ color: "var(--muted-foreground)" }}>{subject.name}</span>
                    )}
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
                    onClick={(e) => { e.stopPropagation(); onDeleteExam(exam.id); }}
                    className="btn-icon btn-danger-ghost opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {assignments.map((assignment) => {
            const days = daysUntil(assignment.dueDate);
            const badge = countdownBadge(days);
            const isSelected = selectedAssignmentId === assignment.id;
            const subject = subjects.find((s) => s.id === assignment.subjectId);

            return (
              <motion.div
                key={assignment.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                role="button"
                tabIndex={0}
                onClick={() => onSelectAssignment(assignment)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectAssignment(assignment); } }}
                className={`group flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "chip-selected" : ""
                }`}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "color-mix(in oklch, var(--accent) 40%, transparent)"; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0" style={{ color: isSelected ? "var(--foreground)" : "var(--muted-foreground)" }} />
                  <div className="min-w-0">
                    <span className="font-display block truncate text-sm" style={{ color: "var(--foreground)" }}>{assignment.name}</span>
                    <span className="block truncate text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      {subject ? subject.name : "Assignment"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {badge && <span className={badge.className}>{badge.text}</span>}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteAssignment(assignment.id); }}
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
