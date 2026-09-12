-- Practice sets: one current question set per lecture, generated from slides.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).

create table if not exists public.practice_sets (
  id uuid primary key,
  user_id text not null,
  lecture_id uuid not null references public.lectures(id) on delete cascade,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lecture_id)
);

create index if not exists practice_sets_user_idx
  on public.practice_sets (user_id);

create table if not exists public.practice_questions (
  id uuid primary key,
  set_id uuid not null references public.practice_sets(id) on delete cascade,
  sort_order integer not null,
  kind text not null check (kind in ('mcq', 'short')),
  prompt text not null,
  choices jsonb,
  correct_choice_id text,
  model_answer text,
  explanation text not null,
  slide_reference text
);

create index if not exists practice_questions_set_idx
  on public.practice_questions (set_id, sort_order);

-- No policies on purpose: RLS blocks anon/authenticated access entirely;
-- the app only reads/writes via the service role on the server.
alter table public.practice_sets enable row level security;
alter table public.practice_questions enable row level security;
