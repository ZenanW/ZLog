"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, ArrowRight, ArrowLeft, Trash2, Sparkles } from "lucide-react";
import { Lecture, LectureStatus, LecturePdf, Note, Priority, Subject } from "@/lib/types";
import {
  btnIconDanger, btnPrimary, input, microLabel, panel, priorityChip, statusChip,
} from "@/lib/ui";
import LecturePdfs from "@/components/LecturePdfs";
import LectureNotesSection from "@/components/LectureNotesSection";

interface ExpandedLectureCardProps {
  lecture: Lecture;
  subject: Subject | undefined;
  subjects: Subject[];
  idToken: string | null;
  lectureNotes: Note[];
  onOpenNote: (noteId: string) => void;
  onTakeNotes: () => void;
  onUpdate: (id: string, updates: Partial<Omit<Lecture, "id" | "createdAt">>) => void;
  onMove: (id: string, status: LectureStatus) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<LectureStatus, string> = {
  backlog: "Backlog", in_progress: "In Progress", completed: "Completed", notes_only: "Capture",
};

const statusFlow: LectureStatus[] = ["backlog", "in_progress", "completed"];

export default function ExpandedLectureCard({
  lecture, subject, subjects, idToken, lectureNotes, onOpenNote, onTakeNotes,
  onUpdate, onMove, onDelete,
}: ExpandedLectureCardProps) {
  const [title, setTitle] = useState(lecture.title);
  const [priority, setPriority] = useState<Priority>(lecture.priority);
  const [subjectId, setSubjectId] = useState(lecture.subjectId);
  const [pdfs, setPdfs] = useState<LecturePdf[]>([]);

  const hasChanges =
    title !== lecture.title || priority !== lecture.priority || subjectId !== lecture.subjectId;

  const handleSave = () => {
    onUpdate(lecture.id, { title: title.trim(), priority, subjectId });
  };

  const currentIdx = statusFlow.indexOf(lecture.status);
  const analyzed = pdfs.filter((p) => p.analyzedAt && p.summary);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={panel}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="font-display min-w-0 flex-1 bg-transparent text-lg outline-none"
            style={{ color: "var(--foreground)" }}
            placeholder="Lecture title..."
          />
          <span className={`shrink-0 px-2.5 py-0.5 text-xs font-medium ${statusChip(lecture.status)}`}>
            {statusLabels[lecture.status]}
          </span>
          {subject && (
            <span className="flex shrink-0 items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span className="h-2 w-2 shrink-0" style={{ backgroundColor: subject.color }} />
              {subject.name}
            </span>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-wrap items-center gap-1 sm:w-auto">
          {currentIdx > 0 && (
            <button
              onClick={() => onMove(lecture.id, statusFlow[currentIdx - 1])}
              className="btn btn-secondary flex items-center gap-1 text-xs"
              title={`Move to ${statusLabels[statusFlow[currentIdx - 1]]}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{statusLabels[statusFlow[currentIdx - 1]]}</span>
            </button>
          )}
          {currentIdx < statusFlow.length - 1 && (
            <button
              onClick={() => onMove(lecture.id, statusFlow[currentIdx + 1])}
              className="btn btn-secondary flex items-center gap-1 text-xs"
              title={`Move to ${statusLabels[statusFlow[currentIdx + 1]]}`}
            >
              <span className="hidden sm:inline">{statusLabels[statusFlow[currentIdx + 1]]}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => onDelete(lecture.id)} className={btnIconDanger} title="Delete lecture">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className={`${microLabel} mb-1 block`}>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={input}>
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>

          <div>
            <label className={`${microLabel} mb-1 block`}>Priority</label>
            <div className="flex gap-1">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 border px-2 py-2 text-xs font-medium capitalize transition-all ${priorityChip(p, priority === p)}`}
                >{p}</button>
              ))}
            </div>
          </div>

          <LecturePdfs lectureId={lecture.id} idToken={idToken} onPdfsChange={setPdfs} />

          <LectureNotesSection
            notes={lectureNotes}
            onOpenNote={onOpenNote}
            onTakeNotes={onTakeNotes}
          />
        </div>

        <div>
          <label className={`${microLabel} mb-1 flex items-center gap-1`}>
            <Sparkles className="h-3 w-3" /> AI Summary
          </label>
          <div className="paper-panel min-h-[180px] p-4">
            {analyzed.length > 0 ? (
              <div className="space-y-4">
                {analyzed.map((pdf) => (
                  <div key={pdf.id}>
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="max-w-[50%] truncate text-[11px] font-semibold" style={{ color: "var(--foreground)" }} title={pdf.name}>
                        {pdf.name}
                      </span>
                      {pdf.priorityRecommendation && (
                        <span className={`px-2 py-0.5 text-[10px] font-medium capitalize ${priorityChip(pdf.priorityRecommendation, true)}`}>
                          {pdf.priorityRecommendation} priority
                        </span>
                      )}
                      {pdf.difficulty !== null && (
                        <span className="chip px-2 py-0.5 text-[10px] font-medium">
                          Difficulty {pdf.difficulty}/7
                        </span>
                      )}
                    </div>
                    <p className="font-display text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{pdf.summary}</p>
                    {pdf.priorityReason && (
                      <p className="mt-1 text-[11px] italic leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        {pdf.priorityReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-center">
                <Sparkles className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                <p className="max-w-[26ch] text-xs italic leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  AI summary will be outputted here — upload a PDF and analyze it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="mt-4 border-t pt-4" style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}>
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={handleSave}
            className={btnPrimary}>
            <Save className="h-4 w-4" /> Save Changes
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
