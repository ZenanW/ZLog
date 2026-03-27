"use client";

import { Search, SlidersHorizontal } from "lucide-react";
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
  priorityFilter,
  onPriorityFilterChange,
  subjectFilter,
  onSubjectFilterChange,
  subjects,
}: SearchFilterProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search lectures, notes, tags..."
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500/50 backdrop-blur-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-white/5 bg-white/[0.02] p-0.5">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === opt.value
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/10" />

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
