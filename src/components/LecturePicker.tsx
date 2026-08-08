"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, Check } from "lucide-react";
import { Lecture, Subject } from "@/lib/types";
import { filterBacklogTrackedLectures, isNotesCaptureLecture } from "@/lib/lectures";
import { btnPrimary, btnSecondary, microLabel, panel } from "@/lib/ui";
import SubjectBadge from "./SubjectBadge";

interface LecturePickerProps {
  subjects: Subject[];
  lectures: Lecture[];
  onSelect: (lecture: Lecture) => void;
  onQuickCreate: (data: { subjectId: string; title: string }) => Promise<Lecture | undefined>;
  onCancel: () => void;
}

function groupLecturesBySubject(
  subjects: Subject[],
  lectures: Lecture[],
  search: string
) {
  const q = search.trim().toLowerCase();
  const filtered = lectures
    .filter((l) => !q || l.title.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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

function LectureGroupList({
  groups,
  onSelect,
}: {
  groups: ReturnType<typeof groupLecturesBySubject>;
  onSelect: (lecture: Lecture) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <>
      {groups.map(({ subject, lectures: subjectLectures }) => (
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
                <span className="font-display truncate">{lecture.title}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export default function LecturePicker({
  subjects,
  lectures,
  onSelect,
  onQuickCreate,
  onCancel,
}: LecturePickerProps) {
  const [search, setSearch] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickSubjectId, setQuickSubjectId] = useState(subjects[0]?.id ?? "");
  const [quickTitle, setQuickTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const backlogLectures = useMemo(
    () => filterBacklogTrackedLectures(lectures),
    [lectures]
  );
  const captureLectures = useMemo(
    () => lectures.filter(isNotesCaptureLecture),
    [lectures]
  );

  const backlogGroups = useMemo(
    () => groupLecturesBySubject(subjects, backlogLectures, search),
    [subjects, backlogLectures, search]
  );
  const captureGroups = useMemo(
    () => groupLecturesBySubject(subjects, captureLectures, search),
    [subjects, captureLectures, search]
  );

  const hasResults = backlogGroups.length > 0 || captureGroups.length > 0;

  const handleQuickCreate = async () => {
    if (!quickSubjectId || !quickTitle.trim() || creating) return;
    setCreating(true);
    try {
      const lecture = await onQuickCreate({ subjectId: quickSubjectId, title: quickTitle.trim() });
      if (lecture) onSelect(lecture);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className={`${panel} space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className={microLabel}>Choose a lecture</h3>
          <button type="button" onClick={onCancel} className="btn-icon">
            <X className="h-4 w-4" />
          </button>
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

        <div className="max-h-64 space-y-4 overflow-y-auto">
          {!hasResults ? (
            <p className="py-4 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              {lectures.length === 0 ? "No lectures yet." : "No lectures match your search."}
            </p>
          ) : (
            <>
              {backlogGroups.length > 0 && (
                <div className="space-y-4">
                  <p className={microLabel}>Backlog lectures</p>
                  <LectureGroupList groups={backlogGroups} onSelect={onSelect} />
                </div>
              )}
              {captureGroups.length > 0 && (
                <div className="space-y-4">
                  <p className={microLabel}>Capture lectures</p>
                  <LectureGroupList groups={captureGroups} onSelect={onSelect} />
                </div>
              )}
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showQuickCreate ? (
            <motion.div
              key="quick-create"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="panel-inset space-y-3 p-3">
                <p className={microLabel}>New capture lecture</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  For live note-taking — stays in Notes only, not your backlog.
                </p>
                {subjects.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Add a subject first from the Lectures tab.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((s) => (
                        <SubjectBadge
                          key={s.id}
                          name={s.name}
                          color={s.color}
                          active={quickSubjectId === s.id}
                          onClick={() => setQuickSubjectId(s.id)}
                        />
                      ))}
                    </div>
                    <input
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleQuickCreate();
                        if (e.key === "Escape") {
                          setShowQuickCreate(false);
                          setQuickTitle("");
                        }
                      }}
                      placeholder="Lecture title..."
                      className="input-field w-full px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleQuickCreate}
                        disabled={!quickTitle.trim() || creating}
                        className={btnPrimary}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Create & attach
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickCreate(false);
                          setQuickTitle("");
                        }}
                        className={btnSecondary}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={() => setShowQuickCreate(true)}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Plus className="h-3.5 w-3.5" />
              New capture lecture
            </button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
