"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar, FileText, Save, Trash2, X } from "lucide-react";
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_LABELS,
  Assignment,
  AssignmentStatus,
  Subject,
} from "@/lib/types";
import { btnPrimary, countdownBadge, filterActive, filterInactive, input, microLabel } from "@/lib/ui";
import SubjectBadge from "./SubjectBadge";

interface AssignmentDetailProps {
  assignment: Assignment;
  subjects: Subject[];
  onUpdate: (id: string, updates: Partial<Pick<Assignment, "name" | "subjectId" | "dueDate" | "status">>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function AssignmentDetail({ assignment, subjects, onUpdate, onDelete, onClose }: AssignmentDetailProps) {
  const [name, setName] = useState(assignment.name);
  const [subjectId, setSubjectId] = useState(assignment.subjectId);
  const [dueDate, setDueDate] = useState(assignment.dueDate?.split("T")[0] ?? "");
  const [status, setStatus] = useState<AssignmentStatus>(assignment.status);

  const hasChanges =
    name !== assignment.name ||
    subjectId !== assignment.subjectId ||
    dueDate !== (assignment.dueDate?.split("T")[0] ?? "") ||
    status !== assignment.status;
  const canSave = hasChanges && !!name.trim() && !!subjectId;

  const handleSave = () => {
    if (!name.trim() || !subjectId) return;
    onUpdate(assignment.id, {
      name: name.trim(),
      subjectId,
      dueDate: dueDate || null,
      status,
    });
  };

  const days = daysUntil(assignment.dueDate);

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
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            {days !== null && (() => {
              const badge = countdownBadge(days);
              return badge ? (
                <span className={badge.className}>
                  {days < 0 ? "Past due" : days === 0 ? "Due today" : `${days} day${days !== 1 ? "s" : ""} left`}
                </span>
              ) : null;
            })()}
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-display w-full bg-transparent text-2xl outline-none"
              style={{ color: "var(--foreground)" }}
              placeholder="Assignment name..."
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
            <div>
              <label className={`${microLabel} mb-1 flex items-center gap-1`}>
                <Calendar className="h-3 w-3" /> Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className={`${microLabel} mb-1.5 block`}>Status</label>
              <div className="flex flex-wrap gap-1.5">
                {ASSIGNMENT_STATUSES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={`${status === value ? filterActive : filterInactive} px-2 py-1 text-xs`}
                  >
                    {ASSIGNMENT_STATUS_LABELS[value]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}>
            {canSave && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleSave} className={btnPrimary}>
                <Save className="h-4 w-4" /> Save Changes
              </motion.button>
            )}
            {!canSave && <div />}
            <button
              onClick={() => { onDelete(assignment.id); onClose(); }}
              className="btn btn-ghost flex items-center gap-1.5 text-xs btn-danger-ghost"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Assignment
            </button>
          </div>

          <p className="text-[10px]" style={{ color: "var(--card-text-secondary)" }}>
            Created {format(new Date(assignment.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
