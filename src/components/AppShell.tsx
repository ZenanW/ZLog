"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { BookOpen, Power, LogOut, Sun, Moon, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppState } from "@/hooks/useAppState";
import { useExamState } from "@/hooks/useExamState";
import { useTheme } from "@/hooks/useTheme";
import { Exam, Lecture, LectureStatus, Priority } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import SemesterTicker from "@/components/SemesterTicker";
import ExamStatsBar from "@/components/ExamStatsBar";
import SubjectManager from "@/components/SubjectManager";
import AddLectureForm from "@/components/AddLectureForm";
import ResetSemester from "@/components/ResetSemester";
import SearchFilter from "@/components/SearchFilter";
import LectureDetail from "@/components/LectureDetail";
import ExpandedLectureCard from "@/components/ExpandedLectureCard";
import KanbanView from "@/components/KanbanView";
import ExamList from "@/components/ExamList";
import ExamCard from "@/components/ExamCard";
import ExamDetail from "@/components/ExamDetail";

type AppTab = "lectures" | "exams";

export default function AppShell() {
  const { user, idToken, loading: authLoading, signIn, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const app = useAppState(idToken);
  const examState = useExamState(idToken);
  const [appTab, setAppTab] = useState<AppTab>("lectures");
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LectureStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState<string | "all">("all");
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
      result = result.filter((l) => l.title.toLowerCase().includes(q));
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

  const currentSelectedExam = selectedExam
    ? examState.exams.find((e) => e.id === selectedExam.id) ?? null
    : null;

  const topicProgress = useMemo(() => {
    const result: Record<string, { revised: number; total: number }> = {};
    for (const exam of examState.exams) {
      const t = examState.getTopicsForExam(exam.id);
      result[exam.id] = { revised: t.filter((tp) => tp.revised).length, total: t.length };
    }
    return result;
  }, [examState]);

  return (
    <AuthGuard user={user} loading={authLoading} onSignIn={signIn}>
      {!app.loaded || !examState.loaded ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <BookOpen className="h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--foreground)" }}
          />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading your backlog...</p>
        </div>
      ) : (
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b" style={{ background: "var(--header-bg)", borderColor: "color-mix(in oklch, var(--border) 60%, transparent)" }}>
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 shrink-0" style={{ color: "var(--foreground)" }} />
                <div>
                  <h1 className="font-display text-xl leading-none" style={{ color: "var(--foreground)" }}>Backlog Track</h1>
                  <p className="micro-label mt-0.5 normal-case tracking-normal">Lecture & Notes Tracker</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="segment-track flex items-center gap-0.5 p-0.5">
                  <button
                    onClick={() => setAppTab("lectures")}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all ${
                      appTab === "lectures" ? "chip-selected" : "chip"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Lectures
                  </button>
                  <button
                    onClick={() => setAppTab("exams")}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all ${
                      appTab === "exams" ? "chip-selected" : "chip"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Exams
                  </button>
                </div>

                <ResetSemester
                  onReset={async () => {
                    const ok = await app.clearBacklog();
                    if (ok) {
                      examState.clearLocal();
                      setSelectedLecture(null);
                      setSelectedExam(null);
                    }
                    return ok;
                  }}
                />

                <button
                  onClick={toggleTheme}
                  className="btn-icon"
                  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {user && (
                  <div className="flex items-center gap-2">
                    {user.photoURL && (
                      /* Tiny external avatar; next/image optimization isn't worth the remote-domain config */
                      // eslint-disable-next-line @next/next/no-img-element
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
                      className="btn-icon btn-danger-ghost"
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
                    className="btn-icon btn-danger-ghost"
                    title="Shut down server"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            {appTab === "lectures" ? (
              <>
                <div className="mb-6">
                  <SemesterTicker
                    lectures={app.lectures}
                    subjects={app.subjects}
                    exams={examState.exams}
                    topicProgress={topicProgress}
                    idToken={idToken}
                  />
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
                    <AddLectureForm subjects={app.subjects} lectures={app.lectures} onAdd={app.addLecture} />
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

                    {statusFilter !== "all" ? (
                      // Single-status view: one full-width scrollable column of
                      // expanded, inline-editable cards replacing the board.
                      <div className="space-y-4">
                        <AnimatePresence>
                          {filtered.map((lecture) => (
                            <ExpandedLectureCard
                              key={lecture.id}
                              lecture={lecture}
                              subject={app.getSubject(lecture.subjectId)}
                              subjects={app.subjects}
                              idToken={idToken}
                              onUpdate={app.updateLecture}
                              onMove={app.moveLecture}
                              onDelete={app.deleteLecture}
                            />
                          ))}
                        </AnimatePresence>
                        {filtered.length === 0 && (
                          <div className="empty-state py-16">
                            <BookOpen className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No lectures in this section.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <KanbanView
                        lectures={filtered}
                        subjects={app.subjects}
                        getSubject={app.getSubject}
                        onSelect={setSelectedLecture}
                        onMove={app.moveLecture}
                        onDelete={app.deleteLecture}
                      />
                    )}
                  </section>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <ExamStatsBar {...examState.examStats} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                  <aside>
                    <ExamList
                      exams={examState.exams}
                      selectedExamId={selectedExam?.id ?? null}
                      onSelect={setSelectedExam}
                      onAdd={examState.addExam}
                      onDelete={examState.deleteExam}
                      topicProgress={topicProgress}
                    />
                  </aside>

                  <section>
                    {examState.exams.length === 0 ? (
                      <div className="empty-state py-16">
                        <GraduationCap className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                          No exams yet. Add one from the sidebar to start tracking.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <AnimatePresence>
                          {examState.exams.map((exam) => (
                            <ExamCard
                              key={exam.id}
                              exam={exam}
                              topics={examState.getTopicsForExam(exam.id)}
                              practiceTests={examState.getTestsForExam(exam.id)}
                              onSelect={setSelectedExam}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </main>

          <AnimatePresence>
            {currentSelectedLecture && appTab === "lectures" && (
              <LectureDetail
                lecture={currentSelectedLecture}
                subject={app.getSubject(currentSelectedLecture.subjectId)}
                subjects={app.subjects}
                idToken={idToken}
                onUpdate={app.updateLecture}
                onMove={app.moveLecture}
                onDelete={app.deleteLecture}
                onClose={() => setSelectedLecture(null)}
              />
            )}
            {currentSelectedExam && appTab === "exams" && (
              <ExamDetail
                exam={currentSelectedExam}
                topics={examState.getTopicsForExam(currentSelectedExam.id)}
                practiceTests={examState.getTestsForExam(currentSelectedExam.id)}
                onUpdateExam={examState.updateExam}
                onDeleteExam={examState.deleteExam}
                onAddTopic={examState.addTopic}
                onToggleTopic={examState.toggleTopic}
                onDeleteTopic={examState.deleteTopic}
                onAddPracticeTest={examState.addPracticeTest}
                onDeletePracticeTest={examState.deletePracticeTest}
                onClose={() => setSelectedExam(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </AuthGuard>
  );
}
