# North Star

Ship the AI PDF analysis feature. It is DONE when a user can:

1. Upload a lecture-slide or tutorial-sheet PDF in the app.
2. Have the PDF stored in Supabase Storage (private bucket), with a metadata row in Postgres linking it to its lecture/tutorial.
3. Get back, from the Claude API, a rendered result showing: a plain-language **summary** of what the PDF is, a **priority recommendation**, and a **difficulty score from 1–7**.

Secondary north star, only after the above is DONE and accepted: a UI/usability overhaul. Do not start this until the user says the PDF feature is accepted.

## Constraints

Never violate these:

- **Stack:** TypeScript + React (Next.js 16, React 19) only. No new frameworks, no swapping the build system. Style with the existing Tailwind v4 setup.
- **AI provider:** Use the Anthropic Claude API only. Read the key from `ANTHROPIC_API_KEY`. If it is missing, add the var to `.env.local` and stop to ask the user to paste the key — never hardcode a key.
- **Storage:** PDFs live in Supabase Storage (private bucket). Metadata in Supabase Postgres. Do not add another storage provider.
- **Security:** Bucket must be private; access PDFs via signed URLs or server-side only. Never expose raw public file URLs or service keys to the client.
- **UI:** Keep UI changes minimal while building this feature. No heavy redesign until the secondary north star is unlocked.
- **Do NOT commit.** Never run `git commit`, `git push`, or alter git history. The user commits. Leave changes in the working tree.

## Definition of Done

Every unit of work must pass this gate before being handed back:

1. `npm run build` completes clean (this runs the TS typecheck — zero type errors).
2. `npm run lint` passes clean.
3. Notify the user that the work is ready.
4. Run `npm run dev` so the user can manually exercise the flow (upload a PDF → see summary + 1–7 score).

No automated test suite exists; do not block on tests. Manual user testing by the user is the acceptance step — iterate until the user is happy.

## Current State

_Agent updates this line every run._

Full AI PDF flow is coded and gate-clean. PDF feature ACCEPTED. UI overhaul complete per AcademicVisualDesign.md: OKLCH editorial palette (slate + oxblood red + teal accents), Cormorant Garamond display type + Inter UI, sharp-cornered panels with hairline borders (no blur/shadows), inverted primary buttons, uppercase micro-labels, shared design tokens in globals.css and src/lib/ui.ts. Semester ticker, single-status expanded cards, semester reset, and full exam/lecture flows all restyled.

## Backlog

Highest value first. Do the top unchecked item only.

- [x] Create a private Supabase Storage bucket for PDFs; confirm access is server-side / signed-URL only.
- [x] Build PDF upload UI (lecture slides + tutorial sheets), minimal styling, wired to the bucket.
- [x] Add a Postgres metadata table for uploaded PDFs, linked to the relevant lecture/tutorial record. (SQL written; user must run `scripts/migrations/001_pdf_documents.sql` in the Supabase SQL editor.)
- [x] Add a server route that sends the stored PDF to the Claude API and returns summary + priority + 1–7 difficulty score.
- [x] Persist the AI result and render it in the UI (summary, priority recommendation, difficulty score).
- [x] Harden: signed URLs, size/type validation on upload, error + loading states.
- [x] (User-requested) Semester reset: header icon button with confirmation modal that clears all subjects, lectures, PDFs, exams, topics, and practice tests (`DELETE /api/backlog`). Also fixed a pre-existing nested-`<button>` hydration error in `ExamList`.
- [x] UI/usability overhaul (UNLOCKED — user accepted the PDF feature 2026-07-29). Complete:
  - [x] Single-status view: selecting Backlog/In Progress/Done replaces the kanban board with a full-width scrollable column of expanded, inline-editable lecture cards (`ExpandedLectureCard`), including PDFs/AI section. "All" restores the board/list.
  - [x] Semester ticker replaces stat cards: auto-scroll (pause on hover, speed scales with item count), shows high-priority backlog, PDF gaps, next exam countdown, latest AI insight; filler jokes when empty.
  - [x] Editorial visual design (AcademicVisualDesign.md): OKLCH tokens, Cormorant Garamond + Inter, sharp panels, hairline borders, teal/red accents only.

## Loop Protocol

Each run, do exactly this:

1. **Read this file** top to bottom.
2. **Pick the top unchecked Backlog item.** Work on only that one.
3. **Implement it**, obeying every Constraint.
4. **Run the gate:** `npm run build`, then `npm run lint`. Fix until both pass clean.
5. **Update this file:** rewrite the `## Current State` line to describe what now works, and check off the Backlog item (add follow-up items if the work revealed them).
6. **Do NOT commit.** Leave changes staged in the working tree.
7. **Notify the user** that the run is done and what to test, then run `npm run dev` for manual verification.
8. Iterate on the same item based on the user's feedback until they accept it; only then advance to the next Backlog item.
