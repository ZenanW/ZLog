"use client";

import { motion } from "framer-motion";
import { GraduationCap, CalendarClock, CheckSquare, TrendingUp } from "lucide-react";

interface ExamStatsBarProps {
  total: number;
  upcoming: number;
  topicsRevised: number;
  avgScore: number;
}

const statItems = [
  { key: "total", label: "Total Exams", icon: GraduationCap, from: "#f0d5d0", to: "#e8b4ad", iconBg: "#d4918a" },
  { key: "upcoming", label: "Next 7 Days", icon: CalendarClock, from: "#f2e7b1", to: "#e8d88a", iconBg: "#c9b85e" },
  { key: "topicsRevised", label: "Topics Done", icon: CheckSquare, from: "#b1c8d4", to: "#8fb3c4", iconBg: "#6a96ab", suffix: "%" },
  { key: "avgScore", label: "Avg Score", icon: TrendingUp, from: "#6c8f7e", to: "#5a7d6c", iconBg: "#47695a", suffix: "%" },
] as const;

export default function ExamStatsBar({ total, upcoming, topicsRevised, avgScore }: ExamStatsBarProps) {
  const values = { total, upcoming, topicsRevised, avgScore };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statItems.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl p-4"
          style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 40%, transparent 60%)",
          }} />
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-30 blur-2xl" style={{ background: item.from }} />

          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ background: item.iconBg }}>
              <item.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">
                {values[item.key]}{"suffix" in item ? item.suffix : ""}
              </p>
              <p className="text-xs font-medium text-zinc-800/60">{item.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
