"use client";

import { Search } from "lucide-react";
import { LectureStatus, Priority, Subject } from "@/lib/types";
import SubjectBadge from "./SubjectBadge";

interface SearchFilterProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: LectureStatus | "all";
  onStatusFilterChange: (v: LectureStatus | "all") => void;
  priorityFilter: Priority | "all";
  onPriorityFilterChange: (v: Priority | "all") => void;
  subjectFilter: string | "all";
  onSubjectFilterChange: (v: string | "all") => void;
  subjects: Subject[];
}

const statusOptions: { value: LectureStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "backlog", label: "Backlog" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Done" },
];

export default function SearchFilter({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  subjectFilter,
  onSubjectFilterChange,
  subjects,
}: SearchFilterProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--muted-fg)" }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search lectures, notes, tags..."
          className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500/50 backdrop-blur-sm"
          style={{ background: "var(--input-bg)", borderColor: "var(--border-color)", color: "var(--fg)" }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border p-0.5" style={{ borderColor: "var(--border-color)", background: "var(--surface)" }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === opt.value ? "bg-indigo-500/15 text-indigo-500" : ""
              }`}
              style={statusFilter !== opt.value ? { color: "var(--muted-fg)" } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px" style={{ background: "var(--border-color)" }} />

        {subjects.map((s) => (
          <SubjectBadge
            key={s.id}
            name={s.name}
            color={s.color}
            active={subjectFilter === s.id}
            onClick={() => onSubjectFilterChange(subjectFilter === s.id ? "all" : s.id)}
          />
        ))}
      </div>
    </div>
  );
}
