-- Expand weekly lecture file kinds on pdf_documents.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
-- After this, also allow text/plain on the private "pdfs" bucket
-- (re-run: node --env-file=.env.local scripts/setup-storage.mjs).

do $$
declare
  cons text;
begin
  select conname into cons
  from pg_constraint
  where conrelid = 'public.pdf_documents'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%kind%';
  if cons is not null then
    execute format('alter table public.pdf_documents drop constraint %I', cons);
  end if;
end $$;

alter table public.pdf_documents
  add constraint pdf_documents_kind_check
  check (kind in (
    'lecture_slides',
    'tutorial_sheet',
    'tutorial_answers',
    'lecture_transcript'
  ));
