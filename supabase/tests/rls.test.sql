-- ============================================================================
--  Mile Marker — RLS isolation tests (pgTAP)
--
--  Run via: supabase test db
--
--  This is the Phase 1 gate. If any test fails, do not ship.
-- ============================================================================

begin;
create extension if not exists pgtap;
select plan(14);

-- ---------- seed ------------------------------------------------------------

-- Two groups, two mentees (one per group), one mentor of group A, one admin.
insert into groups (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Group A'),
  ('22222222-2222-2222-2222-222222222222', 'Group B');

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@test.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@test.local'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'mentor@test.local'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin@test.local');

-- handle_new_user trigger fires on auth.users insert; here we patch role/group
update profiles set group_id = '11111111-1111-1111-1111-111111111111', role = 'mentee'
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update profiles set group_id = '22222222-2222-2222-2222-222222222222', role = 'mentee'
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
update profiles set group_id = '11111111-1111-1111-1111-111111111111', role = 'mentor'
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
update profiles set group_id = null, role = 'admin'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

insert into mentor_groups (mentor_id, group_id) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111');

insert into goals (id, owner_id, f, title) values
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'faith',  'A: read Paul'),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'family', 'B: date night');

insert into mile_markers (goal_id, month, pct, rag) values
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-05', 60, 'green'),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-05', 80, 'green');

-- helpers --------------------------------------------------------------------

create or replace function _as(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
end $$;

-- ---------- tests -----------------------------------------------------------

-- 1. mentee A sees only their own goals
select _as('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select is(
  (select count(*)::int from goals),
  1,
  'mentee A sees exactly 1 goal (their own)'
);
select is(
  (select owner_id from goals limit 1),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'mentee A''s visible goal is their own'
);

-- 2. mentee A cannot UPDATE mentee B's goal
select lives_ok(
  $$ update goals set title = 'hijack' where owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'update statement runs (no error) but should affect 0 rows under RLS'
);
select is(
  (select title from goals where owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  null,
  'mentee A still cannot SEE B''s goal after the no-op update'
);

-- 3. mentee A cannot INSERT a goal owned by B
select throws_ok(
  $$ insert into goals (owner_id, f, title) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'faith', 'forged') $$,
  '42501',
  'new row violates row-level security policy for table "goals"',
  'mentee A cannot insert a goal under B''s ownership'
);

-- 4. mentee A cannot self-promote to admin
select throws_ok(
  $$ update profiles set role = 'admin' where id = auth.uid() $$,
  null,
  null,
  'mentee A cannot escalate their own role'
);

-- 5. mentor C sees A's goal (group A) but NOT B's (group B)
select _as('cccccccc-cccc-cccc-cccc-cccccccccccc');
select is(
  (select count(*)::int from goals where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'mentor sees mentee A''s goal (same group)'
);
select is(
  (select count(*)::int from goals where owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'mentor cannot see mentee B''s goal (different group)'
);

-- 6. mentor C cannot UPDATE A's goal
select throws_ok(
  $$ update goals set title = 'mentor wrote this' where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  null,
  null,
  'mentor cannot write to mentee A''s goal'
);

-- 7. mentor C can read A's marks
select is(
  (select count(*)::int from mile_markers
   where goal_id = '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'mentor reads marks for their group'
);

-- 8. mentor C cannot read B's marks
select is(
  (select count(*)::int from mile_markers
   where goal_id = '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'mentor blocked from reading other group''s marks'
);

-- 9. admin sees all goals
select _as('dddddddd-dddd-dddd-dddd-dddddddddddd');
select is(
  (select count(*)::int from goals),
  2,
  'admin sees all goals across groups'
);

-- 10. admin cannot UPDATE someone else's goal (write is still owner-only)
select throws_ok(
  $$ update goals set title = 'admin overwrite' where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  null,
  null,
  'admin can read all but cannot write to another man''s goal'
);

-- 11. anonymous (no JWT) sees nothing
select set_config('request.jwt.claims', '', true);
select set_config('role', 'anon', true);
select is(
  (select count(*)::int from goals),
  0,
  'anonymous reader sees zero rows — default deny holds'
);

-- ----------------------------------------------------------------------------

select * from finish();
rollback;
