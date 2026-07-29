-- Metadata for PDFs uploaded to the private "pdfs" storage bucket.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).

create table if not exists public.pdf_documents (
  id uuid primary key,
  user_id text not null,
  lecture_id uuid not null,
  kind text not null check (kind in ('lecture_slides', 'tutorial_sheet')),
  name text not null,
  path text not null unique,
  size bigint not null default 0,
  summary text,
  priority_recommendation text check (priority_recommendation in ('low', 'medium', 'high')),
  priority_reason text,
  difficulty smallint check (difficulty between 1 and 7),
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists pdf_documents_user_lecture_idx
  on public.pdf_documents (user_id, lecture_id);

-- No policies on purpose: RLS blocks anon/authenticated access entirely;
-- the app only reads/writes via the service role on the server.
alter table public.pdf_documents enable row level security;
