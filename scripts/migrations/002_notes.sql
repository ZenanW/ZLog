-- Notes table for the Notes feature.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- Also create the private "note-images" storage bucket in Supabase Dashboard:
--   Storage > New bucket > name: note-images > Public: OFF
-- The app accesses note images via signed URLs only (server-side, service role).

create table if not exists public.notes (
  id uuid primary key,
  user_id text not null,
  lecture_id uuid null references public.lectures(id) on delete set null,
  title text not null default '',
  format text not null default 'plain' check (format in ('plain', 'legal', 'cornell')),
  content jsonb not null default '{}',
  evaluation jsonb null,
  evaluated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_id_idx
  on public.notes (user_id);

create index if not exists notes_user_lecture_idx
  on public.notes (user_id, lecture_id);

-- No policies on purpose: RLS blocks anon/authenticated access entirely;
-- the app only reads/writes via the service role on the server.
alter table public.notes enable row level security;
