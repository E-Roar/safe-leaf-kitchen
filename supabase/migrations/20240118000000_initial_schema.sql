-- Enable pgvector extension
create extension if not exists vector;

-- Detected leaves from CV scans
create table detected_leaves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  scan_timestamp timestamptz default now(),
  image_url text, -- Points to supabase storage 'scans' bucket
  predictions jsonb not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- RAG document chunks with embeddings
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  source_type text not null check (source_type in ('pdf', 'image', 'text', 'scan')),
  source_url text, -- Points to supabase storage 'documents' bucket
  content text not null,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz default now()
);

-- Chat conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Vector similarity search function
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (id uuid, content text, similarity float)
language plpgsql
as $$
begin
  return query
  select
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RLS Policies
alter table detected_leaves enable row level security;
alter table document_chunks enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Allow users to manage their own data
create policy "Users can manage own leaves" on detected_leaves
  for all using (auth.uid() = user_id);

create policy "Users can manage own documents" on document_chunks
  for all using (auth.uid() = user_id);

create policy "Users can manage own conversations" on conversations
  for all using (auth.uid() = user_id);

create policy "Users can manage own messages" on messages
  for all using (
    auth.uid() = (select user_id from conversations where id = conversation_id)
  );

-- Storage bucket creation (if not exists)
insert into storage.buckets (id, name, public)
values ('scans', 'scans', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload own scans"
on storage.objects for insert
with check ( bucket_id = 'scans' and auth.uid() = owner );

create policy "Users can view own scans"
on storage.objects for select
using ( bucket_id = 'scans' and auth.uid() = owner );

create policy "Users can upload own documents"
on storage.objects for insert
with check ( bucket_id = 'documents' and auth.uid() = owner );

create policy "Users can view own documents"
on storage.objects for select
using ( bucket_id = 'documents' and auth.uid() = owner );
