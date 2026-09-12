"use client";

import { useState, type KeyboardEvent } from "react";
import { Check, Eye, RotateCcw, X } from "lucide-react";
import { PracticeQuestion, PracticeSet } from "@/lib/types";
import { btnGhost, btnPrimary, btnSecondary, input, microLabel } from "@/lib/ui";

interface PracticeSessionProps {
  practiceSet: PracticeSet;
}

interface AnswerState {
  choiceId: string | null;
  shortText: string;
  revealed: boolean;
}

const emptyAnswer: AnswerState = { choiceId: null, shortText: "", revealed: false };

function choiceClass(question: PracticeQuestion, choiceId: string, selectedId: string | null, revealed: boolean) {
  const selected = selectedId === choiceId;
  const correct = question.correctChoiceId === choiceId;
  if (revealed && correct) return "chip chip-active w-full px-3 py-2.5 text-left text-sm";
  if (revealed && selected && !correct) return "chip chip-alert w-full px-3 py-2.5 text-left text-sm";
  if (selected) return "chip chip-selected w-full px-3 py-2.5 text-left text-sm";
  return "chip w-full px-3 py-2.5 text-left text-sm";
}

function QuestionCard({
  question,
  index,
  answer,
  onChange,
  onReveal,
}: {
  question: PracticeQuestion;
  index: number;
  answer: AnswerState;
  onChange: (patch: Partial<AnswerState>) => void;
  onReveal: () => void;
}) {
  const canReveal =
    !answer.revealed &&
    (question.kind === "mcq" ? Boolean(answer.choiceId) : Boolean(answer.shortText.trim()));
  const mcqCorrect = question.kind === "mcq" && answer.revealed && answer.choiceId === question.correctChoiceId;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (answer.revealed) return;
    if (e.target instanceof HTMLTextAreaElement) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canReveal) {
        e.preventDefault();
        onReveal();
      }
      return;
    }
    if (question.kind === "mcq" && question.choices) {
      const letter = e.key.toLowerCase();
      const byLetter = question.choices.find((c) => c.id.toLowerCase() === letter);
      const byIndex = /^[1-4]$/.test(e.key) ? question.choices[Number(e.key) - 1] : undefined;
      const choice = byLetter ?? byIndex;
      if (choice) {
        e.preventDefault();
        onChange({ choiceId: choice.id });
        return;
      }
    }
    if (e.key === "Enter" && canReveal) {
      e.preventDefault();
      onReveal();
    }
  };

  return (
    <li
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="space-y-3 border-t pt-4 first:border-t-0 first:pt-0 outline-none focus-visible:border-[var(--ring)]"
      style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip px-2 py-0.5 text-[10px] font-medium">
          {index + 1}. {question.kind === "mcq" ? "Multiple choice" : "Short answer"}
        </span>
        {answer.revealed && question.kind === "mcq" && (
          <span className={`badge ${mcqCorrect ? "badge-active" : "badge-alert"}`}>
            {mcqCorrect ? "Correct" : "Incorrect"}
          </span>
        )}
        {answer.revealed && question.kind === "short" && (
          <span className="badge badge-quiet">Self-check</span>
        )}
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        {question.prompt}
      </p>

      {question.kind === "mcq" && question.choices && (
        <div className="grid gap-2">
          {question.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              disabled={answer.revealed}
              onClick={() => onChange({ choiceId: choice.id })}
              className={choiceClass(question, choice.id, answer.choiceId, answer.revealed)}
            >
              <span className="mr-2 font-medium uppercase" style={{ color: "var(--muted-foreground)" }}>
                {choice.id}
              </span>
              {choice.text}
            </button>
          ))}
        </div>
      )}

      {question.kind === "short" && (
        <textarea
          value={answer.shortText}
          onChange={(e) => onChange({ shortText: e.target.value })}
          disabled={answer.revealed}
          rows={3}
          placeholder="Type your answer…"
          className={`${input} resize-y`}
        />
      )}

      {!answer.revealed ? (
        <button type="button" onClick={onReveal} disabled={!canReveal} className={btnPrimary}>
          <Eye className="h-3.5 w-3.5" />
          Reveal
        </button>
      ) : (
        <div className="paper-panel space-y-3 p-4">
          {question.kind === "mcq" && (
            <p className="flex items-center gap-1.5 text-sm" style={{ color: mcqCorrect ? "var(--active)" : "var(--alert)" }}>
              {mcqCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {mcqCorrect ? "That matches the slides." : "Not the answer from the slides."}
            </p>
          )}
          {question.kind === "short" && question.modelAnswer && (
            <div>
              <p className={microLabel}>Model answer</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                {question.modelAnswer}
              </p>
            </div>
          )}
          <div>
            <p className={microLabel}>Explanation</p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              {question.explanation}
            </p>
          </div>
          {question.slideReference && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Slide cue: {question.slideReference}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default function PracticeSession({ practiceSet }: PracticeSessionProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});

  const revealedCount = practiceSet.questions.filter((q) => answers[q.id]?.revealed).length;
  const mcqScored = practiceSet.questions.filter(
    (q) => q.kind === "mcq" && answers[q.id]?.revealed
  );
  const mcqCorrect = mcqScored.filter((q) => answers[q.id]?.choiceId === q.correctChoiceId).length;

  const patchAnswer = (id: string, patch: Partial<AnswerState>) => {
    setAnswers((current) => ({
      ...current,
      [id]: { ...(current[id] ?? emptyAnswer), ...patch },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Revealed {revealedCount} / {practiceSet.questions.length}
          {mcqScored.length > 0 && ` · MCQ ${mcqCorrect}/${mcqScored.length} correct`}
          <span className="ml-2 hidden sm:inline">
            A–D or 1–4 to select · Enter to reveal · ⌘Enter on short answers
          </span>
        </p>
        {revealedCount > 0 && (
          <button type="button" onClick={() => setAnswers({})} className={btnGhost}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset answers
          </button>
        )}
      </div>

      <ol className="space-y-1">
        {practiceSet.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            answer={answers[question.id] ?? emptyAnswer}
            onChange={(patch) => patchAnswer(question.id, patch)}
            onReveal={() => patchAnswer(question.id, { revealed: true })}
          />
        ))}
      </ol>

      {revealedCount === practiceSet.questions.length && practiceSet.questions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}>
          <p className="text-sm" style={{ color: "var(--foreground)" }}>
            Set complete
            {mcqScored.length > 0 && ` · ${mcqCorrect} of ${mcqScored.length} multiple-choice correct`}.
            Short answers are self-checked against the model.
          </p>
          <button type="button" onClick={() => setAnswers({})} className={btnSecondary}>
            <RotateCcw className="h-3.5 w-3.5" />
            Practice again
          </button>
        </div>
      )}
    </div>
  );
}
