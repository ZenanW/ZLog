"use client";

import { format } from "date-fns";
import { TodayItem, TodayKind } from "@/lib/today";

interface TodayListProps {
  items: TodayItem[];
  onOpen: (item: TodayItem) => void;
}

const KIND_LABEL: Record<TodayKind, string> = {
  assignment: "Assignment",
  exam: "Exam",
  lecture: "Lecture",
};

export default function TodayList({ items, onOpen }: TodayListProps) {
  const now = new Date();

  return (
    <section className="panel mb-6 px-5 py-5 sm:px-6">
      <div
        className="flex items-end justify-between gap-4 border-b pb-4"
        style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}
      >
        <div>
          <p className="micro-label mb-1">For today</p>
          <h2 className="font-display text-3xl leading-none" style={{ color: "var(--foreground)" }}>
            Today
          </h2>
        </div>
        <div className="text-right">
          <p className="micro-label mb-1">{format(now, "EEEE")}</p>
          <p className="font-display text-2xl leading-none" style={{ color: "var(--foreground)" }}>
            {format(now, "d MMM")}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="pt-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Nothing due.
        </p>
      ) : (
        <div>
          {items.map((item, index) => (
            <button
              key={`${item.kind}:${item.id}`}
              type="button"
              onClick={() => onOpen(item)}
              className="flex w-full items-center gap-4 border-b border-l-2 py-3.5 pl-3 text-left transition-colors last:border-b-0"
              style={{
                borderBottomColor: "color-mix(in oklch, var(--border) 60%, transparent)",
                borderLeftColor: item.urgent ? "var(--alert)" : "transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span
                className="font-display w-8 shrink-0 text-lg leading-none"
                style={{ color: "var(--muted-foreground)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className="h-2 w-2 shrink-0"
                style={{ background: item.subjectColor ?? "var(--border)" }}
              />
              <span className="min-w-0 flex-1">
                <span className="font-display block truncate text-xl leading-tight" style={{ color: "var(--foreground)" }}>
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {item.subjectName}
                  <span aria-hidden="true"> · </span>
                  {KIND_LABEL[item.kind]}
                </span>
              </span>
              <span
                className="micro-label shrink-0"
                style={{ color: item.urgent ? "var(--alert)" : "var(--muted-foreground)" }}
              >
                {item.reason}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
