"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  X,
  Save,
  Clock,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Tag,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Lecture, LectureStatus, Priority, Subject } from "@/lib/types";

interface LectureDetailProps {
  lecture: Lecture;
  subject: Subject | undefined;
  subjects: Subject[];
  onUpdate: (id: string, updates: Partial<Omit<Lecture, "id" | "createdAt">>) => void;
  onMove: (id: string, status: LectureStatus) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const statusLabels: Record<LectureStatus, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  completed: "Completed",
};

const statusColors: Record<LectureStatus, string> = {
  backlog: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusFlow: LectureStatus[] = ["backlog", "in_progress", "completed"];

export default function LectureDetail({
  lecture,
  subject,
  subjects,
  onUpdate,
  onMove,
  onDelete,
  onClose,
}: LectureDetailProps) {
  const [title, setTitle] = useState(lecture.title);
  const [notes, setNotes] = useState(lecture.notes);
  const [priority, setPriority] = useState<Priority>(lecture.priority);
  const [duration, setDuration] = useState(lecture.duration?.toString() ?? "");
  const [lectureDate, setLectureDate] = useState(lecture.lectureDate ?? "");
  const [subjectId, setSubjectId] = useState(lecture.subjectId);
  const [tags, setTags] = useState<string[]>(lecture.tags);
  const [tagInput, setTagInput] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const changed =
      title !== lecture.title ||
      notes !== lecture.notes ||
      priority !== lecture.priority ||
      duration !== (lecture.duration?.toString() ?? "") ||
      lectureDate !== (lecture.lectureDate ?? "") ||
      subjectId !== lecture.subjectId ||
      JSON.stringify(tags) !== JSON.stringify(lecture.tags);
    setHasChanges(changed);
  }, [title, notes, priority, duration, lectureDate, subjectId, tags, lecture]);

  const handleSave = () => {
    onUpdate(lecture.id, {
      title: title.trim(),
      notes: notes.trim(),
      priority,
      duration: duration ? parseInt(duration) : null,
      lectureDate: lectureDate || null,
      subjectId,
      tags,
    });
    setHasChanges(false);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const currentIdx = statusFlow.indexOf(lecture.status);

  const autoResizeNotes = () => {
    const el = notesRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(200, el.scrollHeight) + "px";
    }
  };

  useEffect(() => {
    autoResizeNotes();
  }, [notes]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-zinc-950 p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[lecture.status]}`}
            >
              {statusLabels[lecture.status]}
            </span>
            {subject && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />
                {subject.name}
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-xl font-semibold text-white outline-none placeholder-zinc-600"
            placeholder="Lecture title..."
          />

          <div className="flex items-center gap-2">
            {statusFlow.map((status, idx) => (
              <button
                key={status}
                onClick={() => onMove(lecture.id, status)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  lecture.status === status
                    ? statusColors[status]
                    : "border-white/5 text-zinc-600 hover:border-white/10 hover:text-zinc-400"
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 [&>option]:bg-zinc-900"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-500">Priority</label>
              <div className="flex gap-1">
                {(["low", "medium", "high"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-all ${
                      priority === p
                        ? p === "high"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : p === "medium"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                        : "border-white/5 bg-white/[0.02] text-zinc-600 hover:bg-white/5"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="h-3 w-3" /> Duration (min)
              </label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 60"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
                <Calendar className="h-3 w-3" /> Lecture Date
              </label>
              <input
                type="date"
                value={lectureDate}
                onChange={(e) => setLectureDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs text-zinc-500">
              <Tag className="h-3 w-3" /> Tags
            </label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag..."
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
              />
              <button onClick={addTag} className="rounded-lg bg-white/5 px-3 text-zinc-400 hover:bg-white/10">
                <Tag className="h-4 w-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-400"
                  >
                    {tag}
                    <button
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="text-zinc-600 hover:text-zinc-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">Notes</label>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); autoResizeNotes(); }}
              placeholder="Write your lecture notes here..."
              className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-zinc-300 placeholder-zinc-600 outline-none focus:border-indigo-500/50"
              style={{ minHeight: "200px" }}
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex gap-2">
              {hasChanges && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleSave}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </motion.button>
              )}
              <div className="flex gap-1">
                {currentIdx > 0 && (
                  <button
                    onClick={() => onMove(lecture.id, statusFlow[currentIdx - 1])}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-400 hover:bg-white/10"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {statusLabels[statusFlow[currentIdx - 1]]}
                  </button>
                )}
                {currentIdx < statusFlow.length - 1 && (
                  <button
                    onClick={() => onMove(lecture.id, statusFlow[currentIdx + 1])}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-400 hover:bg-white/10"
                  >
                    {statusLabels[statusFlow[currentIdx + 1]]}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => { onDelete(lecture.id); onClose(); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>

          <p className="text-[10px] text-zinc-700">
            Created {format(new Date(lecture.createdAt), "MMM d, yyyy")} &middot; Updated{" "}
            {format(new Date(lecture.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
