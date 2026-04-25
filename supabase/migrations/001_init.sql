-- ============================================================
-- MyDigitalBrain — initial schema
-- Applied: 2026-04-25
-- ============================================================

-- profiles: extends auth.users (created automatically on sign-up via trigger)
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: auto-create profile on new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- notes
-- ============================================================
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  title      text not null default '',
  content    text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can CRUD own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- diary_entries
-- ============================================================
create table if not exists public.diary_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  content    text not null default '',
  mood       text check (mood in ('great','good','neutral','bad','terrible')),
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diary_entries enable row level security;

create policy "Users can CRUD own diary entries"
  on public.diary_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
