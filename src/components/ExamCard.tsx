"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { GraduationCap, Calendar, CheckSquare, TrendingUp } from "lucide-react";
import { Exam, ExamTopic, PracticeTest } from "@/lib/types";
import { countdownBadge, microLabel } from "@/lib/ui";

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
  const badge = countdownBadge(days);
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
      className="panel-hover panel cursor-pointer p-4 transition-colors"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          <h3 className="font-display text-base" style={{ color: "var(--foreground)" }}>{exam.name}</h3>
        </div>
        {badge && days !== null && (
          <span className={badge.className}>
            {days < 0 ? "Past" : days === 0 ? "Today" : `${days}d left`}
          </span>
        )}
      </div>

      {exam.examDate && (
        <div className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <Calendar className="h-3 w-3" />
          {format(new Date(exam.examDate), "MMM d, yyyy")}
        </div>
      )}

      {topics.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <div className={`flex items-center gap-1.5 ${microLabel}`}>
              <CheckSquare className="h-3 w-3" />
              Topics
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
              {revisedCount}/{topics.length}
            </span>
          </div>
          <div className="progress-track w-full">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${topicPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {latestScore !== null && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <TrendingUp className="h-3 w-3" />
            Latest: <span className="font-medium" style={{ color: "var(--foreground)" }}>{latestScore}%</span>
          </div>
        )}
        {practiceTests.length > 0 && (
          <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {practiceTests.length} test{practiceTests.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </motion.div>
  );
}
