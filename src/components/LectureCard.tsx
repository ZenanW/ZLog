"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ChevronRight,
  Clock,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Lecture, LectureStatus, Subject } from "@/lib/types";

interface LectureCardProps {
  lecture: Lecture;
  subject: Subject | undefined;
  onSelect: (lecture: Lecture) => void;
  onMove: (id: string, status: LectureStatus) => void;
  onDelete: (id: string) => void;
}

const statusFlow: LectureStatus[] = ["backlog", "in_progress", "completed"];

const priorityConfig = {
  low: { label: "Low", class: "text-zinc-500" },
  medium: { label: "Med", class: "text-amber-400" },
  high: { label: "High", class: "text-red-400" },
};

export default function LectureCard({ lecture, subject, onSelect, onMove, onDelete }: LectureCardProps) {
  const currentIdx = statusFlow.indexOf(lecture.status);
  const canMoveForward = currentIdx < statusFlow.length - 1;
  const canMoveBack = currentIdx > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/15 hover:bg-white/[0.04]"
    >
      {subject && (
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ backgroundColor: subject.color }} />
      )}

      <div className="flex items-start justify-between p-4 pl-5">
        <button
          onClick={() => onSelect(lecture)}
          className="flex-1 text-left"
        >
          <h3 className="mb-1 text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
            {lecture.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {subject && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                {subject.name}
              </span>
            )}
            {lecture.priority === "high" && (
              <span className={`flex items-center gap-0.5 ${priorityConfig.high.class}`}>
                <AlertTriangle className="h-3 w-3" />
                High
              </span>
            )}
            {lecture.duration && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {lecture.duration}m
              </span>
            )}
            {lecture.lectureDate && (
              <span className="flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                {format(new Date(lecture.lectureDate), "MMM d")}
              </span>
            )}
          </div>
          {lecture.notes && (
            <p className="mt-1.5 line-clamp-2 text-xs text-zinc-600">
              {lecture.notes}
            </p>
          )}
          {lecture.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {lecture.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </button>

        <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canMoveBack && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(lecture.id, statusFlow[currentIdx - 1]); }}
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-300"
              title={`Move to ${statusFlow[currentIdx - 1]}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          {canMoveForward && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(lecture.id, statusFlow[currentIdx + 1]); }}
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-300"
              title={`Move to ${statusFlow[currentIdx + 1]}`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(lecture.id); }}
            className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={() => onSelect(lecture)}
          className="ml-1 rounded-md p-1 text-zinc-600 transition-colors hover:text-zinc-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
