"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { X, Save, Trash2, Sparkles } from "lucide-react";
import { Lecture, LectureStatus, LecturePdf, Priority, Subject } from "@/lib/types";
import {
  btnIcon, btnPrimary, input, microLabel, priorityChip, statusChip,
} from "@/lib/ui";
import LecturePdfs from "@/components/LecturePdfs";

interface LectureDetailProps {
  lecture: Lecture;
  subject: Subject | undefined;
  subjects: Subject[];
  idToken: string | null;
  onUpdate: (id: string, updates: Partial<Omit<Lecture, "id" | "createdAt">>) => void;
  onMove: (id: string, status: LectureStatus) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const statusLabels: Record<LectureStatus, string> = {
  backlog: "Backlog", in_progress: "In Progress", completed: "Completed",
};

const statusFlow: LectureStatus[] = ["backlog", "in_progress", "completed"];

const statusSegmentBg: Record<LectureStatus, string> = {
  backlog: "color-mix(in oklch, var(--quiet) 18%, transparent)",
  in_progress: "color-mix(in oklch, var(--active) 18%, transparent)",
  completed: "color-mix(in oklch, var(--active) 18%, transparent)",
};

const statusSegmentFg: Record<LectureStatus, string> = {
  backlog: "var(--quiet)",
  in_progress: "var(--active)",
  completed: "var(--active)",
};

export default function LectureDetail({ lecture, subject, subjects, idToken, onUpdate, onMove, onDelete, onClose }: LectureDetailProps) {
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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay-bg)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="panel flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden"
        style={{ background: "var(--detail-bg)" }}
      >
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}>
          <div className="flex min-w-0 items-center gap-2">
            <span className={`shrink-0 px-2.5 py-0.5 text-xs font-medium ${statusChip(lecture.status)}`}>
              {statusLabels[lecture.status]}
            </span>
            {subject && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span className="h-2 w-2 shrink-0" style={{ backgroundColor: subject.color }} />
                {subject.name}
              </span>
            )}
          </div>
          <button onClick={onClose} className={btnIcon}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="space-y-5">
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="font-display w-full bg-transparent text-2xl outline-none"
              style={{ color: "var(--foreground)" }}
              placeholder="Lecture title..."
            />

            <div className="segment-track relative grid grid-cols-3 p-1">
              <motion.div
                className="absolute inset-y-1 segment-pill"
                initial={false}
                animate={{
                  left: `calc(${currentIdx} * 100% / 3 + 0.25rem)`,
                  width: "calc(100% / 3 - 0.5rem)",
                  backgroundColor: statusSegmentBg[lecture.status],
                }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
              {statusFlow.map((status) => {
                const active = lecture.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => onMove(lecture.id, status)}
                    className="relative z-10 px-3 py-2 text-xs font-medium transition-colors"
                    style={{ color: active ? statusSegmentFg[status] : "var(--muted-foreground)" }}
                  >
                    {statusLabels[status]}
                  </button>
                );
              })}
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

            <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}>
              <div>
                {hasChanges && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={handleSave}
                    className={btnPrimary}>
                    <Save className="h-4 w-4" /> Save Changes
                  </motion.button>
                )}
              </div>
              <button onClick={() => { onDelete(lecture.id); onClose(); }}
                className="btn btn-ghost flex items-center gap-1.5 text-xs btn-danger-ghost">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>

            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              Created {format(new Date(lecture.createdAt), "MMM d, yyyy")} &middot; Updated{" "}
              {format(new Date(lecture.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
