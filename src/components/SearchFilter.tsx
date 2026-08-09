"use client";

import { Search } from "lucide-react";
import { LectureStatus, Priority, Subject } from "@/lib/types";
import { filterActive, filterInactive } from "@/lib/ui";
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search lectures..."
          className="input-field w-full py-2.5 pl-10 pr-4 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="segment-track flex max-w-full flex-wrap gap-0.5 p-0.5">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`px-2 py-1 text-xs font-medium transition-all sm:px-2.5 ${
                statusFilter === opt.value ? filterActive : filterInactive
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {subjects.length > 0 && (
          <div className="hidden h-4 w-px sm:block" style={{ background: "var(--border)" }} />
        )}

        <div className="flex max-w-full flex-wrap gap-1.5">
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
    </div>
  );
}
