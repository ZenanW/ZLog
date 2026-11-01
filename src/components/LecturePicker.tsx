"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Lecture, Subject } from "@/lib/types";
import { parseWeekNumber } from "@/lib/weeks";
import { microLabel, panel } from "@/lib/ui";
import SubjectBadge from "./SubjectBadge";

interface LecturePickerProps {
  subjects: Subject[];
  lectures: Lecture[];
  readyLectureIds?: string[];
  generatingLectureId?: string | null;
  onSelect: (lecture: Lecture) => void;
  onCancel?: () => void;
}

function groupLecturesBySubject(
  subjects: Subject[],
  lectures: Lecture[],
  search: string
) {
  const q = search.trim().toLowerCase();
  const filtered = lectures
    .filter((l) => !q || l.title.toLowerCase().includes(q))
    .sort((a, b) => {
      const aw = parseWeekNumber(a.title);
      const bw = parseWeekNumber(b.title);
      if (aw !== null && bw !== null && aw !== bw) return aw - bw;
      if (aw !== null && bw === null) return -1;
      if (aw === null && bw !== null) return 1;
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    });

  const bySubject = new Map<string, Lecture[]>();
  for (const lecture of filtered) {
    const list = bySubject.get(lecture.subjectId) ?? [];
    list.push(lecture);
    bySubject.set(lecture.subjectId, list);
  }

  return subjects
    .filter((s) => bySubject.has(s.id))
    .map((subject) => ({
      subject,
      lectures: bySubject.get(subject.id)!,
    }));
}

export default function LecturePicker({
  subjects,
  lectures,
  readyLectureIds,
  generatingLectureId,
  onSelect,
  onCancel,
}: LecturePickerProps) {
  const ready = new Set(readyLectureIds ?? []);
  const [search, setSearch] = useState("");

  const groups = useMemo(
    () => groupLecturesBySubject(subjects, lectures, search),
    [subjects, lectures, search]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[70vh] flex-1 flex-col lg:h-full lg:min-h-0"
    >
      <div className={`${panel} flex min-h-0 flex-1 flex-col space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className={microLabel}>Choose a lecture</h3>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-icon">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--muted-foreground)" }}
          />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lectures..."
            className="input-field w-full py-2.5 pl-10 pr-4 text-sm"
          />
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {groups.length === 0 ? (
            <p className="py-4 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              {lectures.length === 0
                ? "Add a lecture on the Lectures tab first."
                : "No lectures match your search."}
            </p>
          ) : (
            groups.map(({ subject, lectures: subjectLectures }) => (
              <div key={subject.id}>
                <div className="mb-2">
                  <SubjectBadge name={subject.name} color={subject.color} size="md" />
                </div>
                <div className="space-y-1">
                  {subjectLectures.map((lecture) => (
                    <button
                      key={lecture.id}
                      type="button"
                      onClick={() => onSelect(lecture)}
                      className="flex w-full items-center px-3 py-2 text-left text-sm transition-colors"
                      style={{ color: "var(--foreground)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "color-mix(in oklch, var(--accent) 40%, transparent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span className="font-display min-w-0 flex-1 truncate">{lecture.title}</span>
                      {generatingLectureId === lecture.id ? (
                        <span className="chip chip-active ml-2 shrink-0 px-1.5 py-0.5 text-[10px]">Generating</span>
                      ) : ready.has(lecture.id) ? (
                        <span className="chip ml-2 shrink-0 px-1.5 py-0.5 text-[10px]">Set ready</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
