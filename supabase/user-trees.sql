-- ============================================================
-- Citrus Health Tracker — User-owned Trees Migration
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Step 1: Add user_id to trees (nullable first so existing rows don't break)
alter table trees
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Step 2: Assign existing trees to the admin user
update trees
  set user_id = (select id from auth.users where email = 'jake@axicom.net' limit 1)
  where user_id is null;

-- Step 3: Make user_id required going forward
alter table trees alter column user_id set not null;

-- Step 4: Unique tree name per user (not globally unique)
alter table trees
  drop constraint if exists unique_user_tree_name;
alter table trees
  add constraint unique_user_tree_name unique (user_id, name);

-- Step 5: Update RLS on trees — users only see/manage their own
drop policy if exists "Public trees read"  on trees;
drop policy if exists "Public trees write" on trees;

create policy "Users read own trees"
  on trees for select using (auth.uid() = user_id);

create policy "Users insert own trees"
  on trees for insert with check (auth.uid() = user_id);

create policy "Users update own trees"
  on trees for update using (auth.uid() = user_id);

create policy "Users delete own trees"
  on trees for delete using (auth.uid() = user_id);

-- Step 6: Update RLS on analyses — users only see analyses for their trees
drop policy if exists "Public analyses read"  on analyses;
drop policy if exists "Public analyses write" on analyses;

create policy "Users read own analyses"
  on analyses for select
  using (tree_id in (select id from trees where user_id = auth.uid()));

create policy "Users insert own analyses"
  on analyses for insert
  with check (tree_id in (select id from trees where user_id = auth.uid()));

create policy "Users update own analyses"
  on analyses for update
  using (tree_id in (select id from trees where user_id = auth.uid()));

-- Step 7: Update RLS on analysis_photos — inherit from analyses
drop policy if exists "Public photos read"  on analysis_photos;
drop policy if exists "Public photos write" on analysis_photos;

create policy "Users read own photos"
  on analysis_photos for select
  using (analysis_id in (
    select a.id from analyses a
    join trees t on t.id = a.tree_id
    where t.user_id = auth.uid()
  ));

create policy "Users insert own photos"
  on analysis_photos for insert
  with check (analysis_id in (
    select a.id from analyses a
    join trees t on t.id = a.tree_id
    where t.user_id = auth.uid()
  ));
