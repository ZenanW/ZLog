"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Exam, ExamTopic, PracticeTest } from "@/lib/types";

function mapExamFromDb(row: Record<string, unknown>): Exam {
  return {
    id: row.id as string,
    name: row.name as string,
    examDate: (row.exam_date as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTopicFromDb(row: Record<string, unknown>): ExamTopic {
  return {
    id: row.id as string,
    examId: row.exam_id as string,
    name: row.name as string,
    revised: row.revised as boolean,
    createdAt: row.created_at as string,
  };
}

function mapPracticeTestFromDb(row: Record<string, unknown>): PracticeTest {
  return {
    id: row.id as string,
    examId: row.exam_id as string,
    title: row.title as string,
    score: row.score as number | null,
    maxScore: row.max_score as number | null,
    notes: (row.notes as string) ?? "",
    takenAt: row.taken_at as string,
    createdAt: row.created_at as string,
  };
}

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

export function useExamState(idToken: string | null) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [topics, setTopics] = useState<ExamTopic[]>([]);
  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;

    async function fetchAll() {
      try {
        const examsData = await apiFetch("/api/exams", idToken!);
        if (cancelled) return;
        const mapped: Exam[] = examsData.map(mapExamFromDb);
        setExams(mapped);

        if (mapped.length > 0) {
          const [allTopics, allTests] = await Promise.all([
            Promise.all(mapped.map((e: Exam) => apiFetch(`/api/exams/${e.id}/topics`, idToken!))),
            Promise.all(mapped.map((e: Exam) => apiFetch(`/api/exams/${e.id}/practice-tests`, idToken!))),
          ]);
          if (cancelled) return;
          setTopics(allTopics.flat().map(mapTopicFromDb));
          setPracticeTests(allTests.flat().map(mapPracticeTestFromDb));
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [idToken]);

  // --- Exams ---

  const addExam = useCallback(
    async (name: string, examDate: string | null) => {
      if (!idToken) return;
      const id = uuidv4();
      const now = new Date().toISOString();
      const optimistic: Exam = { id, name, examDate, createdAt: now, updatedAt: now };
      setExams((e) => [...e, optimistic]);
      try {
        await apiFetch("/api/exams", idToken, {
          method: "POST",
          body: JSON.stringify({ id, name, examDate }),
        });
      } catch {
        setExams((e) => e.filter((ex) => ex.id !== id));
      }
      return optimistic;
    },
    [idToken]
  );

  const updateExam = useCallback(
    async (id: string, updates: Partial<Pick<Exam, "name" | "examDate">>) => {
      if (!idToken) return;
      setExams((e) =>
        e.map((ex) => (ex.id === id ? { ...ex, ...updates, updatedAt: new Date().toISOString() } : ex))
      );
      try {
        await apiFetch(`/api/exams/${id}`, idToken, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
      } catch {
        const data = await apiFetch("/api/exams", idToken);
        setExams(data.map(mapExamFromDb));
      }
    },
    [idToken]
  );

  const deleteExam = useCallback(
    async (id: string) => {
      if (!idToken) return;
      const prevExams = [...exams];
      const prevTopics = [...topics];
      const prevTests = [...practiceTests];
      setExams((e) => e.filter((ex) => ex.id !== id));
      setTopics((t) => t.filter((tp) => tp.examId !== id));
      setPracticeTests((p) => p.filter((pt) => pt.examId !== id));
      try {
        await apiFetch(`/api/exams/${id}`, idToken, { method: "DELETE" });
      } catch {
        setExams(prevExams);
        setTopics(prevTopics);
        setPracticeTests(prevTests);
      }
    },
    [idToken, exams, topics, practiceTests]
  );

  // --- Topics ---

  const addTopic = useCallback(
    async (examId: string, name: string) => {
      if (!idToken) return;
      const id = uuidv4();
      const optimistic: ExamTopic = { id, examId, name, revised: false, createdAt: new Date().toISOString() };
      setTopics((t) => [...t, optimistic]);
      try {
        await apiFetch(`/api/exams/${examId}/topics`, idToken, {
          method: "POST",
          body: JSON.stringify({ id, name }),
        });
      } catch {
        setTopics((t) => t.filter((tp) => tp.id !== id));
      }
      return optimistic;
    },
    [idToken]
  );

  const toggleTopic = useCallback(
    async (examId: string, topicId: string) => {
      if (!idToken) return;
      const topic = topics.find((t) => t.id === topicId);
      if (!topic) return;
      const newRevised = !topic.revised;
      setTopics((t) => t.map((tp) => (tp.id === topicId ? { ...tp, revised: newRevised } : tp)));
      try {
        await apiFetch(`/api/exams/${examId}/topics/${topicId}`, idToken, {
          method: "PATCH",
          body: JSON.stringify({ revised: newRevised }),
        });
      } catch {
        setTopics((t) => t.map((tp) => (tp.id === topicId ? { ...tp, revised: !newRevised } : tp)));
      }
    },
    [idToken, topics]
  );

  const deleteTopic = useCallback(
    async (examId: string, topicId: string) => {
      if (!idToken) return;
      const prev = [...topics];
      setTopics((t) => t.filter((tp) => tp.id !== topicId));
      try {
        await apiFetch(`/api/exams/${examId}/topics/${topicId}`, idToken, { method: "DELETE" });
      } catch {
        setTopics(prev);
      }
    },
    [idToken, topics]
  );

  // --- Practice Tests ---

  const addPracticeTest = useCallback(
    async (examId: string, data: { title: string; score?: number | null; maxScore?: number | null; notes?: string; takenAt?: string }) => {
      if (!idToken) return;
      const id = uuidv4();
      const now = new Date().toISOString();
      const optimistic: PracticeTest = {
        id,
        examId,
        title: data.title,
        score: data.score ?? null,
        maxScore: data.maxScore ?? null,
        notes: data.notes ?? "",
        takenAt: data.takenAt ?? now,
        createdAt: now,
      };
      setPracticeTests((p) => [optimistic, ...p]);
      try {
        await apiFetch(`/api/exams/${examId}/practice-tests`, idToken, {
          method: "POST",
          body: JSON.stringify({ id, ...data }),
        });
      } catch {
        setPracticeTests((p) => p.filter((pt) => pt.id !== id));
      }
      return optimistic;
    },
    [idToken]
  );

  const updatePracticeTest = useCallback(
    async (examId: string, testId: string, updates: Partial<Pick<PracticeTest, "title" | "score" | "maxScore" | "notes" | "takenAt">>) => {
      if (!idToken) return;
      setPracticeTests((p) => p.map((pt) => (pt.id === testId ? { ...pt, ...updates } : pt)));
      try {
        await apiFetch(`/api/exams/${examId}/practice-tests/${testId}`, idToken, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
      } catch {
        const data = await apiFetch(`/api/exams/${examId}/practice-tests`, idToken);
        setPracticeTests((prev) => {
          const others = prev.filter((pt) => pt.examId !== examId);
          return [...others, ...data.map(mapPracticeTestFromDb)];
        });
      }
    },
    [idToken]
  );

  const deletePracticeTest = useCallback(
    async (examId: string, testId: string) => {
      if (!idToken) return;
      const prev = [...practiceTests];
      setPracticeTests((p) => p.filter((pt) => pt.id !== testId));
      try {
        await apiFetch(`/api/exams/${examId}/practice-tests/${testId}`, idToken, { method: "DELETE" });
      } catch {
        setPracticeTests(prev);
      }
    },
    [idToken, practiceTests]
  );

  // --- Helpers ---

  const getTopicsForExam = useCallback(
    (examId: string) => topics.filter((t) => t.examId === examId),
    [topics]
  );

  const getTestsForExam = useCallback(
    (examId: string) => practiceTests.filter((p) => p.examId === examId),
    [practiceTests]
  );

  const examStats = {
    total: exams.length,
    upcoming: exams.filter((e) => {
      if (!e.examDate) return false;
      const diff = new Date(e.examDate).getTime() - Date.now();
      return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }).length,
    topicsRevised: topics.length > 0
      ? Math.round((topics.filter((t) => t.revised).length / topics.length) * 100)
      : 0,
    avgScore: (() => {
      const scored = practiceTests.filter((p) => p.score != null && p.maxScore != null && p.maxScore > 0);
      if (scored.length === 0) return 0;
      const avg = scored.reduce((sum, p) => sum + ((p.score! / p.maxScore!) * 100), 0) / scored.length;
      return Math.round(avg);
    })(),
  };

  return {
    exams,
    topics,
    practiceTests,
    loaded,
    examStats,
    addExam,
    updateExam,
    deleteExam,
    addTopic,
    toggleTopic,
    deleteTopic,
    addPracticeTest,
    updatePracticeTest,
    deletePracticeTest,
    getTopicsForExam,
    getTestsForExam,
  };
}
