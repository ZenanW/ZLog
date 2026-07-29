"use client";

import { motion } from "framer-motion";
import { GraduationCap, CalendarClock, CheckSquare, TrendingUp } from "lucide-react";
import { microLabel } from "@/lib/ui";

interface ExamStatsBarProps {
  total: number;
  upcoming: number;
  topicsRevised: number;
  avgScore: number;
}

const statItems = [
  { key: "total", label: "Total Exams", icon: GraduationCap },
  { key: "upcoming", label: "Next 7 Days", icon: CalendarClock },
  { key: "topicsRevised", label: "Topics Done", icon: CheckSquare, suffix: "%" },
  { key: "avgScore", label: "Avg Score", icon: TrendingUp, suffix: "%" },
] as const;

export default function ExamStatsBar({ total, upcoming, topicsRevised, avgScore }: ExamStatsBarProps) {
  const values = { total, upcoming, topicsRevised, avgScore };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statItems.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="panel px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
            <div>
              <p className="font-display text-2xl leading-none" style={{ color: "var(--foreground)" }}>
                {values[item.key]}{"suffix" in item ? item.suffix : ""}
              </p>
              <p className={microLabel}>{item.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
