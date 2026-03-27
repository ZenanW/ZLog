"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { BookOpen, LayoutGrid, List, Power, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppState } from "@/hooks/useAppState";
import { useTheme } from "@/hooks/useTheme";
import { Lecture, LectureStatus, Priority } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import StatsBar from "@/components/StatsBar";
import SubjectManager from "@/components/SubjectManager";
import AddLectureForm from "@/components/AddLectureForm";
import SearchFilter from "@/components/SearchFilter";
import LectureCard from "@/components/LectureCard";
import LectureDetail from "@/components/LectureDetail";
import KanbanView from "@/components/KanbanView";

type ViewMode = "list" | "kanban";

export default function AppShell() {
  const { user, idToken, loading: authLoading, signIn, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const app = useAppState(idToken);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LectureStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  const lectureCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    app.lectures.forEach((l) => {
      counts[l.subjectId] = (counts[l.subjectId] ?? 0) + 1;
    });
    return counts;
  }, [app.lectures]);

  const filtered = useMemo(() => {
    let result = app.lectures;
    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    if (priorityFilter !== "all") result = result.filter((l) => l.priority === priorityFilter);
    if (subjectFilter !== "all") result = result.filter((l) => l.subjectId === subjectFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.notes.toLowerCase().includes(q) ||
          l.tags.some((t) => t.includes(q))
      );
    }
    return result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.status === b.status) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return 0;
    });
  }, [app.lectures, statusFilter, priorityFilter, subjectFilter, search]);

  const currentSelectedLecture = selectedLecture
    ? app.lectures.find((l) => l.id === selectedLecture.id) ?? null
    : null;

  return (
    <AuthGuard user={user} loading={authLoading} onSignIn={signIn}>
      {!app.loaded ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
          <p className="text-sm text-zinc-500">Loading your backlog...</p>
        </div>
      ) : (
        <div className="min-h-screen">
          <header className="theme-header sticky top-0 z-40 border-b backdrop-blur-xl" style={{ background: "var(--header-bg)", borderColor: "var(--border-color)" }}>
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="theme-text-primary text-lg font-bold" style={{ color: "var(--fg)" }}>Backlog Track</h1>
                  <p className="text-xs" style={{ color: "var(--muted-fg)" }}>Lecture & Notes Tracker</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ border: "1px solid var(--border-color)", background: "var(--surface)" }}>
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={`rounded-md p-2 transition-all ${
                      viewMode === "kanban" ? "bg-indigo-500/15 text-indigo-500" : "hover:opacity-80"
                    }`}
                    style={{ color: viewMode === "kanban" ? undefined : "var(--muted-fg)" }}
                    title="Board view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-md p-2 transition-all ${
                      viewMode === "list" ? "bg-indigo-500/15 text-indigo-500" : "hover:opacity-80"
                    }`}
                    style={{ color: viewMode === "list" ? undefined : "var(--muted-fg)" }}
                    title="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={toggleTheme}
                  className="rounded-lg p-2 transition-colors hover:bg-indigo-500/10 hover:text-indigo-500"
                  style={{ color: "var(--muted-fg)" }}
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {user && (
                  <div className="flex items-center gap-2">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="h-7 w-7 rounded-full"
                        style={{ border: "1px solid var(--border-color)" }}
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <button
                      onClick={signOut}
                      className="rounded-lg p-2 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      style={{ color: "var(--muted-fg)" }}
                      title="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {process.env.NODE_ENV === "development" && (
                  <button
                    onClick={async () => {
                      if (confirm("Shut down the server and close?")) {
                        await fetch("/api/shutdown", { method: "POST" }).catch(() => {});
                        window.close();
                      }
                    }}
                    className="rounded-lg p-2 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    style={{ color: "var(--muted-fg)" }}
                    title="Shut down server"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <div className="mb-6">
              <StatsBar {...app.stats} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
              <aside className="space-y-4">
                <SubjectManager
                  subjects={app.subjects}
                  onAdd={app.addSubject}
                  onUpdate={app.updateSubject}
                  onDelete={app.deleteSubject}
                  lectureCountBySubject={lectureCountBySubject}
                />
                <AddLectureForm subjects={app.subjects} onAdd={app.addLecture} />
              </aside>

              <section className="space-y-4">
                <SearchFilter
                  search={search}
                  onSearchChange={setSearch}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  priorityFilter={priorityFilter}
                  onPriorityFilterChange={setPriorityFilter}
                  subjectFilter={subjectFilter}
                  onSubjectFilterChange={setSubjectFilter}
                  subjects={app.subjects}
                />

                {viewMode === "kanban" ? (
                  <KanbanView
                    lectures={filtered}
                    subjects={app.subjects}
                    getSubject={app.getSubject}
                    onSelect={setSelectedLecture}
                    onMove={app.moveLecture}
                    onDelete={app.deleteLecture}
                  />
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filtered.map((lecture) => (
                        <LectureCard
                          key={lecture.id}
                          lecture={lecture}
                          subject={app.getSubject(lecture.subjectId)}
                          onSelect={setSelectedLecture}
                          onMove={app.moveLecture}
                          onDelete={app.deleteLecture}
                        />
                      ))}
                    </AnimatePresence>
                    {filtered.length === 0 && (
                      <div className="py-16 text-center">
                        <BookOpen className="mx-auto mb-3 h-10 w-10 text-zinc-800" />
                        <p className="text-sm text-zinc-600">
                          {app.lectures.length === 0
                            ? "No lectures yet. Add a subject and your first lecture to get started."
                            : "No lectures match your filters."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </main>

          <AnimatePresence>
            {currentSelectedLecture && (
              <LectureDetail
                lecture={currentSelectedLecture}
                subject={app.getSubject(currentSelectedLecture.subjectId)}
                subjects={app.subjects}
                onUpdate={app.updateLecture}
                onMove={app.moveLecture}
                onDelete={app.deleteLecture}
                onClose={() => setSelectedLecture(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </AuthGuard>
  );
}
