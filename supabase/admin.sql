-- ============================================================
-- Citrus Health Tracker — Admin Migration
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Add is_admin column to allowed_users
alter table allowed_users
  add column if not exists is_admin boolean not null default false;

-- Make jake the admin
update allowed_users set is_admin = true where email = 'jake@axicom.net';
