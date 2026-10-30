-- Assignments are their own records, not children of an exam.
-- Exams gain a subject, same idea as lectures.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
-- Safe to re-run after the earlier nested version of this file.

drop table if exists public.assignments;

alter table public.exams
  add column if not exists subject_id uuid references public.subjects(id) on delete set null;

create index if not exists exams_subject_idx
  on public.exams (subject_id);

create table public.assignments (
  id uuid primary key,
  user_id text not null,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  due_date timestamptz,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'submitted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assignments_user_idx
  on public.assignments (user_id);

create index if not exists assignments_subject_idx
  on public.assignments (subject_id);

-- No policies on purpose: RLS blocks anon/authenticated access entirely;
-- the app only reads/writes via the service role on the server.
alter table public.assignments enable row level security;
