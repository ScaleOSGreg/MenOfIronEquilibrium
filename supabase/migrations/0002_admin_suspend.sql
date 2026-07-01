-- ============================================================================
--  Admin: suspend / unsuspend a profile (soft-delete via deleted_at).
--
--  Admins manage roster membership without a service-role key by calling this
--  RPC from the browser. The function runs as security definer so it can
--  update other users' profile rows, but enforces:
--    * caller must be admin (current_role_is from 0001_init.sql)
--    * caller cannot suspend themselves (avoids accidental lockout)
--
--  Soft-delete only. To hard-delete a user (cascading auth.users -> profile ->
--  goals -> markers -> photos) still go through Supabase auth admin API.
-- ============================================================================

create or replace function admin_set_profile_deleted(target_id uuid, is_deleted boolean)
returns void
security definer
set search_path = public
language plpgsql
as $$
begin
  if not current_role_is('admin') then
    raise exception 'forbidden: admin only' using errcode = '42501';
  end if;
  if target_id = auth.uid() then
    raise exception 'cannot suspend yourself' using errcode = '22023';
  end if;
  if is_deleted then
    update profiles set deleted_at = now() where id = target_id;
  else
    update profiles set deleted_at = null where id = target_id;
  end if;
end $$;

-- Tighten function exec privileges: anonymous can't call, authenticated can.
revoke all on function admin_set_profile_deleted(uuid, boolean) from public;
grant execute on function admin_set_profile_deleted(uuid, boolean) to authenticated;
