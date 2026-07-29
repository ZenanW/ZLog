"use client";

import { motion } from "framer-motion";
import {
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Lecture, LectureStatus, Subject } from "@/lib/types";
import { priorityTextClass } from "@/lib/ui";

interface LectureCardProps {
  lecture: Lecture;
  subject: Subject | undefined;
  onSelect: (lecture: Lecture) => void;
  onMove: (id: string, status: LectureStatus) => void;
  onDelete: (id: string) => void;
}

const statusFlow: LectureStatus[] = ["backlog", "in_progress", "completed"];

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
      className="group panel-hover relative overflow-hidden border transition-colors"
      style={{ background: "var(--surface)", borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}
    >
      {subject && (
        <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: subject.color }} />
      )}

      <div className="flex items-start justify-between p-4 pl-5">
        <button onClick={() => onSelect(lecture)} className="flex-1 text-left">
          <h3 className="font-display mb-1 text-base" style={{ color: "var(--foreground)" }}>
            {lecture.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
            {subject && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 shrink-0" style={{ backgroundColor: subject.color }} />
                {subject.name}
              </span>
            )}
            {lecture.priority === "high" && (
              <span className={`flex items-center gap-0.5 ${priorityTextClass("high")}`}>
                <AlertTriangle className="h-3 w-3" />
                High
              </span>
            )}
            {lecture.priority === "medium" && (
              <span style={{ color: "var(--muted-foreground)" }}>Medium</span>
            )}
            {lecture.priority === "low" && (
              <span className={priorityTextClass("low")}>Low</span>
            )}
          </div>
        </button>

        <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canMoveBack && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(lecture.id, statusFlow[currentIdx - 1]); }}
              className="btn-icon"
              title={`Move to ${statusFlow[currentIdx - 1]}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          {canMoveForward && (
            <button
              onClick={(e) => { e.stopPropagation(); onMove(lecture.id, statusFlow[currentIdx + 1]); }}
              className="btn-icon"
              title={`Move to ${statusFlow[currentIdx + 1]}`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(lecture.id); }}
            className="btn-icon btn-danger-ghost"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <button onClick={() => onSelect(lecture)} className="btn-icon ml-1">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
