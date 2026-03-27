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
  { key: "total", label: "Total", icon: BookOpen, gradient: "from-indigo-500 to-purple-500" },
  { key: "backlog", label: "Backlog", icon: ListTodo, gradient: "from-amber-500 to-orange-500" },
  { key: "inProgress", label: "In Progress", icon: Clock, gradient: "from-blue-500 to-cyan-500" },
  { key: "completed", label: "Completed", icon: CheckCircle2, gradient: "from-emerald-500 to-green-500" },
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
          className="relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm"
          style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
        >
          <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br ${item.gradient} opacity-15 blur-xl`} />
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient}`}>
              <item.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--card-text)" }}>{values[item.key]}</p>
              <p className="text-xs" style={{ color: "var(--card-text-secondary)" }}>{item.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
