-- Remove legal pad format; migrate existing legal notes to plain.
-- Run in Supabase SQL editor.

update public.notes set format = 'plain' where format = 'legal';

alter table public.notes drop constraint if exists notes_format_check;

alter table public.notes add constraint notes_format_check
  check (format in ('plain', 'cornell'));
