-- External notes import: a note may be created from an uploaded PDF rather than
-- typed in the editor. The PDF lives in the existing private "pdfs" bucket
-- under {user_id}/external-notes/{note_id}/...; the path is stored on the note.
-- Run this in the Supabase SQL editor.

alter table public.notes
  add column if not exists source text not null default 'editor';

alter table public.notes
  add column if not exists source_pdf_path text;

alter table public.notes
  add column if not exists source_pdf_name text;

alter table public.notes drop constraint if exists notes_source_check;

alter table public.notes add constraint notes_source_check
  check (source in ('editor', 'pdf'));
