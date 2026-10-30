"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar, FileText } from "lucide-react";
import { ASSIGNMENT_STATUS_LABELS, Assignment, Subject } from "@/lib/types";
import { countdownBadge } from "@/lib/ui";
import SubjectBadge from "./SubjectBadge";

interface AssignmentCardProps {
  assignment: Assignment;
  subject: Subject | null;
  onSelect: (assignment: Assignment) => void;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function AssignmentCard({ assignment, subject, onSelect }: AssignmentCardProps) {
  const days = daysUntil(assignment.dueDate);
  const badge = countdownBadge(days);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={() => onSelect(assignment)}
      className="panel-hover panel cursor-pointer p-4 transition-colors"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <h3 className="font-display truncate text-base" style={{ color: "var(--foreground)" }}>{assignment.name}</h3>
        </div>
        {badge && days !== null && (
          <span className={badge.className}>
            {days < 0 ? "Past" : days === 0 ? "Today" : `${days}d left`}
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {subject && <SubjectBadge name={subject.name} color={subject.color} />}
        <span className="chip px-2 py-1 text-[10px]">{ASSIGNMENT_STATUS_LABELS[assignment.status]}</span>
      </div>

      {assignment.dueDate && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <Calendar className="h-3 w-3" />
          Due {format(new Date(assignment.dueDate), "MMM d, yyyy")}
        </div>
      )}
    </motion.div>
  );
}
