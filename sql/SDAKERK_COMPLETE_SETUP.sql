-- SDA KERK: COMPLETE INITIAL SUPABASE SETUP
-- Run once in a NEW dedicated SDAKerk Supabase project SQL Editor.
-- Safe to rerun. No login, keys or Vercel environment variables are created by SQL.
-- Public website uses Vercel serverless APIs with the service-role key kept server-side.
begin;
create extension if not exists pgcrypto;

create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 120),
  address text not null check (char_length(address) between 8 and 240),
  phone text,
  email text,
  google_maps_url text,
  primary_language text not null default 'Afrikaans'
    check (primary_language in ('Afrikaans','English','Xhosa','Zulu','Other')),
  church_website text,
  notes text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
-- Older database installs can also use this file.
alter table public.churches add column if not exists google_maps_url text;
alter table public.churches add column if not exists primary_language text not null default 'Afrikaans';
alter table public.churches add column if not exists church_website text;
alter table public.churches add column if not exists notes text;
alter table public.churches alter column latitude drop not null;
alter table public.churches alter column longitude drop not null;
create index if not exists churches_status_name_idx on public.churches(status,name);
create index if not exists churches_language_idx on public.churches(primary_language);

create table if not exists public.sdakerk_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.sdakerk_books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 160),
  lang text not null check (lang in ('af','en')),
  storage_path text not null unique,
  published boolean not null default false,
  published_at timestamptz not null default now()
);
create index if not exists sdakerk_books_published_idx on public.sdakerk_books(published,published_at desc);

-- Deny direct client access. Server uses service role and validates administrator token.
alter table public.churches enable row level security;
alter table public.sdakerk_settings enable row level security;
alter table public.sdakerk_books enable row level security;
revoke all on table public.churches from anon,authenticated;
revoke all on table public.sdakerk_settings from anon,authenticated;
revoke all on table public.sdakerk_books from anon,authenticated;
grant all on table public.churches to service_role;
grant all on table public.sdakerk_settings to service_role;
grant all on table public.sdakerk_books to service_role;

-- All uploaded PDFs remain in a private bucket. Published books are read
-- using temporary signed URLs created by /api/library-pdf after checking published=true.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('sdakerk-books','sdakerk-books',false,62914560,array['application/pdf']::text[])
on conflict (id) do update set
  public=false,
  file_size_limit=62914560,
  allowed_mime_types=array['application/pdf']::text[];

commit;
-- Do not add broad anon SELECT/INSERT policies to these tables or the storage bucket.
-- Setup after SQL:
-- SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
-- SUPABASE_SERVICE_ROLE_KEY=YOUR_PRIVATE_SERVICE_ROLE_KEY
-- SDAKERK_ADMIN_TOKEN=LONG_RANDOM_SECRET_32_CHARACTERS_OR_MORE
-- Store these only in Vercel project server environment variables.
-- Church submissions are pending until manually reviewed and coordinates are verified.
-- Weekly study URL is saved by /admin and read by /api/study-config.
