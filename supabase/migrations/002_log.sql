-- ============================================================
-- MyDigitalBrain — log module
-- Applied: 2026-04-25
-- ============================================================

-- log_definitions: what the user wants to track
create table if not exists public.log_definitions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  label      text not null,
  data_type  text not null check (data_type in ('int','decimal','bool','duration','text')),
  unit       text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.log_definitions enable row level security;

create policy "Users can CRUD own log definitions"
  on public.log_definitions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- log_entries: individual log events (multiple per day per definition allowed)
create table if not exists public.log_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  definition_id uuid not null references public.log_definitions on delete cascade,
  logged_at     timestamptz not null default now(),
  value_int     int,
  value_decimal numeric(10,3),
  value_bool    boolean,
  value_text    text,
  note          text,
  created_at    timestamptz not null default now()
);

alter table public.log_entries enable row level security;

create policy "Users can CRUD own log entries"
  on public.log_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
