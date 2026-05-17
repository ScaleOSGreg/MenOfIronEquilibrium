-- ============================================================================
--  Mile Marker — initial schema
--  Equilibrium Retreat · A ministry of Men of Iron
--
--  This migration creates the six tables, enables Row Level Security on every
--  one, installs the policies, wires the auth.users -> profiles trigger, and
--  configures the goal-photos Storage bucket with its own RLS.
--
--  RUN this BEFORE anyone real uses the app. The pgTAP tests in
--  supabase/tests/rls.test.sql must all pass.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS -----------------------------------------------------------

create type user_role as enum ('mentee', 'mentor', 'admin');
create type f_key      as enum ('faith', 'family', 'friends', 'fitness', 'finances');
create type rag_status as enum ('green', 'amber', 'red');

-- ---------- TABLES ----------------------------------------------------------

create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null,
  photo_url   text,
  role        user_role not null default 'mentee',
  group_id    uuid references groups on delete set null,
  invited_by  uuid references profiles,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table mentor_groups (
  id          uuid primary key default gen_random_uuid(),
  mentor_id   uuid not null references profiles on delete cascade,
  group_id    uuid not null references groups on delete cascade,
  created_at  timestamptz not null default now(),
  unique (mentor_id, group_id)
);

create table goals (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles on delete cascade,
  f           f_key not null,
  title       text not null,
  smart_s     text default '',
  smart_m     text default '',
  smart_a     text default '',
  smart_r     text default '',
  smart_t     text default '',
  note        text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index goals_owner_idx on goals (owner_id) where deleted_at is null;

create table mile_markers (
  id              uuid primary key default gen_random_uuid(),
  goal_id         uuid not null references goals on delete cascade,
  month           text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  pct             int  not null check (pct between 0 and 100),
  rag             rag_status not null,
  note            text default '',
  blockers        text default '',
  commitment      text default '',
  commitment_kept boolean,                       -- captured next month
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (goal_id, month)                        -- one marker per goal per month
);
create index mile_markers_goal_idx on mile_markers (goal_id);

create table goal_photos (
  id            uuid primary key default gen_random_uuid(),
  goal_id       uuid not null references goals on delete cascade,
  owner_id      uuid not null references profiles on delete cascade,
  storage_path  text not null,
  taken_at      timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index goal_photos_goal_idx on goal_photos (goal_id);

-- ---------- updated_at trigger ----------------------------------------------

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger goals_set_updated_at
  before update on goals
  for each row execute function set_updated_at();

create trigger mile_markers_set_updated_at
  before update on mile_markers
  for each row execute function set_updated_at();

-- ---------- auth.users -> profiles bridge ----------------------------------
--
--  When the invite-man Edge Function calls auth.admin.inviteUserByEmail it
--  passes the new man's full_name / group_id / invited_by in raw_user_meta_data.
--  When the user accepts the invite and sets a password, Supabase Auth creates
--  the auth.users row; this trigger then materializes the profile row.

create or replace function handle_new_user() returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  v_full_name  text;
  v_group_id   uuid;
  v_invited_by uuid;
  v_role       user_role;
begin
  v_full_name  := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  v_group_id   := nullif(new.raw_user_meta_data ->> 'group_id', '')::uuid;
  v_invited_by := nullif(new.raw_user_meta_data ->> 'invited_by', '')::uuid;
  v_role       := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'mentee')::user_role;

  insert into profiles (id, full_name, group_id, invited_by, role)
  values (new.id, v_full_name, v_group_id, v_invited_by, v_role)
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- helper functions for RLS ---------------------------------------

create or replace function current_role_is(target user_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = target
      and deleted_at is null
  );
$$;

create or replace function current_user_group_id() returns uuid
language sql stable security definer set search_path = public as $$
  select group_id from profiles where id = auth.uid() and deleted_at is null;
$$;

-- "I am the mentor of <owner>'s group"
create or replace function is_mentor_of(target_owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from profiles p
    join mentor_groups mg on mg.group_id = p.group_id
    where p.id = target_owner
      and mg.mentor_id = auth.uid()
      and p.deleted_at is null
  );
$$;

-- ---------- RLS: enable + force on every table ------------------------------

alter table groups        enable row level security;
alter table profiles      enable row level security;
alter table mentor_groups enable row level security;
alter table goals         enable row level security;
alter table mile_markers  enable row level security;
alter table goal_photos   enable row level security;

-- Force RLS so that even table owners obey policies in test scenarios.
alter table groups        force row level security;
alter table profiles      force row level security;
alter table mentor_groups force row level security;
alter table goals         force row level security;
alter table mile_markers  force row level security;
alter table goal_photos   force row level security;

-- ---------- POLICIES --------------------------------------------------------
--
-- Rules (from the build spec, section 5):
--   * A mentee can read/write only rows they own.
--   * A mentor can READ goals/markers/photos of any man whose group is in
--     the mentor's mentor_groups; cannot write.
--   * An admin can READ everything; can write only their own goals.
--   * Default is deny.
--   * Profile creation is server-side only (Edge Function with the secret
--     key), which is what makes this app invite-only.

-- ---- profiles ----
create policy profiles_self_read on profiles
  for select using (id = auth.uid());

create policy profiles_admin_read on profiles
  for select using (current_role_is('admin'));

create policy profiles_mentor_read on profiles
  for select using (
    current_role_is('mentor')
    and group_id is not null
    and group_id in (select group_id from mentor_groups where mentor_id = auth.uid())
  );

create policy profiles_self_update on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
  -- cannot self-promote: the role column must equal the current role.

-- ---- groups ----
create policy groups_member_read on groups
  for select using (
    id = current_user_group_id()
    or current_role_is('admin')
    or id in (select group_id from mentor_groups where mentor_id = auth.uid())
  );

create policy groups_admin_write on groups
  for all using (current_role_is('admin'))
  with check (current_role_is('admin'));

-- ---- mentor_groups ----
create policy mentor_groups_self_read on mentor_groups
  for select using (mentor_id = auth.uid() or current_role_is('admin'));

create policy mentor_groups_admin_write on mentor_groups
  for all using (current_role_is('admin'))
  with check (current_role_is('admin'));

-- ---- goals ----
create policy goals_owner_all on goals
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy goals_mentor_read on goals
  for select using (is_mentor_of(owner_id));

create policy goals_admin_read on goals
  for select using (current_role_is('admin'));

-- ---- mile_markers ----
create policy marks_owner_all on mile_markers
  for all using (
    exists (select 1 from goals g where g.id = goal_id and g.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from goals g where g.id = goal_id and g.owner_id = auth.uid())
  );

create policy marks_mentor_read on mile_markers
  for select using (
    exists (select 1 from goals g where g.id = goal_id and is_mentor_of(g.owner_id))
  );

create policy marks_admin_read on mile_markers
  for select using (current_role_is('admin'));

-- ---- goal_photos ----
create policy photos_owner_all on goal_photos
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy photos_mentor_read on goal_photos
  for select using (is_mentor_of(owner_id));

create policy photos_admin_read on goal_photos
  for select using (current_role_is('admin'));

-- ---------- STORAGE bucket + policies --------------------------------------
--
--  Path convention: {owner_id}/{goal_id}/{uuid}.jpg
--  RLS on storage.objects enforces the same rules as goal_photos above.

insert into storage.buckets (id, name, public)
values ('goal-photos', 'goal-photos', false)
on conflict (id) do nothing;

create policy "photos: owner read own"
  on storage.objects for select
  using (bucket_id = 'goal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: owner insert own"
  on storage.objects for insert
  with check (bucket_id = 'goal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: owner delete own"
  on storage.objects for delete
  using (bucket_id = 'goal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos: mentor read group"
  on storage.objects for select
  using (
    bucket_id = 'goal-photos'
    and is_mentor_of(((storage.foldername(name))[1])::uuid)
  );

create policy "photos: admin read all"
  on storage.objects for select
  using (bucket_id = 'goal-photos' and current_role_is('admin'));
