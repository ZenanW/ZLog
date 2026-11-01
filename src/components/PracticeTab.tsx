"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ListChecks, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Lecture, LecturePdf, PracticeQuestion, PracticeSet, Subject } from "@/lib/types";
import { practiceCountFor, PracticeGenerateMode } from "@/lib/practice";
import { btnPrimary, btnSecondary, microLabel, panel } from "@/lib/ui";
import LecturePicker from "./LecturePicker";
import PracticeSession from "./PracticeSession";
import SubjectBadge from "./SubjectBadge";

interface PracticeTabProps {
  subjects: Subject[];
  lectures: Lecture[];
  getSetForLecture: (lectureId: string) => PracticeSet | null;
  onGenerateSet: (lectureId: string, mode: PracticeGenerateMode) => Promise<PracticeSet | undefined>;
  generatingLectureId: string | null;
  generatingKind: PracticeGenerateMode | null;
  generateError: string | null;
  onDeleteSet: (id: string) => void;
  loadError: string | null;
  idToken: string | null;
  jumpLectureId?: string | null;
  jumpNonce?: number;
  readyLectureIds?: string[];
}

function formatLabel(questions: PracticeQuestion[]): string {
  const kinds = new Set(questions.map((question) => question.kind));
  if (kinds.size === 1 && kinds.has("mcq")) return "Multiple choice";
  if (kinds.size === 1 && kinds.has("short")) return "Short answer";
  return "Mixed";
}

function GenerateButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={active || !disabled ? btnPrimary : btnSecondary}>
      {active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {active ? "Generating…" : label}
    </button>
  );
}

export default function PracticeTab({
  subjects,
  lectures,
  getSetForLecture,
  onGenerateSet,
  generatingLectureId,
  generatingKind,
  generateError,
  onDeleteSet,
  loadError,
  idToken,
  jumpLectureId,
  jumpNonce = 0,
  readyLectureIds,
}: PracticeTabProps) {
  const [picking, setPicking] = useState(!jumpLectureId);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(jumpLectureId ?? null);
  const [materialCheck, setMaterialCheck] = useState<{ lectureId: string; hasMaterials: boolean } | null>(null);
  const [appliedJump, setAppliedJump] = useState(0);

  if (jumpLectureId && jumpNonce !== appliedJump) {
    setAppliedJump(jumpNonce);
    setSelectedLectureId(jumpLectureId);
    setPicking(false);
  }

  const lecture = selectedLectureId
    ? lectures.find((l) => l.id === selectedLectureId) ?? null
    : null;
  const subject = lecture ? subjects.find((s) => s.id === lecture.subjectId) : undefined;
  const practiceSet = lecture ? getSetForLecture(lecture.id) : null;
  const hasMaterials = lecture && materialCheck?.lectureId === lecture.id ? materialCheck.hasMaterials : null;
  const generating = Boolean(lecture && generatingLectureId === lecture.id);

  useEffect(() => {
    if (!lecture || !idToken) return;
    const lectureId = lecture.id;
    let cancelled = false;
    fetch(`/api/pdfs?lectureId=${encodeURIComponent(lectureId)}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to load PDFs");
        return res.json() as Promise<LecturePdf[]>;
      })
      .then((pdfs) => {
        if (!cancelled) {
          setMaterialCheck({ lectureId, hasMaterials: pdfs.length > 0 });
        }
      })
      .catch(() => {
        if (!cancelled) setMaterialCheck({ lectureId, hasMaterials: false });
      });
    return () => {
      cancelled = true;
    };
  }, [lecture, idToken]);

  const handleGenerate = (mode: PracticeGenerateMode) => {
    if (!lecture || generating) return;
    if (practiceSet && !confirm("Replace the current practice set for this lecture?")) return;
    void onGenerateSet(lecture.id, mode);
  };

  const expectedCount = generating && generatingKind
    ? practiceCountFor(generatingKind)
    : practiceSet?.questions.length ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-24 lg:flex lg:h-[calc(100dvh-8rem)] lg:min-h-0 lg:flex-col">
        <AnimatePresence mode="wait">
          {picking ? (
            <LecturePicker
              key="picker"
              subjects={subjects}
              lectures={lectures}
              readyLectureIds={readyLectureIds}
              generatingLectureId={generatingLectureId}
              onSelect={(next) => {
                setSelectedLectureId(next.id);
                setPicking(false);
              }}
              onCancel={lecture ? () => setPicking(false) : undefined}
            />
          ) : lecture ? (
            <div key="selected" className={`${panel} space-y-3`}>
              <div className="flex items-center justify-between">
                <h2 className={microLabel}>Lecture</h2>
                <button type="button" onClick={() => setPicking(true)} className={btnSecondary}>
                  Change
                </button>
              </div>
              {subject && <SubjectBadge name={subject.name} color={subject.color} size="md" />}
              <p className="font-display text-lg" style={{ color: "var(--foreground)" }}>
                {lecture.title}
              </p>
            </div>
          ) : null}
        </AnimatePresence>
      </aside>

      <section className="space-y-4">
        {loadError && (
          <div className="empty-state py-8">
            <p className="text-sm" style={{ color: "var(--alert)" }}>{loadError}</p>
          </div>
        )}

        {generateError && (
          <div className="empty-state py-6">
            <p className="text-sm" style={{ color: "var(--alert)" }}>{generateError}</p>
          </div>
        )}

        {!lecture ? (
          <div className="empty-state py-16">
            <ListChecks className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {lectures.length === 0
                ? "Add a lecture on the Lectures tab, upload weekly files, then generate a practice set here."
                : "Pick a lecture to generate or continue a practice set."}
            </p>
          </div>
        ) : hasMaterials === null ? (
          <div className="empty-state py-16">
            <div
              className="mx-auto h-8 w-8 animate-spin rounded-full border-2"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--foreground)" }}
            />
          </div>
        ) : !hasMaterials ? (
          <div className="empty-state py-16">
            <ListChecks className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              This lecture has no weekly files yet. Upload slides, a tutorial, answers, or a transcript on the Lectures tab, then generate here.
            </p>
          </div>
        ) : !practiceSet ? (
          <div className="empty-state space-y-4 py-16">
            <ListChecks className="mx-auto h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              No practice set yet. Generate 10 multiple-choice questions, or 5 short answers, from this lecture&apos;s weekly files.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <GenerateButton label="10 multiple choice" active={generating && generatingKind === "mcq"} disabled={generating} onClick={() => handleGenerate("mcq")} />
              <GenerateButton label="5 short answers" active={generating && generatingKind === "short"} disabled={generating} onClick={() => handleGenerate("short")} />
            </div>
            {generating && (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Reading the weekly files — questions will appear one by one.
              </p>
            )}
          </div>
        ) : (
          <div className={`${panel} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={microLabel}>Practice set</p>
                <p className="mt-1 text-sm" style={{ color: "var(--foreground)" }}>
                  {generating
                    ? `${practiceSet.questions.length} of ${expectedCount} written`
                    : `${formatLabel(practiceSet.questions)} · ${practiceSet.questions.length} questions · generated ${format(new Date(practiceSet.generatedAt), "MMM d, yyyy 'at' h:mm a")}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <GenerateButton label="10 multiple choice" active={generating && generatingKind === "mcq"} disabled={generating} onClick={() => handleGenerate("mcq")} />
                <GenerateButton label="5 short answers" active={generating && generatingKind === "short"} disabled={generating} onClick={() => handleGenerate("short")} />
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this practice set?")) onDeleteSet(practiceSet.id);
                  }}
                  disabled={generating}
                  className="btn btn-ghost flex items-center gap-1.5 text-xs btn-danger-ghost"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>

            {generating && (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {practiceSet.questions.length === 0
                  ? "Reading the weekly files — the first question will appear shortly."
                  : practiceSet.questions.length < expectedCount
                    ? `Writing question ${practiceSet.questions.length + 1} of ${expectedCount}…`
                    : "Saving the set…"}
              </p>
            )}

            <PracticeSession key={practiceSet.id} practiceSet={practiceSet} />
          </div>
        )}
      </section>
    </div>
  );
}
