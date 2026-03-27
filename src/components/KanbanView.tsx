"use client";

import { AnimatePresence } from "framer-motion";
import { ListTodo, Clock, CheckCircle2 } from "lucide-react";
import { Lecture, LectureStatus, Subject } from "@/lib/types";
import LectureCard from "./LectureCard";

interface KanbanViewProps {
  lectures: Lecture[];
  subjects: Subject[];
  getSubject: (id: string) => Subject | undefined;
  onSelect: (lecture: Lecture) => void;
  onMove: (id: string, status: LectureStatus) => void;
  onDelete: (id: string) => void;
}

const columns: { status: LectureStatus; label: string; icon: React.ElementType; accent: string }[] = [
  { status: "backlog", label: "Backlog", icon: ListTodo, accent: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { status: "in_progress", label: "In Progress", icon: Clock, accent: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { status: "completed", label: "Completed", icon: CheckCircle2, accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
];

export default function KanbanView({ lectures, getSubject, onSelect, onMove, onDelete }: KanbanViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const colLectures = lectures.filter((l) => l.status === col.status);
        return (
          <div key={col.status} className="rounded-2xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
            <div className="mb-3 flex items-center gap-2 px-1">
              <div className={`flex h-6 w-6 items-center justify-center rounded-md border ${col.accent}`}>
                <col.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--muted-fg)" }}>{col.label}</span>
              <span className="ml-auto rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--surface-hover)", color: "var(--card-text-secondary)" }}>
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
                <p className="py-8 text-center text-xs" style={{ color: "var(--card-text-secondary)" }}>No lectures</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
