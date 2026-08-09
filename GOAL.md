# North Star

**Dev cycle: Notes.** Ship a first-class note-taking feature as a new top-level tab (sibling of Lectures and Exams), with AI evaluation of notes against lecture slides. It is DONE when a user can:

1. Open a **Notes** tab, create a note — choosing clearly between a **fresh/standalone note** and **notes on a backlog lecture** (picked via an intuitive subject → lecture selector) — and write in a genuinely nice editor with three selectable formats: **Plain paper**, **Legal pad**, and **Cornell notes**. Notes on a backlog lecture are also reachable from the lecture itself.
2. **Drag-drop or insert images** into a note (stored privately in Supabase Storage, rendered via signed URLs).
3. **Attach a note to a lecture** and press **Evaluate** — Claude compares the note against that lecture's uploaded slides PDF and returns structured feedback (coverage, accuracy flags, missing topics, structure suggestions) rendered in the UI.
4. Alternatively, evaluate **external notes**: drag-drop a PDF of notes, or paste a **link-shared Google Doc URL**, and get the same evaluation without using the in-app editor.

Previous cycle (AI PDF analysis + editorial UI overhaul) is SHIPPED and ACCEPTED — do not regress it.

## Constraints

Never violate these:

- **Stack:** TypeScript + React (Next.js 16, React 19) only. Style with the existing Tailwind v4 + CSS-variable token system. Follow `AcademicVisualDesign.md`: OKLCH editorial palette, Cormorant Garamond display / Inter UI, sharp corners, hairline borders, no blur/shadows. The note formats (legal pad lines, Cornell grid) must feel native to this design language, not skeuomorphic clip-art.
- **Editor library:** Use **Tiptap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`). No other editor frameworks. These are the only new dependencies permitted this cycle.
- **AI provider:** Anthropic Claude API only, key from `ANTHROPIC_API_KEY`. Model: `process.env.ANTHROPIC_MODEL ?? "claude-opus-5"`. Use **structured outputs** (`output_config: { format: { type: "json_schema", schema: ... } }`) — do NOT copy the regex-JSON-extraction pattern from `pdfs/analyze/route.ts`.
- **Storage:** Note content lives in Supabase Postgres (Tiptap JSON in a `jsonb` column). Note images live in a **private** Supabase Storage bucket (`note-images`), accessed via signed URLs only — mirror the existing pattern in `src/lib/pdfs.ts` and `/api/pdfs/sign`. Never expose public file URLs or service keys to the client.
- **Auth & data shape:** Every new API route requires Bearer auth via `verifyToken()` and scopes queries by `user_id`, exactly like existing routes. DB columns `snake_case`, client types in `src/lib/types.ts` `camelCase`, mapped in a `mapNoteFromDb`-style helper.
- **State:** New hook `src/hooks/useNoteState.ts` following the optimistic-update-with-rollback pattern of `useAppState.ts` / `useExamState.ts`. Client IDs via `uuid` v4 before API calls.
- **Explicitly OUT OF SCOPE this cycle:** Google OAuth, private Google Docs, live/continuous Google Doc sync, real-time (as-you-type) AI checking, collaborative editing. If a task seems to need any of these, stop and ask the user instead.
- **Migrations:** Write SQL to `scripts/migrations/` (next number in sequence). The user runs migrations manually in the Supabase SQL editor — tell them when one is pending; never assume it has run.
- **Do NOT commit.** Never run `git commit`, `git push`, or alter git history. The user commits. Leave changes in the working tree.

## Feature Spec

### Data model

`notes` table (migration `002_notes.sql`):

- `id uuid primary key`
- `user_id text not null`
- `lecture_id uuid null references lectures(id) on delete set null` — a note may be unattached
- `title text not null default ''`
- `format text not null default 'plain'` — one of `plain | legal | cornell`
- `content jsonb not null default '{}'` — Tiptap document. For Cornell: `{ cue, notes, summary }`, each a Tiptap doc
- `evaluation jsonb null` — last AI evaluation result
- `evaluated_at timestamptz null`
- `created_at` / `updated_at timestamptz not null default now()`

Client type `Note` in `src/lib/types.ts` mirrors this in camelCase.

### Creation flow & lecture attachment

The new-note flow must make one distinction unmissable: **is this a standalone note, or notes on a lecture already in the backlog?**

- **New-note action opens a two-choice step** (modal or inline panel, per the design system):
  1. **"Blank note"** — standalone, `lecture_id` null. Used for ad-hoc notes or lectures not yet in the app. Can be attached to a lecture later from the editor.
  2. **"Notes for a lecture"** — shows a subject → lecture picker (grouped by subject with `SubjectBadge` colors, searchable/filterable, most recent lectures first; reuse data from `useAppState`, do not refetch). Picking a lecture creates the note pre-attached, with the title prefilled from the lecture title (editable). Include a small **"+ new lecture"** affordance inside the picker that quick-creates a lecture via the existing `useAppState` add-lecture path (subject + title only) and attaches to it — for "I'm sitting in a lecture right now" capture.
- **In the editor**, the attachment is always visible and changeable: an attachment chip near the title showing subject color + lecture title (or "Unattached"), clickable to open the same picker to attach/reattach/detach.
- **From the lecture side:** lecture cards/detail (`ExpandedLectureCard` / `LectureDetail`) show a Notes affordance — if the lecture has notes, list them with a jump-to-editor link; if not, a "Take notes" action that creates a pre-attached note and opens the Notes tab on it. This is the intuitive path for "I'm working through a backlog lecture and want to take notes on it."
- **In the Notes tab list**, attached and standalone notes are visually distinct (subject-colored badge vs a neutral "unattached" treatment), and the list is filterable by subject/lecture using the existing search-filter patterns.

One lecture may have multiple notes; a note has at most one lecture.

### Editor formats

- **Plain paper:** single Tiptap instance, generous margins, clean serif-adjacent body.
- **Legal pad:** same single instance, CSS treatment — subtle ruled baselines (repeating-linear-gradient aligned to line-height), a single vertical margin rule in the accent red, faint warm paper tint from the existing token palette. Presentation only; content is identical to plain.
- **Cornell:** CSS grid with three regions — cue column (~30%, left), notes area (right), summary strip (bottom, full width). Three Tiptap instances, one per region, saved as `{ cue, notes, summary }`. Region labels as uppercase micro-labels per the design system.
- Switching format on an existing note: plain ↔ legal is free (same content). Switching to/from Cornell moves existing content into the notes region (warn the user in a confirm dialog); cue/summary start empty.

### Images

- Drag-drop onto the editor and an explicit insert button in the toolbar.
- Upload flow: client requests an upload from a new `/api/notes/images` route (auth-checked) → file goes to the private `note-images` bucket under `{user_id}/{uuid}.{ext}` → Tiptap image node stores the storage path (NOT a URL) in a data attribute → rendering resolves paths to signed URLs (short TTL) via a sign endpoint, cached client-side.
- Validate: images only (png/jpeg/webp/gif), max 5 MB, reject others with a visible error.

### AI evaluation

`POST /api/notes/[id]/evaluate`:

1. Load the note; serialize Tiptap content to clean plain text/markdown (preserve Cornell region labels). Collect image storage paths, download from the bucket, include as base64 image blocks.
2. If the note is attached to a lecture that has a `lecture_slides` PDF, download it (existing `PDF_BUCKET` code path) and include it as a document block **first** in the message.
3. Ask Claude for a structured evaluation. JSON schema (also the shape stored in `notes.evaluation`):
   - `coverageScore` (integer 0–100) — how much of the slide material the notes cover (null when no slides attached)
   - `accuracyFlags` (array of `{ claim, issue, slideReference }`) — ONLY genuine contradictions of the source material. Paraphrasing and extra outside knowledge are NOT errors.
   - `missingTopics` (array of strings) — slide topics absent from the notes
   - `structureFeedback` (string, 2–4 sentences) — note-taking quality: organization, abbreviation, cue/summary usage for Cornell
   - `summary` (string, 1–2 sentences) — overall verdict, encouraging in tone
4. No slides attached → same schema with `coverageScore`/`missingTopics` null/empty and the prompt evaluating general quality only; the UI must label this mode ("evaluated without source slides").
5. Persist to `evaluation` + `evaluated_at`, return the mapped note. Render results in an evaluation panel: score as a stat, flags as a red-accented list, missing topics as chips, feedback as prose. Show loading state during the request (it can take ~30s+) and keep the previous evaluation visible until replaced.

### External notes import

- **PDF:** drag-drop a PDF onto a "Evaluate external notes" surface in the Notes tab → creates a note of format `plain` with the PDF stored (reuse the pdf_documents pipeline or a minimal parallel path), flagged `source: pdf`, evaluated the same way (the notes PDF becomes an additional document block).
- **Google Doc link:** input accepts a docs.google.com URL → server extracts the doc ID → fetches `https://docs.google.com/document/d/{id}/export?format=pdf` server-side (no auth). Non-200 response → return a clear error: the doc must be shared as "Anyone with the link". Successful fetch → same evaluation path as PDF. Never send Google credentials; never prompt for Google login.

## Definition of Done

Every unit of work must pass this gate before being handed back:

1. `npm run build` completes clean (zero type errors).
2. `npm run lint` passes clean.
3. Notify the user what is ready and what to test (including any pending migration to run).
4. Run `npm run dev` so the user can manually exercise the flow.

No automated test suite exists; do not block on tests. Manual user testing is the acceptance step — iterate until the user is happy.

## Current State

_Agent updates this line every run._

Mobile pass (not advancing AI evaluation): delete/edit controls that were hover-only are always visible on small screens (`sm:` hover hide); Notes list + NoteEditor delete work on touch; header tabs icon-only on phone; Cornell stacks vertically below `sm`; lecture detail / PDF rows / filters wrap more cleanly. Note images still shipped as before. Next backlog item remains AI evaluation.

## Backlog

Highest value first. Do the top unchecked item only.

- [x] **Foundation:** migration `002_notes.sql` (notes table + private `note-images` bucket notes in the SQL comments), `Note` type, `/api/notes` CRUD routes (list/create/update/delete, auth + user scoping), `useNoteState` hook with optimistic updates. Notes tab added to `AppShell` with: the two-choice creation flow (blank note vs notes-for-a-lecture with the subject → lecture picker + "+ new lecture" quick-create, per spec), and a list view (title, format badge, subject-colored attachment badge vs neutral "unattached", updated date) with create/delete and subject/lecture filtering.
- [x] **Editor — plain + legal:** Tiptap editor view for a note (title field, format switcher, toolbar: bold/italic/headings/lists), autosave with debounce + save-status indicator, plain and legal-pad treatments per spec. Attachment chip near the title (attach/reattach/detach via the same picker). _(Legal pad removed per user request; plain editor retained.)_
- [x] **Lecture-side entry point:** Notes affordance on `ExpandedLectureCard` / `LectureDetail` per spec — list existing notes with jump-to-editor, or "Take notes" to create a pre-attached note and open it in the Notes tab.
- [x] **Editor — Cornell:** three-region Cornell layout per spec, content migration rules on format switch with confirm dialog.
- [x] **Images:** `note-images` bucket wiring, `/api/notes/images` upload + sign routes, drag-drop + insert button in the editor, path-based image nodes resolved via signed URLs, validation and error states.
- [ ] **AI evaluation:** `/api/notes/[id]/evaluate` per spec (structured outputs, slides grounding, image blocks), evaluation panel UI with loading/error states, no-slides mode labeled.
- [ ] **External import — PDF:** drag-drop external notes PDF → evaluated via the same route; result shown on the created note.
- [ ] **External import — Google Doc link:** link-shared export fetch per spec, with the exact sharing-settings error message for private docs.
- [ ] **Polish pass:** empty states (no notes yet; "attach slides to unlock coverage scoring"), semester-reset (`DELETE /api/backlog`) extended to wipe notes + note images, ticker item for "notes not yet evaluated", keyboard focus states.

## Loop Protocol

Each run, do exactly this:

1. **Read this file** top to bottom.
2. **Pick the top unchecked Backlog item.** Work on only that one.
3. **Implement it**, obeying every Constraint and the Feature Spec.
4. **Run the gate:** `npm run build`, then `npm run lint`. Fix until both pass clean.
5. **Update this file:** rewrite the `## Current State` line to describe what now works, and check off the Backlog item (add follow-up items if the work revealed them).
6. **Do NOT commit.** Leave changes in the working tree.
7. **Notify the user** that the run is done, what to test, and any migration they must run, then start `npm run dev` for manual verification.
8. Iterate on the same item based on the user's feedback until they accept it; only then advance to the next Backlog item.
