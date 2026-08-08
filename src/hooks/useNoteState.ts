"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Note, NoteFormat } from "@/lib/types";

function mapNoteFromDb(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    lectureId: (row.lecture_id as string) ?? null,
    title: (row.title as string) ?? "",
    format: ((row.format as string) === "legal" ? "plain" : row.format) as NoteFormat,
    content: (row.content as Record<string, unknown>) ?? {},
    evaluation: (row.evaluation as Note["evaluation"]) ?? null,
    evaluatedAt: (row.evaluated_at as string) ?? null,
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

export function useNoteState(idToken: string | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;

    async function fetchAll() {
      try {
        const data = await apiFetch("/api/notes", idToken!);
        if (cancelled) return;
        setNotes(data.map(mapNoteFromDb));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [idToken]);

  const addNote = useCallback(
    async (data: {
      title: string;
      lectureId?: string | null;
      format?: NoteFormat;
      content?: Record<string, unknown>;
    }) => {
      if (!idToken) return;
      const now = new Date().toISOString();
      const id = uuidv4();
      const optimistic: Note = {
        id,
        lectureId: data.lectureId ?? null,
        title: data.title,
        format: data.format ?? "plain",
        content: data.content ?? {},
        evaluation: null,
        evaluatedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((n) => [optimistic, ...n]);
      try {
        await apiFetch("/api/notes", idToken, {
          method: "POST",
          body: JSON.stringify({ id, ...data }),
        });
      } catch {
        setNotes((n) => n.filter((note) => note.id !== id));
      }
      return optimistic;
    },
    [idToken]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>) => {
      if (!idToken) return;
      setNotes((n) =>
        n.map((note) =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note
        )
      );
      try {
        await apiFetch(`/api/notes/${id}`, idToken, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
      } catch {
        const data = await apiFetch("/api/notes", idToken);
        setNotes(data.map(mapNoteFromDb));
      }
    },
    [idToken]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!idToken) return;
      const prev = [...notes];
      setNotes((n) => n.filter((note) => note.id !== id));
      try {
        await apiFetch(`/api/notes/${id}`, idToken, { method: "DELETE" });
      } catch {
        setNotes(prev);
      }
    },
    [idToken, notes]
  );

  const getNotesForLecture = useCallback(
    (lectureId: string) => notes.filter((n) => n.lectureId === lectureId),
    [notes]
  );

  return {
    notes,
    loaded,
    addNote,
    updateNote,
    deleteNote,
    getNotesForLecture,
  };
}
