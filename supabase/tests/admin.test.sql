-- ============================================================================
--  Mile Marker - admin RPC tests (pgTAP)
--
--  Tests admin_set_profile_deleted authorization and behavior.
--  Run via: supabase test db
-- ============================================================================

begin;
create extension if not exists pgtap;
select plan(7);

-- ---------- seed ------------------------------------------------------------

insert into groups (id, name) values
  ('33333333-3333-3333-3333-333333333333', 'Suspend-Test Group');

insert into auth.users (id, email) values
  ('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'suspend-admin@test.local'),
  ('a2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'suspend-mentor@test.local'),
  ('a3333333-cccc-cccc-cccc-cccccccccccc', 'suspend-mentee@test.local'),
  ('a4444444-dddd-dddd-dddd-dddddddddddd', 'suspend-target@test.local');

update profiles set role='admin', group_id=null
  where id='a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
update profiles set role='mentor', group_id='33333333-3333-3333-3333-333333333333'
  where id='a2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
update profiles set role='mentee', group_id='33333333-3333-3333-3333-333333333333'
  where id='a3333333-cccc-cccc-cccc-cccccccccccc';
update profiles set role='mentee', group_id='33333333-3333-3333-3333-333333333333'
  where id='a4444444-dddd-dddd-dddd-dddddddddddd';

-- helper ---------------------------------------------------------------------

create or replace function _as(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
end $$;

-- ---------- tests -----------------------------------------------------------

-- 1. mentee cannot call the RPC
select _as('a3333333-cccc-cccc-cccc-cccccccccccc');
select throws_ok(
  $$ select admin_set_profile_deleted('a4444444-dddd-dddd-dddd-dddddddddddd', true) $$,
  '42501',
  'forbidden: admin only',
  'mentee cannot suspend another user'
);

-- 2. mentor cannot call the RPC
select _as('a2222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
select throws_ok(
  $$ select admin_set_profile_deleted('a4444444-dddd-dddd-dddd-dddddddddddd', true) $$,
  '42501',
  'forbidden: admin only',
  'mentor cannot suspend another user'
);

-- 3. admin can suspend a target
select _as('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select lives_ok(
  $$ select admin_set_profile_deleted('a4444444-dddd-dddd-dddd-dddddddddddd', true) $$,
  'admin can suspend target without error'
);

-- 4. target.deleted_at is now set
select isnt(
  (select deleted_at from profiles where id = 'a4444444-dddd-dddd-dddd-dddddddddddd'),
  null,
  'target profile.deleted_at is set after suspend'
);

-- 5. admin can unsuspend (clear deleted_at)
select lives_ok(
  $$ select admin_set_profile_deleted('a4444444-dddd-dddd-dddd-dddddddddddd', false) $$,
  'admin can unsuspend target without error'
);

-- 6. target.deleted_at is back to null
select is(
  (select deleted_at from profiles where id = 'a4444444-dddd-dddd-dddd-dddddddddddd'),
  null,
  'target profile.deleted_at cleared after unsuspend'
);

-- 7. admin cannot suspend themselves (lockout guard)
select throws_ok(
  $$ select admin_set_profile_deleted('a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true) $$,
  '22023',
  'cannot suspend yourself',
  'admin cannot self-suspend'
);

select * from finish();
rollback;
