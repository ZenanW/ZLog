"use client";

import { useCallback, useEffect, useState } from "react";
import { PracticeQuestion, PracticeSet } from "@/lib/types";
import { missingPracticeTablesMessage } from "@/lib/practice";

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  return res.json();
}

export function usePracticeState(idToken: string | null) {
  const [sets, setSets] = useState<PracticeSet[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generatingLectureId, setGeneratingLectureId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;

    async function fetchAll() {
      try {
        const data = await apiFetch("/api/practice", idToken!);
        if (cancelled) return;
        setSets(data as PracticeSet[]);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load practice sets";
        setLoadError(missingPracticeTablesMessage(message) ?? message);
        setSets([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [idToken]);

  const getSetForLecture = useCallback(
    (lectureId: string) => sets.find((s) => s.lectureId === lectureId) ?? null,
    [sets]
  );

  const generateSet = useCallback(
    async (lectureId: string) => {
      if (!idToken) return;
      const previous = sets.find((s) => s.lectureId === lectureId) ?? null;
      setGeneratingLectureId(lectureId);
      setGenerateError(null);
      try {
        const res = await fetch("/api/practice/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ lectureId }),
        });
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("text/event-stream")) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `API error ${res.status}`);
        }
        if (!res.body) throw new Error("No generate stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let finished: PracticeSet | undefined;

        const applyEvent = (event: Record<string, unknown>) => {
          if (event.type === "error") {
            throw new Error(typeof event.error === "string" ? event.error : "Failed to generate practice set");
          }
          if (event.type === "start" && event.set && typeof event.set === "object") {
            const incoming = event.set as PracticeSet;
            setSets((current) => [incoming, ...current.filter((s) => s.lectureId !== lectureId)]);
            return;
          }
          if (event.type === "question" && event.question && typeof event.question === "object") {
            const question = event.question as PracticeQuestion;
            setSets((current) =>
              current.map((s) =>
                s.lectureId === lectureId
                  ? { ...s, questions: [...s.questions.filter((q) => q.id !== question.id), question] }
                  : s
              )
            );
            return;
          }
          if (event.type === "done" && event.set && typeof event.set === "object") {
            finished = event.set as PracticeSet;
            setSets((current) => [finished!, ...current.filter((s) => s.lectureId !== lectureId)]);
          }
        };

        const flush = (chunk: string) => {
          buf += chunk;
          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            for (const line of part.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              applyEvent(JSON.parse(line.slice(6)) as Record<string, unknown>);
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          flush(decoder.decode(value, { stream: true }));
        }
        flush(decoder.decode());
        return finished;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate practice set";
        setGenerateError(missingPracticeTablesMessage(message) ?? message);
        setSets((current) => {
          const without = current.filter((s) => s.lectureId !== lectureId);
          return previous ? [previous, ...without] : without;
        });
      } finally {
        setGeneratingLectureId(null);
      }
    },
    [idToken, sets]
  );

  const deleteSet = useCallback(
    async (id: string) => {
      if (!idToken) return;
      const prev = [...sets];
      setSets((current) => current.filter((s) => s.id !== id));
      try {
        await apiFetch(`/api/practice/${id}`, idToken, { method: "DELETE" });
      } catch {
        setSets(prev);
      }
    },
    [idToken, sets]
  );

  const clearLocal = useCallback(() => {
    setSets([]);
  }, []);

  return {
    sets,
    loaded,
    loadError,
    getSetForLecture,
    generateSet,
    generatingLectureId,
    generateError,
    deleteSet,
    clearLocal,
  };
}
