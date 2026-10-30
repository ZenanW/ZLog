"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { BookOpen, Power, LogOut, Sun, Moon, GraduationCap, ListChecks } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppState } from "@/hooks/useAppState";
import { useExamState } from "@/hooks/useExamState";
import { usePracticeState } from "@/hooks/usePracticeState";
import { useTheme } from "@/hooks/useTheme";
import { Assignment, Exam, Lecture, LectureStatus, Priority } from "@/lib/types";
import { compareLecturesByUnitAndWeek, filterBacklogTrackedLectures } from "@/lib/lectures";
import { buildTodayItems, TodayItem } from "@/lib/today";
import AuthGuard from "@/components/AuthGuard";
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
import AssignmentCard from "@/components/AssignmentCard";
import AssignmentDetail from "@/components/AssignmentDetail";
import PracticeTab from "@/components/PracticeTab";
import TodayList from "@/components/TodayList";

type AppTab = "lectures" | "exams" | "practice";

export default function AppShell() {
  const { user, idToken, loading: authLoading, signIn, signOut } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const app = useAppState(idToken);
  const examState = useExamState(idToken);
  const practiceState = usePracticeState(idToken);
  const [appTab, setAppTab] = useState<AppTab>("lectures");
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LectureStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState<string | "all">("all");
  const [practiceJump, setPracticeJump] = useState<{ lectureId: string; nonce: number } | null>(null);

  const openPractice = (lecture: Lecture) => {
    setPracticeJump((prev) => ({ lectureId: lecture.id, nonce: (prev?.nonce ?? 0) + 1 }));
    setAppTab("practice");
    setSelectedLecture(null);
  };

  const practiceLectureIds = useMemo(
    () => practiceState.sets.map((s) => s.lectureId),
    [practiceState.sets]
  );

  const backlogLectures = useMemo(
    () => filterBacklogTrackedLectures(app.lectures),
    [app.lectures]
  );

  const lectureCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    backlogLectures.forEach((l) => {
      counts[l.subjectId] = (counts[l.subjectId] ?? 0) + 1;
    });
    return counts;
  }, [backlogLectures]);

  const filtered = useMemo(() => {
    let result = backlogLectures;
    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    if (priorityFilter !== "all") result = result.filter((l) => l.priority === priorityFilter);
    if (subjectFilter !== "all") result = result.filter((l) => l.subjectId === subjectFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.title.toLowerCase().includes(q));
    }
    return result.sort((a, b) => compareLecturesByUnitAndWeek(a, b, app.subjects));
  }, [backlogLectures, statusFilter, priorityFilter, subjectFilter, search, app.subjects]);

  const currentSelectedLecture = selectedLecture
    ? backlogLectures.find((l) => l.id === selectedLecture.id) ?? null
    : null;

  const currentSelectedExam = selectedExam
    ? examState.exams.find((e) => e.id === selectedExam.id) ?? null
    : null;

  const currentSelectedAssignment = selectedAssignment
    ? examState.assignments.find((a) => a.id === selectedAssignment.id) ?? null
    : null;

  const openExam = (exam: Exam) => {
    setSelectedExam(exam);
    setSelectedAssignment(null);
  };

  const openAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSelectedExam(null);
  };

  const todayItems = useMemo(
    () => buildTodayItems({
      assignments: examState.assignments,
      exams: examState.exams,
      lectures: backlogLectures,
      subjects: app.subjects,
    }),
    [examState.assignments, examState.exams, backlogLectures, app.subjects]
  );

  const openTodayItem = (item: TodayItem) => {
    if (item.kind === "assignment") {
      const assignment = examState.assignments.find((entry) => entry.id === item.id);
      if (assignment) openAssignment(assignment);
      return;
    }
    if (item.kind === "exam") {
      const exam = examState.exams.find((entry) => entry.id === item.id);
      if (exam) openExam(exam);
      return;
    }
    const lecture = backlogLectures.find((entry) => entry.id === item.id);
    if (!lecture) return;
    setSelectedLecture(lecture);
    setSelectedExam(null);
    setSelectedAssignment(null);
    setAppTab("lectures");
  };

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
      {!app.loaded || !examState.loaded || !practiceState.loaded ? (
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
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <BookOpen className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" style={{ color: "var(--foreground)" }} />
                <div className="min-w-0">
                  <h1 className="font-display text-lg leading-none sm:text-xl" style={{ color: "var(--foreground)" }}>Backlog Track</h1>
                  <p className="micro-label mt-0.5 hidden normal-case tracking-normal sm:block">Lecture & Exam Tracker</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <div className="segment-track flex items-center gap-0.5 p-0.5">
                  <button
                    onClick={() => setAppTab("lectures")}
                    className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-all sm:px-2.5 ${
                      appTab === "lectures" ? "chip-selected" : "chip"
                    }`}
                    title="Lectures"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Lectures</span>
                  </button>
                  <button
                    onClick={() => setAppTab("exams")}
                    className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-all sm:px-2.5 ${
                      appTab === "exams" ? "chip-selected" : "chip"
                    }`}
                    title="Exams/Assignments"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Exams/Assignments</span>
                  </button>
                  <button
                    onClick={() => setAppTab("practice")}
                    className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-all sm:px-2.5 ${
                      appTab === "practice" ? "chip-selected" : "chip"
                    }`}
                    title="Practice"
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Practice</span>
                  </button>
                </div>

                <ResetSemester
                  onReset={async () => {
                    const ok = await app.clearBacklog();
                    if (ok) {
                      examState.clearLocal();
                      practiceState.clearLocal();
                      setSelectedLecture(null);
                      setSelectedExam(null);
                      setSelectedAssignment(null);
                      setPracticeJump(null);
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
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                  <aside className="space-y-4">
                    <SubjectManager
                      subjects={app.subjects}
                      onAdd={app.addSubject}
                      onUpdate={app.updateSubject}
                      onDelete={app.deleteSubject}
                      lectureCountBySubject={lectureCountBySubject}
                    />
                    <AddLectureForm subjects={app.subjects} lectures={backlogLectures} onAdd={app.addLecture} />
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
                              onPractice={() => openPractice(lecture)}
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
                        onPractice={openPractice}
                        onMove={app.moveLecture}
                        onDelete={app.deleteLecture}
                      />
                    )}
                  </section>
                </div>
              </>
            ) : appTab === "exams" ? (
              <>
                <div className="mb-6">
                  <ExamStatsBar {...examState.examStats} />
                </div>

                <TodayList items={todayItems} onOpen={openTodayItem} />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                  <aside>
                    <ExamList
                      exams={examState.exams}
                      assignments={examState.assignments}
                      subjects={app.subjects}
                      selectedExamId={selectedExam?.id ?? null}
                      selectedAssignmentId={selectedAssignment?.id ?? null}
                      onSelectExam={openExam}
                      onSelectAssignment={openAssignment}
                      onAddExam={examState.addExam}
                      onAddAssignment={examState.addAssignment}
                      onDeleteExam={(id) => {
                        examState.deleteExam(id);
                        if (selectedExam?.id === id) setSelectedExam(null);
                      }}
                      onDeleteAssignment={(id) => {
                        examState.deleteAssignment(id);
                        if (selectedAssignment?.id === id) setSelectedAssignment(null);
                      }}
                      topicProgress={topicProgress}
                    />
                  </aside>

                  <section>
                    {examState.exams.length === 0 && examState.assignments.length === 0 ? (
                      <div className="empty-state py-16">
                        <GraduationCap className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--muted-foreground)" }} />
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                          No exams or assignments yet. Add one from the sidebar.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <AnimatePresence>
                          {examState.exams.map((exam) => (
                            <ExamCard
                              key={exam.id}
                              exam={exam}
                              subject={app.subjects.find((s) => s.id === exam.subjectId) ?? null}
                              topics={examState.getTopicsForExam(exam.id)}
                              practiceTests={examState.getTestsForExam(exam.id)}
                              onSelect={openExam}
                            />
                          ))}
                          {examState.assignments.map((assignment) => (
                            <AssignmentCard
                              key={assignment.id}
                              assignment={assignment}
                              subject={app.subjects.find((s) => s.id === assignment.subjectId) ?? null}
                              onSelect={openAssignment}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </section>
                </div>
              </>
            ) : (
              <PracticeTab
                subjects={app.subjects}
                lectures={backlogLectures}
                getSetForLecture={practiceState.getSetForLecture}
                onGenerateSet={practiceState.generateSet}
                generatingLectureId={practiceState.generatingLectureId}
                generateError={practiceState.generateError}
                onDeleteSet={practiceState.deleteSet}
                loadError={practiceState.loadError}
                idToken={idToken}
                jumpLectureId={practiceJump?.lectureId ?? null}
                jumpNonce={practiceJump?.nonce ?? 0}
                readyLectureIds={practiceLectureIds}
              />
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
                onPractice={() => openPractice(currentSelectedLecture)}
                onClose={() => setSelectedLecture(null)}
              />
            )}
            {currentSelectedExam && appTab === "exams" && (
              <ExamDetail
                key={currentSelectedExam.id}
                exam={currentSelectedExam}
                subjects={app.subjects}
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
            {currentSelectedAssignment && appTab === "exams" && (
              <AssignmentDetail
                key={currentSelectedAssignment.id}
                assignment={currentSelectedAssignment}
                subjects={app.subjects}
                onUpdate={examState.updateAssignment}
                onDelete={examState.deleteAssignment}
                onClose={() => setSelectedAssignment(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </AuthGuard>
  );
}
