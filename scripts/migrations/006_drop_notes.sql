-- Teardown the abandoned Notes cycle.
-- Run this in the Supabase SQL editor AFTER the agent has removed Notes code
-- from the app (Dashboard > SQL Editor > New query).
--
-- Dashboard (SQL cannot do these):
--   1. Storage > delete the private "note-images" bucket if it exists.
--   2. Optional: Anthropic Console > Files — leftover large-note uploads are
--      not in Postgres; ignore or delete manually.

-- Capture lectures existed only so a note had something to attach to.
delete from public.lectures where status = 'notes_only';

drop table if exists public.notes;

alter table public.lectures drop constraint if exists lectures_status_check;

alter table public.lectures add constraint lectures_status_check
  check (status in ('backlog', 'in_progress', 'completed'));
