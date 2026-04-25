-- Secret notes: client-side encrypted, Supabase only stores ciphertext
create table if not exists secret_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title_enc text not null default '',   -- AES-GCM encrypted, base64 JSON {iv, data}
  content_enc text not null default '', -- AES-GCM encrypted, base64 JSON {iv, data}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table secret_notes enable row level security;

create policy "Users can manage own secret notes"
  on secret_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
