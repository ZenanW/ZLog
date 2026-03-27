"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Lecture, LectureStatus, Priority, Subject } from "@/lib/types";

function mapSubjectFromDb(row: Record<string, unknown>): Subject {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    createdAt: row.created_at as string,
  };
}

function mapLectureFromDb(row: Record<string, unknown>): Lecture {
  return {
    id: row.id as string,
    subjectId: row.subject_id as string,
    title: row.title as string,
    notes: (row.notes as string) ?? "",
    status: row.status as LectureStatus,
    priority: row.priority as Priority,
    duration: row.duration as number | null,
    lectureDate: row.lecture_date as string | null,
    tags: (row.tags as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
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

export function useAppState(idToken: string | null) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;

    async function fetchAll() {
      try {
        const [subjectsData, lecturesData] = await Promise.all([
          apiFetch("/api/subjects", idToken!),
          apiFetch("/api/lectures", idToken!),
        ]);
        if (cancelled) return;
        setSubjects(subjectsData.map(mapSubjectFromDb));
        setLectures(lecturesData.map(mapLectureFromDb));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [idToken]);

  const addSubject = useCallback(
    async (name: string, color: string) => {
      if (!idToken) return;
      const id = uuidv4();
      const optimistic: Subject = { id, name, color, createdAt: new Date().toISOString() };
      setSubjects((s) => [...s, optimistic]);
      try {
        await apiFetch("/api/subjects", idToken, {
          method: "POST",
          body: JSON.stringify({ id, name, color }),
        });
      } catch {
        setSubjects((s) => s.filter((sub) => sub.id !== id));
      }
      return optimistic;
    },
    [idToken]
  );

  const updateSubject = useCallback(
    async (id: string, updates: Partial<Pick<Subject, "name" | "color">>) => {
      if (!idToken) return;
      setSubjects((s) => s.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)));
      try {
        await apiFetch(`/api/subjects/${id}`, idToken, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
      } catch {
        // Refetch on error
        const data = await apiFetch("/api/subjects", idToken);
        setSubjects(data.map(mapSubjectFromDb));
      }
    },
    [idToken]
  );

  const deleteSubject = useCallback(
    async (id: string) => {
      if (!idToken) return;
      const prev = { subjects: [...subjects], lectures: [...lectures] };
      setSubjects((s) => s.filter((sub) => sub.id !== id));
      setLectures((l) => l.filter((lec) => lec.subjectId !== id));
      try {
        await apiFetch(`/api/subjects/${id}`, idToken, { method: "DELETE" });
      } catch {
        setSubjects(prev.subjects);
        setLectures(prev.lectures);
      }
    },
    [idToken, subjects, lectures]
  );

  const addLecture = useCallback(
    async (data: {
      subjectId: string;
      title: string;
      notes?: string;
      priority?: Priority;
      duration?: number | null;
      lectureDate?: string | null;
      tags?: string[];
    }) => {
      if (!idToken) return;
      const now = new Date().toISOString();
      const id = uuidv4();
      const optimistic: Lecture = {
        id,
        subjectId: data.subjectId,
        title: data.title,
        notes: data.notes ?? "",
        status: "backlog",
        priority: data.priority ?? "medium",
        duration: data.duration ?? null,
        lectureDate: data.lectureDate ?? null,
        tags: data.tags ?? [],
        createdAt: now,
        updatedAt: now,
      };
      setLectures((l) => [...l, optimistic]);
      try {
        await apiFetch("/api/lectures", idToken, {
          method: "POST",
          body: JSON.stringify({ id, ...data }),
        });
      } catch {
        setLectures((l) => l.filter((lec) => lec.id !== id));
      }
      return optimistic;
    },
    [idToken]
  );

  const updateLecture = useCallback(
    async (id: string, updates: Partial<Omit<Lecture, "id" | "createdAt">>) => {
      if (!idToken) return;
      setLectures((l) =>
        l.map((lec) =>
          lec.id === id ? { ...lec, ...updates, updatedAt: new Date().toISOString() } : lec
        )
      );
      try {
        await apiFetch(`/api/lectures/${id}`, idToken, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
      } catch {
        const data = await apiFetch("/api/lectures", idToken);
        setLectures(data.map(mapLectureFromDb));
      }
    },
    [idToken]
  );

  const deleteLecture = useCallback(
    async (id: string) => {
      if (!idToken) return;
      const prev = [...lectures];
      setLectures((l) => l.filter((lec) => lec.id !== id));
      try {
        await apiFetch(`/api/lectures/${id}`, idToken, { method: "DELETE" });
      } catch {
        setLectures(prev);
      }
    },
    [idToken, lectures]
  );

  const moveLecture = useCallback(
    async (id: string, status: LectureStatus) => {
      if (!idToken) return;
      setLectures((l) =>
        l.map((lec) =>
          lec.id === id ? { ...lec, status, updatedAt: new Date().toISOString() } : lec
        )
      );
      try {
        await apiFetch(`/api/lectures/${id}`, idToken, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
      } catch {
        const data = await apiFetch("/api/lectures", idToken);
        setLectures(data.map(mapLectureFromDb));
      }
    },
    [idToken]
  );

  const getSubject = useCallback(
    (id: string) => subjects.find((s) => s.id === id),
    [subjects]
  );

  const stats = {
    total: lectures.length,
    backlog: lectures.filter((l) => l.status === "backlog").length,
    inProgress: lectures.filter((l) => l.status === "in_progress").length,
    completed: lectures.filter((l) => l.status === "completed").length,
  };

  return {
    subjects,
    lectures,
    loaded,
    stats,
    addSubject,
    updateSubject,
    deleteSubject,
    addLecture,
    updateLecture,
    deleteLecture,
    moveLecture,
    getSubject,
  };
}
