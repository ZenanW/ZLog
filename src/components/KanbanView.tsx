"use client";

import { AnimatePresence } from "framer-motion";
import { ListTodo, Clock, CheckCircle2 } from "lucide-react";
import { Lecture, LectureStatus, Subject } from "@/lib/types";
import { sortLecturesByUnitAndWeek } from "@/lib/lectures";
import { microLabel } from "@/lib/ui";
import LectureCard from "./LectureCard";

interface KanbanViewProps {
  lectures: Lecture[];
  subjects: Subject[];
  getSubject: (id: string) => Subject | undefined;
  onSelect: (lecture: Lecture) => void;
  onPractice?: (lecture: Lecture) => void;
  onMove: (id: string, status: LectureStatus) => void;
  onDelete: (id: string) => void;
}

const columns: { status: LectureStatus; label: string; icon: React.ElementType }[] = [
  { status: "backlog", label: "Backlog", icon: ListTodo },
  { status: "in_progress", label: "In Progress", icon: Clock },
  { status: "completed", label: "Completed", icon: CheckCircle2 },
];

function groupBySubject(lectures: Lecture[], subjects: Subject[]) {
  const groups: { subjectId: string; subject: Subject | undefined; lectures: Lecture[] }[] = [];
  for (const lecture of sortLecturesByUnitAndWeek(lectures, subjects)) {
    const last = groups[groups.length - 1];
    if (last && last.subjectId === lecture.subjectId) {
      last.lectures.push(lecture);
    } else {
      groups.push({
        subjectId: lecture.subjectId,
        subject: subjects.find((s) => s.id === lecture.subjectId),
        lectures: [lecture],
      });
    }
  }
  return groups;
}

export default function KanbanView({ lectures, subjects, getSubject, onSelect, onPractice, onMove, onDelete }: KanbanViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const groups = groupBySubject(
          lectures.filter((l) => l.status === col.status),
          subjects
        );
        const count = groups.reduce((n, g) => n + g.lectures.length, 0);
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
                {count}
              </span>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {groups.map((group) => (
                  <div key={group.subjectId} className="space-y-2">
                    {group.subject && (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="h-2 w-2 shrink-0" style={{ backgroundColor: group.subject.color }} />
                        <span className={microLabel}>{group.subject.name}</span>
                      </div>
                    )}
                    {group.lectures.map((lecture) => (
                      <LectureCard
                        key={lecture.id}
                        lecture={lecture}
                        subject={getSubject(lecture.subjectId)}
                        onSelect={onSelect}
                        onPractice={onPractice}
                        onMove={onMove}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                ))}
              </AnimatePresence>
              {count === 0 && (
                <p className="py-8 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>No lectures</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
