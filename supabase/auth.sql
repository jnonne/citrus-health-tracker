-- ============================================================
-- Citrus Health Tracker — Auth Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- Run AFTER schema.sql
-- ============================================================

-- Invite-only whitelist
-- Add a row here for each person you want to allow access
create table if not exists allowed_users (
  email       text primary key,
  display_name text,
  added_at    timestamptz not null default now()
);

-- Trusted devices (30-day remember-me tokens)
create table if not exists trusted_devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  device_id     text not null unique,
  device_name   text not null,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz not null default now(),
  expires_at    timestamptz not null
);

-- RLS
alter table allowed_users   enable row level security;
alter table trusted_devices enable row level security;

-- Only service role can read/write allowed_users (middleware uses service role)
-- No user-facing policies needed

-- Users can only see/delete their own trusted devices
create policy "Users can read own devices"
  on trusted_devices for select
  using (auth.uid() = user_id);

create policy "Users can delete own devices"
  on trusted_devices for delete
  using (auth.uid() = user_id);

-- Service role inserts trusted devices (from auth callback)
create policy "Service role can insert devices"
  on trusted_devices for insert
  with check (true);

-- ============================================================
-- Add yourself to the whitelist
-- Replace with your actual email address(es)
-- ============================================================
-- insert into allowed_users (email, display_name) values
--   ('you@example.com', 'Your Name'),
--   ('family@example.com', 'Family Member');
