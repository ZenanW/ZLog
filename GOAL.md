# North Star

**Dev cycle: Today list.** On the Exams/Assignments page, a short in-page list says what to do next. It is DONE when a user can:

1. See at most five rows under the stats: open assignments with a due date inside 14 days (overdue included), exams dated within the next 14 days, and one lecture (longest in progress, otherwise one high-priority backlog item).
2. Read each row as one line: subject, name, and why it is here.
3. Click a row to open that assignment, exam, or lecture. A lecture switches to the Lectures tab and opens its detail.
4. See a single "Nothing due" line when no row qualifies. No modal, badge, or second to-do list.

Exams and assignments side by side are SHIPPED. Do not regress them. Email, Web Push, and the extension stay later. They must send this same list.

Weekly lecture materials and practice generate are SHIPPED — do not regress them. Lecture, exam, and practice surfaces are SHIPPED. Notes is ABANDONED. Cheaper or alternate generate models are **dropped** — stay on the current Anthropic model.

## Constraints

Never violate these:

- **Stack:** TypeScript + React (Next.js 16, React 19) only. Style with the existing Tailwind v4 + CSS-variable token system. Follow `AcademicVisualDesign.md`: OKLCH editorial palette, Cormorant Garamond display / Inter UI, sharp corners, hairline borders, no blur/shadows.
- **No new editor libraries.** Do not add Tiptap or any other editor framework.
- **AI provider:** Anthropic Claude API only, key from `ANTHROPIC_API_KEY`. Model: `process.env.ANTHROPIC_MODEL ?? "claude-opus-5"`. Do not add Gemini, Haiku, or any other provider. Practice generate keeps **structured outputs** (`output_config: { format: { type: "json_schema", schema: ... } }`).
- **Storage:** Keep the private `pdfs` bucket (`PDF_BUCKET`). Assignments are rows only — no file uploads in this cycle.
- **Auth & data shape:** Every API route requires Bearer auth via `verifyToken()` and scopes queries by `user_id`. DB columns `snake_case`, client types in `src/lib/types.ts` `camelCase`.
- **State:** Assignments live in `useExamState.ts` beside exams. Optimistic updates with rollback. Client IDs via `uuid` v4 before API calls.
- **Reuse:** Do not add a new top-level tab. Assignments share the Exams/Assignments page. Subject chips match lecture add (`SubjectBadge`). Topics and practice tests stay on exams only.
- **Explicitly OUT OF SCOPE this cycle:** email, Web Push, calendar feeds, a browser extension, notification permissions, note-taking, Google OAuth, collaborative editing, live AI, generating questions from exam topics, spaced repetition, grading short answers, switching generate models. If a task seems to need any of these, stop and ask the user instead.
- **Migrations:** Write SQL to `scripts/migrations/` (next number is `009`). The user runs migrations manually in the Supabase SQL editor — tell them when one is pending; never assume it has run.
- **Do NOT commit.** Never run `git commit`, `git push`, or alter git history. The user commits. Leave changes in the working tree.

## Feature Spec

### Exam subject

`exams.subject_id` uuid, nullable only so exams created before this column still load. New exams require a subject. Deleting a subject sets the exam's `subject_id` to null rather than deleting the exam.

### Assignment

Its own table, not a child of `exams`.

- `id` uuid primary key (client-generated)
- `user_id` text, not null
- `subject_id` uuid, not null, references `subjects(id)` on delete cascade
- `name` text, not null
- `due_date` timestamptz, null allowed
- `status` text, not null, default `not_started`, check in (`not_started`, `in_progress`, `submitted`)
- `created_at` / `updated_at` timestamptz, default `now()`

Client type `Assignment`: `id`, `subjectId`, `name`, `dueDate`, `status`, `createdAt`, `updatedAt`.

### API

- `GET` / `POST` `/api/assignments`
- `PATCH` / `DELETE` `/api/assignments/[id]`

POST requires `id`, `name`, `subjectId`. `dueDate` nullable. `status` optional. Exam POST requires `subjectId` as well. Reject a blank name. Every handler calls `verifyToken()` first and filters by `user_id`. POST returns 201.

### State and UI

The tab label is **Exams/Assignments**. One sidebar add card switches between Exam and Assignment and uses subject chips. The main grid shows both card types. `ExamDetail` edits the exam's subject and keeps topics and practice tests. `AssignmentDetail` edits name, subject, due date, and status. No assignment section inside an exam.

`DELETE /api/backlog` deletes the caller's assignments.

### Today list

Built in `src/lib/today.ts` (`buildTodayItems`) and shown by `TodayList` on the Exams/Assignments page, under the stats and above the sidebar. It is part of the page flow.

Rules, in order:

- Assignments with `status !== submitted` and a `dueDate` that is overdue or within 14 days, soonest first.
- Exams with an `examDate` from today through 14 days ahead. Past exams are omitted.
- One lecture: the `in_progress` lecture with the oldest `updatedAt`, or if none, the high-priority `backlog` lecture with the oldest `updatedAt`.

Dated rows fill at most four slots when a lecture qualifies, so the lecture is not crowded out. Total cap is five. A row within one day, or overdue, is marked urgent. Clicking uses the existing exam, assignment, and lecture detail panels.

### What this must not do

No scheduler, no email, no push, no extension, no overlay. Dates on the cards stay labels.

## Definition of Done

Every unit of work must pass this gate before being handed back:

1. `npm run build` completes clean (zero type errors).
2. `npm run lint` passes clean.
3. Notify the user what is ready and what to test (including any pending migration to run).
4. Do **not** start the dev server. Tell the user the change is ready so they can run `npm run dev` themselves.

No automated test suite exists; do not block on tests. Manual user testing is the acceptance step — iterate until the user is happy.

## Current State

*Agent updates this line every run.*

The Exams/Assignments page has a Today list under the stats: overdue and 14-day assignments, exams in the next 14 days, and one stuck or high-priority lecture. A row opens that record. An empty list is one line, "Nothing due." Email is still later.

## Backlog

Highest value first. Do the top unchecked item only. Do not start anything under Later until every item here is checked and the user opens that cycle.

- [x] **Assignments beside exams:** migration `009_assignments.sql` drops the nested table and creates a standalone `assignments` table with `subject_id`; exams gain `subject_id`; tab and add card cover both; exam and assignment cards and detail panels; semester reset deletes assignments.
- [x] **Today list:** `buildTodayItems` plus `TodayList` on the Exams/Assignments page. At most five rows. Click opens the existing detail. Empty state is one line.

## Later

Not this cycle. Listed so the assignment fields stay useful for them. Do not implement.

- **Email:** send the Today list. No second set of rules. Unfinished practice can join the list in that cycle if the mail needs it.
- **Web Push,** then an optional **extension** that only badges and deep-links into the webapp. The extension does not own a reminder list.

## Loop Protocol

Each run, do exactly this:

1. **Read this file** top to bottom.
2. **Pick the top unchecked Backlog item.** Work on only that one. Never pick from Later.
3. **Implement it**, obeying every Constraint and the Feature Spec.
4. **Run the gate:** `npm run build`, then `npm run lint`. Fix until both pass clean.
5. **Update this file:** rewrite the `## Current State` line to describe what now works, and check off the Backlog item (add follow-up items if the work revealed them).
6. **Do NOT commit.** Leave changes in the working tree.
7. **Notify the user** that the run is done, what to test, and any migration they must run. Do **not** start `npm run dev`. The user runs the dev server.
8. Iterate on the same item based on the user's feedback until they accept it; only then advance to the next Backlog item.
