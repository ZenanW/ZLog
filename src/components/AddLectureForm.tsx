"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, X, Check } from "lucide-react";
import { Subject, Priority, Lecture } from "@/lib/types";
import { WEEK_NUMBERS, formatWeekTitle, parseWeekNumber } from "@/lib/weeks";
import { btnPrimary, btnSecondary, filterActive, filterInactive, microLabel, panel, priorityChip } from "@/lib/ui";
import SubjectBadge from "./SubjectBadge";

interface AddLectureFormProps {
  subjects: Subject[];
  lectures: Lecture[];
  onAdd: (data: {
    subjectId: string;
    title: string;
    priority?: Priority;
  }) => void;
}

export default function AddLectureForm({ subjects, lectures, onAdd }: AddLectureFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [priority, setPriority] = useState<Priority>("medium");

  const reset = () => {
    setSelectedWeek(null);
    setSelectedSubjectIds(new Set());
    setPriority("medium");
    setOpen(false);
  };

  const existingSubjectIdsForWeek = useMemo(() => {
    if (selectedWeek === null) return new Set<string>();
    return new Set(
      lectures
        .filter((l) => parseWeekNumber(l.title) === selectedWeek)
        .map((l) => l.subjectId)
    );
  }, [lectures, selectedWeek]);

  const toggleSubject = (id: string) => {
    if (existingSubjectIdsForWeek.has(id)) return;
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const newSubjectCount = selectedSubjectIds.size;
  const allTakenForWeek =
    selectedWeek !== null &&
    subjects.length > 0 &&
    subjects.every((s) => existingSubjectIdsForWeek.has(s.id));

  const handleSubmit = () => {
    if (selectedWeek === null || newSubjectCount === 0) return;
    const title = formatWeekTitle(selectedWeek);
    for (const subjectId of selectedSubjectIds) {
      onAdd({ subjectId, title, priority });
    }
    reset();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="empty-state flex w-full items-center justify-center gap-2 py-4 text-sm transition-colors hover:border-[var(--border)]"
        style={{ color: "var(--muted-foreground)" }}
      >
        <Plus className="h-4 w-4" />
        Add Lecture
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={panel}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg" style={{ color: "var(--foreground)" }}>New Lecture</h3>
        <button onClick={reset} className="btn-icon">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className={`${microLabel} mb-1.5 block`}>Week</label>
          <div className="grid grid-cols-4 gap-1.5">
            {WEEK_NUMBERS.map((w) => (
              <button
                key={w}
                onClick={() => {
                  setSelectedWeek(w);
                  setSelectedSubjectIds(new Set());
                }}
                className={`border px-2 py-1.5 text-xs font-medium transition-all ${
                  selectedWeek === w ? filterActive : filterInactive
                }`}
              >
                Week {w}
              </button>
            ))}
          </div>
        </div>

        {selectedWeek !== null && (
          <div>
            <label className={`${microLabel} mb-1.5 block`}>Subjects</label>
            {subjects.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Add subjects in the sidebar first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => {
                  const alreadyExists = existingSubjectIdsForWeek.has(s.id);
                  const isSelected = selectedSubjectIds.has(s.id);
                  return (
                    <div key={s.id} className={alreadyExists ? "opacity-40" : ""}>
                      <SubjectBadge
                        name={alreadyExists ? `${s.name} ✓` : s.name}
                        color={s.color}
                        active={isSelected}
                        onClick={() => toggleSubject(s.id)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {allTakenForWeek && (
              <p className="mt-1.5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                All subjects added for this week.
              </p>
            )}
          </div>
        )}

        <div>
          <label className={`${microLabel} mb-1 block`}>Priority</label>
          <div className="flex gap-1">
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 border px-2 py-1.5 text-xs font-medium capitalize transition-all ${priorityChip(p, priority === p)}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={selectedWeek === null || newSubjectCount === 0}
            className={btnPrimary}
          >
            <Check className="h-4 w-4" />
            {newSubjectCount > 0
              ? `Add ${newSubjectCount} lecture${newSubjectCount !== 1 ? "s" : ""}`
              : "Add Lecture"}
          </button>
          <button onClick={reset} className={btnSecondary}>
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}
