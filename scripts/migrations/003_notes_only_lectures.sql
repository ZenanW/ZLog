-- Allow notes_only status for capture lectures created from the Notes flow
-- (not shown in the Lectures backlog). Run in Supabase SQL editor.

alter table public.lectures drop constraint if exists lectures_status_check;

alter table public.lectures add constraint lectures_status_check
  check (status in ('backlog', 'in_progress', 'completed', 'notes_only'));
