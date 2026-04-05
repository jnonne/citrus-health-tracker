-- ============================================================
-- Citrus Health Tracker — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Trees table
create table if not exists trees (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  species       text not null,
  location      text,
  notes         text,
  created_at    timestamptz not null default now(),
  last_analysis_at timestamptz
);

-- Analyses table
create table if not exists analyses (
  id                  uuid primary key default gen_random_uuid(),
  tree_id             uuid not null references trees(id) on delete cascade,
  created_at          timestamptz not null default now(),
  last_watered        date not null,
  moisture_reading    numeric(5,2),
  ph_reading          numeric(4,2),
  user_concerns       text,
  ai_summary          text not null,
  ai_recommendations  text[] not null default '{}',
  ai_urgency          text not null check (ai_urgency in ('good','monitor','attention','urgent'))
);

-- Analysis photos table
create table if not exists analysis_photos (
  id            uuid primary key default gen_random_uuid(),
  analysis_id   uuid not null references analyses(id) on delete cascade,
  storage_path  text not null,
  photo_type    text not null check (photo_type in ('tree','meter'))
);

-- ============================================================
-- Storage bucket
-- ============================================================
-- Run in SQL Editor:
insert into storage.buckets (id, name, public)
values ('tree-photos', 'tree-photos', true)
on conflict (id) do nothing;

-- Allow public read of photos
create policy "Public read tree photos"
  on storage.objects for select
  using (bucket_id = 'tree-photos');

-- Allow authenticated + anon insert (adjust if you add auth later)
create policy "Allow photo uploads"
  on storage.objects for insert
  with check (bucket_id = 'tree-photos');

-- ============================================================
-- Row Level Security (open for now — add auth later)
-- ============================================================
alter table trees enable row level security;
alter table analyses enable row level security;
alter table analysis_photos enable row level security;

create policy "Public trees read"  on trees  for select using (true);
create policy "Public trees write" on trees  for all    using (true);

create policy "Public analyses read"  on analyses  for select using (true);
create policy "Public analyses write" on analyses  for all    using (true);

create policy "Public photos read"  on analysis_photos  for select using (true);
create policy "Public photos write" on analysis_photos  for all    using (true);
