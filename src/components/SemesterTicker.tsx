"use client";

import { useEffect, useMemo, useState } from "react";
import { Exam, Lecture, LecturePdf, Subject } from "@/lib/types";
import {
  pickRandomFillers, tickerScrollDuration, TICKER_MIN_SEGMENTS, TICKER_TIPS,
} from "@/lib/ticker";

interface SemesterTickerProps {
  lectures: Lecture[];
  subjects: Subject[];
  exams: Exam[];
  topicProgress: Record<string, { revised: number; total: number }>;
  idToken: string | null;
}

interface TickerSegment {
  id: string;
  text: string;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function dedupeSegments(segments: TickerSegment[]): TickerSegment[] {
  const seen = new Set<string>();
  return segments.filter((s) => {
    const key = s.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildTickerSegments(
  lectures: Lecture[],
  subjects: Subject[],
  pdfs: LecturePdf[],
  exams: Exam[],
  topicProgress: Record<string, { revised: number; total: number }>,
): TickerSegment[] {
  const segments: TickerSegment[] = [];
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "Unknown";

  const pdfsByLecture = new Map<string, LecturePdf[]>();
  for (const pdf of pdfs) {
    const list = pdfsByLecture.get(pdf.lectureId) ?? [];
    list.push(pdf);
    pdfsByLecture.set(pdf.lectureId, list);
  }

  const backlog = lectures.filter((l) => l.status === "backlog").length;
  const inProgress = lectures.filter((l) => l.status === "in_progress").length;
  const completed = lectures.filter((l) => l.status === "completed").length;
  const total = lectures.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total > 0) {
    segments.push({ id: "stat-total", text: `${total} lecture${total !== 1 ? "s" : ""} this semester` });
    segments.push({ id: "stat-progress", text: `${pct}% complete — ${completed} of ${total} done` });
    segments.push({ id: "stat-status", text: `Backlog ${backlog} · In progress ${inProgress} · Done ${completed}` });
  }

  const highPriority = lectures.filter((l) => l.status === "backlog" && l.priority === "high").length;
  if (highPriority > 0) {
    segments.push({
      id: "high-priority",
      text: `${highPriority} high-priority lecture${highPriority !== 1 ? "s" : ""} in backlog`,
    });
  }

  for (const lecture of lectures) {
    const lecturePdfs = pdfsByLecture.get(lecture.id) ?? [];
    const sub = subjectName(lecture.subjectId);
    if (lecturePdfs.length === 0) {
      segments.push({
        id: `pdf-missing-${lecture.id}`,
        text: `${lecture.title} (${sub}) — upload a PDF for AI analysis`,
      });
    } else {
      const unanalyzed = lecturePdfs.filter((p) => !p.analyzedAt);
      if (unanalyzed.length > 0) {
        segments.push({
          id: `pdf-analyze-${lecture.id}`,
          text: `${lecture.title} (${sub}) — run AI analysis on uploaded PDF`,
        });
      }
    }
  }

  for (const subject of subjects) {
    const count = lectures.filter((l) => l.subjectId === subject.id).length;
    if (count > 0) {
      const subBacklog = lectures.filter((l) => l.subjectId === subject.id && l.status === "backlog").length;
      segments.push({
        id: `subject-${subject.id}`,
        text: `${subject.name}: ${count} lecture${count !== 1 ? "s" : ""}${subBacklog > 0 ? `, ${subBacklog} in backlog` : ""}`,
      });
    }
  }

  const upcoming = exams
    .filter((e) => e.examDate && daysUntil(e.examDate) >= 0)
    .sort((a, b) => new Date(a.examDate!).getTime() - new Date(b.examDate!).getTime());

  if (upcoming.length > 0) {
    const next = upcoming[0];
    const days = daysUntil(next.examDate!);
    const progress = topicProgress[next.id];
    const dayLabel = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
    let text = `Next exam: ${next.name} ${dayLabel}`;
    if (progress && progress.total > 0) {
      text += ` — ${progress.revised}/${progress.total} topics revised`;
    }
    segments.push({ id: `exam-${next.id}`, text });
    if (upcoming.length > 1) {
      segments.push({ id: "exam-count", text: `${upcoming.length} upcoming exam${upcoming.length !== 1 ? "s" : ""} on the calendar` });
    }
  } else if (exams.length === 0) {
    segments.push({ id: "no-exams", text: "No exams scheduled — add one under the Exams tab" });
  }

  const analyzed = pdfs
    .filter((p) => p.analyzedAt && p.summary)
    .sort((a, b) => (b.analyzedAt ?? "").localeCompare(a.analyzedAt ?? ""));

  if (analyzed.length > 0) {
    const latest = analyzed[0];
    const lecture = lectures.find((l) => l.id === latest.lectureId);
    const head = lecture ? `${lecture.title}: ` : "";
    const diff = latest.difficulty !== null ? ` (difficulty ${latest.difficulty}/7)` : "";
    segments.push({
      id: `ai-${latest.id}`,
      text: truncate(`Latest AI insight — ${head}${latest.summary}${diff}`, 100),
    });
    if (analyzed.length > 1) {
      segments.push({ id: "ai-count", text: `${analyzed.length} PDFs analyzed with AI so far` });
    }
  }

  const missingPdfCount = lectures.filter((l) => (pdfsByLecture.get(l.id) ?? []).length === 0).length;
  if (missingPdfCount > 0 && total > 1) {
    segments.push({
      id: "pdf-missing-count",
      text: `${missingPdfCount} lecture${missingPdfCount !== 1 ? "s" : ""} still need a PDF upload`,
    });
  }

  return dedupeSegments(segments);
}

function padSegments(segments: TickerSegment[], lectures: Lecture[]): TickerSegment[] {
  const out = [...segments];
  let tipIdx = 0;

  while (out.length < TICKER_MIN_SEGMENTS) {
    if (lectures.length === 0) {
      const fillers = pickRandomFillers(TICKER_MIN_SEGMENTS);
      for (const text of fillers) {
        if (out.length >= TICKER_MIN_SEGMENTS) break;
        if (!out.some((s) => s.text === text)) {
          out.push({ id: `filler-${out.length}`, text });
        }
      }
      if (out.length < TICKER_MIN_SEGMENTS) {
        out.push({ id: `filler-pad-${out.length}`, text: TICKER_TIPS[tipIdx % TICKER_TIPS.length] });
        tipIdx++;
      }
    } else {
      const tip = TICKER_TIPS[tipIdx % TICKER_TIPS.length];
      tipIdx++;
      if (!out.some((s) => s.text === tip)) {
        out.push({ id: `tip-${tipIdx}`, text: tip });
      } else {
        out.push({
          id: `pad-${out.length}`,
          text: out.length % 2 === 0
            ? "Keep uploading weekly slides to build your AI study trail"
            : "Use status filters to focus on one backlog stage at a time",
        });
      }
    }
  }

  return dedupeSegments(out).slice(0, Math.max(TICKER_MIN_SEGMENTS, segments.length));
}

export default function SemesterTicker({
  lectures, subjects, exams, topicProgress, idToken,
}: SemesterTickerProps) {
  const [pdfs, setPdfs] = useState<LecturePdf[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;
    fetch("/api/pdfs", { headers: { Authorization: `Bearer ${idToken}` } })
      .then(async (res) => (res.ok ? res.json() as Promise<LecturePdf[]> : []))
      .then((data) => { if (!cancelled) setPdfs(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [idToken, lectures.length]);

  const segments = useMemo(() => {
    const built = buildTickerSegments(lectures, subjects, pdfs, exams, topicProgress);
    if (built.length === 0 && lectures.length === 0) {
      return pickRandomFillers(TICKER_MIN_SEGMENTS).map((text, i) => ({ id: `f-${i}`, text }));
    }
    if (built.length === 0) {
      return padSegments([{ id: "caught-up", text: "You're all caught up — nothing urgent right now ✨" }], lectures);
    }
    return padSegments(built, lectures);
  }, [lectures, subjects, pdfs, exams, topicProgress]);

  const duration = tickerScrollDuration(segments.length);
  // Duplicate once for seamless loop — with MIN_SEGMENTS unique lines, repeats only after a full cycle.
  const loop = [...segments, ...segments];

  return (
    <div
      className="relative overflow-hidden border py-2.5"
      style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10" style={{
        background: "linear-gradient(to right, var(--surface), transparent)",
      }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10" style={{
        background: "linear-gradient(to left, var(--surface), transparent)",
      }} />

      <div className="ticker-viewport">
        <div
          className="ticker-track flex w-max items-center whitespace-nowrap px-4 text-sm"
          style={{
            animationDuration: `${duration}s`,
            animationPlayState: paused ? "paused" : "running",
            color: "var(--muted-fg)",
          }}
        >
          {loop.map((seg, i) => (
            <span key={`${seg.id}-${i}`} className="inline-flex shrink-0 items-center">
              {i > 0 && (
                <span className="mx-5 select-none" style={{ color: "var(--border-color)" }}>|</span>
              )}
              <span>{seg.text}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
