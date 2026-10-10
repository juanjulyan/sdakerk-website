-- Run in Supabase SQL editor. Private bucket; PDFs accessed via signed 15-minute URLs.
create table if not exists public.sdakerk_books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 160),
  lang text not null check (lang in ('af','en')),
  storage_path text not null unique,
  published boolean not null default false,
  published_at timestamptz not null default now()
);
alter table public.sdakerk_books enable row level security;
-- No public RLS access. API uses a service role secret (server-side only).
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('sdakerk-books','sdakerk-books',false,62914560,array['application/pdf'])
on conflict (id) do update set public=false,file_size_limit=62914560,allowed_mime_types=array['application/pdf'];
