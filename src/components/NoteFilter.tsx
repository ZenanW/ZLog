"use client";

import { Search } from "lucide-react";
import { Lecture, Subject } from "@/lib/types";
import { filterActive, filterInactive } from "@/lib/ui";
import SubjectBadge from "./SubjectBadge";

interface NoteFilterProps {
  search: string;
  onSearchChange: (v: string) => void;
  subjectFilter: string | "all";
  onSubjectFilterChange: (v: string | "all") => void;
  lectureFilter: string | "all";
  onLectureFilterChange: (v: string | "all") => void;
  subjects: Subject[];
  lectures: Lecture[];
}

export default function NoteFilter({
  search,
  onSearchChange,
  subjectFilter,
  onSubjectFilterChange,
  lectureFilter,
  onLectureFilterChange,
  subjects,
  lectures,
}: NoteFilterProps) {
  const lecturesInSubject =
    subjectFilter === "all"
      ? []
      : lectures.filter((l) => l.subjectId === subjectFilter);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: "var(--muted-foreground)" }}
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notes..."
          className="input-field w-full py-2.5 pl-10 pr-4 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {subjects.map((s) => (
          <SubjectBadge
            key={s.id}
            name={s.name}
            color={s.color}
            active={subjectFilter === s.id}
            onClick={() => {
              if (subjectFilter === s.id) {
                onSubjectFilterChange("all");
                onLectureFilterChange("all");
              } else {
                onSubjectFilterChange(s.id);
                onLectureFilterChange("all");
              }
            }}
          />
        ))}
      </div>

      {subjectFilter !== "all" && lecturesInSubject.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="micro-label normal-case tracking-normal">Lecture</span>
          <div className="segment-track flex flex-wrap gap-0.5 p-0.5">
            <button
              type="button"
              onClick={() => onLectureFilterChange("all")}
              className={`px-2.5 py-1 text-xs font-medium transition-all ${
                lectureFilter === "all" ? filterActive : filterInactive
              }`}
            >
              All
            </button>
            {lecturesInSubject.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => onLectureFilterChange(lectureFilter === l.id ? "all" : l.id)}
                className={`max-w-[12rem] truncate px-2.5 py-1 text-xs font-medium transition-all ${
                  lectureFilter === l.id ? filterActive : filterInactive
                }`}
              >
                {l.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
