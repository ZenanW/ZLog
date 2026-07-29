"use client";

import { AnimatePresence } from "framer-motion";
import { ListTodo, Clock, CheckCircle2 } from "lucide-react";
import { Lecture, LectureStatus, Subject } from "@/lib/types";
import { microLabel } from "@/lib/ui";
import LectureCard from "./LectureCard";

interface KanbanViewProps {
  lectures: Lecture[];
  subjects: Subject[];
  getSubject: (id: string) => Subject | undefined;
  onSelect: (lecture: Lecture) => void;
  onMove: (id: string, status: LectureStatus) => void;
  onDelete: (id: string) => void;
}

const columns: { status: LectureStatus; label: string; icon: React.ElementType }[] = [
  { status: "backlog", label: "Backlog", icon: ListTodo },
  { status: "in_progress", label: "In Progress", icon: Clock },
  { status: "completed", label: "Completed", icon: CheckCircle2 },
];

export default function KanbanView({ lectures, getSubject, onSelect, onMove, onDelete }: KanbanViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const colLectures = lectures.filter((l) => l.status === col.status);
        return (
          <div key={col.status} className="panel p-3">
            <div className="mb-3 flex items-center gap-2 px-1">
              <div
                className="flex h-6 w-6 items-center justify-center border"
                style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)", color: "var(--muted-foreground)" }}
              >
                <col.icon className="h-3.5 w-3.5" />
              </div>
              <span className={microLabel}>{col.label}</span>
              <span
                className="ml-auto px-2 py-0.5 text-xs"
                style={{ background: "var(--accent)", color: "var(--muted-foreground)" }}
              >
                {colLectures.length}
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {colLectures.map((lecture) => (
                  <LectureCard
                    key={lecture.id}
                    lecture={lecture}
                    subject={getSubject(lecture.subjectId)}
                    onSelect={onSelect}
                    onMove={onMove}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>
              {colLectures.length === 0 && (
                <p className="py-8 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>No lectures</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
