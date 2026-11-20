-- Apply after money_lending.sql if that migration has already run.
create or replace function private.bump_money_revision() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 -- During auth-user deletion, cascades must not recreate a revision for the
 -- account whose parent row is already gone.
 if not exists(select 1 from auth.users where id=coalesce(new.user_id,old.user_id)) then
  if tg_op='DELETE' then return old; else return new; end if;
 end if;
 insert into private.money_revision(user_id,revision) values(coalesce(new.user_id,old.user_id),1)
 on conflict(user_id) do update set revision=private.money_revision.revision+1;
 if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.bump_money_revision() from public,anon,authenticated;
