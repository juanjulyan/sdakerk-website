-- Run in Supabase SQL Editor. Applications write ONLY through server-side service role.
create extension if not exists pgcrypto;
create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 120),
  address text not null check (char_length(address) between 8 and 240),
  phone text,
  email text,
  notes text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists churches_approved_idx on public.churches(status,name);
alter table public.churches enable row level security;
-- No public or anon policies. Service-role access only via api/churches.js.
-- Review entries in Table Editor and set status = approved only after checking
-- the church is a real Afrikaans SDA congregation and contact details may be published.
-- Do not publish private individuals' phone or email without consent.

-- Update an existing SDAKerk deployment to accept a Google Maps link.
alter table public.churches add column if not exists google_maps_url text;
alter table public.churches alter column latitude drop not null;
alter table public.churches alter column longitude drop not null;
-- Approve only once an administrator verifies the Google Maps link and maps the coordinates.

-- October 2026: primary congregation language and public church website.
alter table public.churches add column if not exists primary_language text not null default 'Afrikaans';
alter table public.churches add column if not exists church_website text;
alter table public.churches drop constraint if exists churches_primary_language_check;
alter table public.churches add constraint churches_primary_language_check check (primary_language in ('Afrikaans','English','Xhosa','Zulu','Other'));
-- Publicly viewable selected Sabbath School week (writes only through authenticated Vercel API).
create table if not exists public.sdakerk_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.sdakerk_settings enable row level security;
-- No anon/authenticated policies. Server-side service-role access only.
