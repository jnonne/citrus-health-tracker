-- ============================================================
-- Citrus Health Tracker — Care Logs Migration
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

create table if not exists tree_care_logs (
  id              uuid primary key default gen_random_uuid(),
  tree_id         uuid references trees(id) on delete cascade not null,
  user_id         uuid references auth.users(id) on delete cascade not null,
  care_type       text not null check (care_type in ('watering', 'fertilizer')),
  care_date       date not null,
  notes           text,
  -- Fertilizer-specific (null for watering entries)
  fertilizer_name   text,
  fertilizer_amount text,
  created_at      timestamptz default now() not null
);

alter table tree_care_logs enable row level security;

-- Users can only see and manage their own logs
create policy "Users manage own care logs"
  on tree_care_logs for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists tree_care_logs_tree_id_idx
  on tree_care_logs(tree_id, care_date desc);
