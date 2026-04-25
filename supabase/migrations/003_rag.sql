-- RAG (Retrieval Augmented Generation) support via pgvector
-- Requires OpenAI text-embedding-3-small (1536 dims) + OpenRouter for LLM

-- Enable pgvector
create extension if not exists vector with schema extensions;

-- Add embedding columns to notes and diary_entries
alter table notes add column if not exists embedding vector(1536);
alter table diary_entries add column if not exists embedding vector(1536);

-- Match notes by semantic similarity (user_id filter enforces data isolation)
create or replace function match_notes(
  query_embedding vector(1536),
  match_user_id uuid,
  match_threshold float default 0.3,
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  content text,
  updated_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    id,
    title,
    content,
    updated_at,
    1 - (embedding <=> query_embedding) as similarity
  from notes
  where user_id = match_user_id
    and embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Match diary entries by semantic similarity
create or replace function match_diary(
  query_embedding vector(1536),
  match_user_id uuid,
  match_threshold float default 0.3,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  entry_date date,
  mood text,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    entry_date,
    mood,
    1 - (embedding <=> query_embedding) as similarity
  from diary_entries
  where user_id = match_user_id
    and embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
