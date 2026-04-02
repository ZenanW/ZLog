"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { GraduationCap, Calendar, CheckSquare, TrendingUp } from "lucide-react";
import { Exam, ExamTopic, PracticeTest } from "@/lib/types";

interface ExamCardProps {
  exam: Exam;
  topics: ExamTopic[];
  practiceTests: PracticeTest[];
  onSelect: (exam: Exam) => void;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ExamCard({ exam, topics, practiceTests, onSelect }: ExamCardProps) {
  const days = daysUntil(exam.examDate);
  const revisedCount = topics.filter((t) => t.revised).length;
  const topicPercent = topics.length > 0 ? Math.round((revisedCount / topics.length) * 100) : 0;
  const latestTest = practiceTests[0];
  const latestScore = latestTest?.score != null && latestTest?.maxScore
    ? Math.round((latestTest.score / latestTest.maxScore) * 100)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={() => onSelect(exam)}
      className="group cursor-pointer overflow-hidden rounded-xl border transition-all hover:shadow-md"
      style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
              <GraduationCap className="h-4 w-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--card-text)" }}>{exam.name}</h3>
          </div>
          {days !== null && (
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
              days < 0 ? "bg-zinc-500/15 text-zinc-400"
              : days === 0 ? "bg-red-500/15 text-red-400"
              : days <= 3 ? "bg-red-500/15 text-red-400"
              : days <= 7 ? "bg-amber-500/15 text-amber-500"
              : "bg-indigo-500/10 text-indigo-400"
            }`}>
              {days < 0 ? "Past" : days === 0 ? "Today" : `${days}d left`}
            </span>
          )}
        </div>

        {exam.examDate && (
          <div className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-fg)" }}>
            <Calendar className="h-3 w-3" />
            {format(new Date(exam.examDate), "MMM d, yyyy")}
          </div>
        )}

        {topics.length > 0 && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-fg)" }}>
                <CheckSquare className="h-3 w-3" />
                Topics
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--card-text)" }}>
                {revisedCount}/{topics.length}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--border-color)" }}>
              <motion.div
                className="h-full rounded-full bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${topicPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {latestScore !== null && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-fg)" }}>
              <TrendingUp className="h-3 w-3" />
              Latest: <span className="font-medium" style={{ color: "var(--card-text)" }}>{latestScore}%</span>
            </div>
          )}
          {practiceTests.length > 0 && (
            <span className="text-[10px]" style={{ color: "var(--card-text-secondary)" }}>
              {practiceTests.length} test{practiceTests.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
