"use client";

import { motion } from "framer-motion";
import { BookOpen, Clock, CheckCircle2, ListTodo } from "lucide-react";

interface StatsBarProps {
  total: number;
  backlog: number;
  inProgress: number;
  completed: number;
}

const statItems = [
  { key: "total", label: "Total", icon: BookOpen, from: "#f0d5d0", to: "#e8b4ad", iconBg: "#d4918a" },
  { key: "backlog", label: "Backlog", icon: ListTodo, from: "#f2e7b1", to: "#e8d88a", iconBg: "#c9b85e" },
  { key: "inProgress", label: "In Progress", icon: Clock, from: "#b1c8d4", to: "#8fb3c4", iconBg: "#6a96ab" },
  { key: "completed", label: "Completed", icon: CheckCircle2, from: "#6c8f7e", to: "#5a7d6c", iconBg: "#47695a" },
] as const;

export default function StatsBar({ total, backlog, inProgress, completed }: StatsBarProps) {
  const values = { total, backlog, inProgress, completed };

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
          {/* Gloss overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 40%, transparent 60%)",
          }} />
          <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-30 blur-2xl" style={{ background: item.from }} />

          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ background: item.iconBg }}>
              <item.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">{values[item.key]}</p>
              <p className="text-xs font-medium text-zinc-800/60">{item.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
