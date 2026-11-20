-- Additive: apply to dev first; existing records and balances are not rewritten.
begin;
alter table public.transactions add column if not exists account text;
alter table public.cards add column if not exists payment_due_date text;
create table if not exists public.money_records (
 id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 data text not null, created_at timestamptz not null default now()
);
create index if not exists money_records_user_idx on public.money_records(user_id);
alter table public.money_records enable row level security;
revoke all on public.money_records from public,anon;
grant select,insert,update,delete on public.money_records to authenticated;
create policy money_records_owner on public.money_records to authenticated
 using ((select auth.uid())=user_id and (select private.session_allowed()))
 with check ((select auth.uid())=user_id and (select private.session_allowed()));
create table if not exists private.money_revision(user_id uuid primary key references auth.users(id) on delete cascade, revision bigint not null default 0);
revoke all on private.money_revision from public,anon,authenticated;
create or replace function private.secure_finance_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  row_data jsonb;
  field text;
  limit_count integer;
  row_count bigint;
  delta bigint;
  state private.user_security;
  encrypted_columns jsonb := '{"transactions":["amount","category","note","date","account"],"money_records":["data"],"cards":["name","credit_limit","opening_balance","colors","payment_due_date"],"budgets":["income_total","income_categories","expense_total","expense_categories"],"installment_plans":["label","total_amount","monthly_amount","total_months","start_month","category"],"recurring_reminders":["label","amount","day_of_month","category"],"investments":["name","type","initial_amount","current_value","start_date","notes","interest_rate","payout_frequency","tenure_months"],"investment_valuations":["value","recorded_date","note"],"user_settings":["categories","currency","insights_layout","custom_charts","bank_details"]}';
begin
  -- Administrative data repair remains possible outside an authenticated API call.
  if uid is null and current_user in ('postgres','supabase_admin') and current_setting('role') in ('none','postgres','supabase_admin') then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  if uid is null or not private.session_allowed() then raise exception 'A valid verified session is required' using errcode='42501'; end if;
  if (tg_op <> 'INSERT' and old.user_id <> uid) or (tg_op <> 'DELETE' and new.user_id <> uid) then raise exception 'Record ownership cannot change' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  insert into private.user_security(user_id) values(uid) on conflict do nothing;
  select * into state from private.user_security where user_id=uid for update;
  if tg_when='BEFORE' and tg_op<>'DELETE' then
    row_data := to_jsonb(new);
    if octet_length(row_data::text)>262144 then raise exception 'Record exceeds the 256 KiB limit' using errcode='22023'; end if;
    if state.encryption_version>=2 then
      for field in select jsonb_array_elements_text(encrypted_columns->tg_table_name) loop
        if row_data->>field is not null and row_data->>field not like 'enc2:%' then raise exception 'Update the app before saving encrypted data' using errcode='22023'; end if;
      end loop;
    end if;
    -- Parent links must stay within the same account. Deletions are deliberately
    -- not cascaded: the transaction RPC removes children and parent together.
    if tg_table_name in ('transactions','installment_plans') and row_data->>'card_id' is not null and (tg_op='INSERT' or row_data->>'card_id' is distinct from to_jsonb(old)->>'card_id') then
      if not exists(select 1 from public.cards where id=row_data->>'card_id' and user_id=uid) then raise exception 'Card not found' using errcode='42501'; end if;
    end if;
    if tg_table_name='transactions' and row_data->>'installment_id' is not null and (tg_op='INSERT' or row_data->>'installment_id' is distinct from to_jsonb(old)->>'installment_id') then
      if not exists(select 1 from public.installment_plans where id=row_data->>'installment_id' and user_id=uid) then raise exception 'Installment not found' using errcode='42501'; end if;
    end if;
    if tg_table_name='investment_valuations' and (tg_op='INSERT' or row_data->>'investment_id' is distinct from to_jsonb(old)->>'investment_id') then
      if not exists(select 1 from public.investments where id=row_data->>'investment_id' and user_id=uid) then raise exception 'Investment not found' using errcode='42501'; end if;
    end if;
  end if;
  if tg_when='BEFORE' then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  if tg_op='INSERT' then
    limit_count := case tg_table_name when 'money_records' then 20000 when 'transactions' then 20000 when 'investment_valuations' then 20000 when 'cards' then 100 when 'budgets' then 600 when 'installment_plans' then 500 when 'recurring_reminders' then 500 when 'investments' then 1000 else 1 end;
    execute format('select count(*) from public.%I where user_id=$1',tg_table_name) into row_count using uid;
    if row_count>limit_count then raise exception 'Account record limit reached' using errcode='54000'; end if;
  end if;
  delta := case when tg_op='DELETE' then 0 else octet_length(to_jsonb(new)::text) end - case when tg_op='INSERT' then 0 else octet_length(to_jsonb(old)::text) end;
  if state.bytes_used+delta>52428800 then raise exception 'Account storage limit reached' using errcode='54000'; end if;
  if current_setting('ledger.encryption_upgrade',true) is distinct from 'on' then
    if state.minute_started<=now()-interval '1 minute' then state.writes:=0; state.minute_started:=now(); end if;
    if state.writes>=600 then raise exception 'Too many writes. Try again in a minute' using errcode='54000'; end if;
    state.writes:=state.writes+1;
  end if;
  update private.user_security set bytes_used=greatest(0,bytes_used+delta), writes=state.writes,minute_started=state.minute_started where user_id=uid;
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;

create or replace function private.finish_encryption_upgrade() returns void
language plpgsql security definer set search_path = '' as $$
declare t text; f text; fields jsonb; bad boolean;
  encrypted_columns jsonb := '{"transactions":["amount","category","note","date","account"],"money_records":["data"],"cards":["name","credit_limit","opening_balance","colors","payment_due_date"],"budgets":["income_total","income_categories","expense_total","expense_categories"],"installment_plans":["label","total_amount","monthly_amount","total_months","start_month","category"],"recurring_reminders":["label","amount","day_of_month","category"],"investments":["name","type","initial_amount","current_value","start_date","notes","interest_rate","payout_frequency","tenure_months"],"investment_valuations":["value","recorded_date","note"],"user_settings":["categories","currency","insights_layout","custom_charts","bank_details"]}';
begin
  if not private.session_allowed() then raise exception 'A verified session is required' using errcode='42501'; end if;
  for t,fields in select * from jsonb_each(encrypted_columns) loop
    for f in select jsonb_array_elements_text(fields) loop
      execute format('select exists(select 1 from public.%I where user_id=$1 and %I is not null and %I not like ''enc2:%%'')',t,f,f) into bad using auth.uid();
      if bad then raise exception 'Encryption upgrade is incomplete' using errcode='22023'; end if;
    end loop;
  end loop;
  insert into private.user_security(user_id,encryption_version) values(auth.uid(),3) on conflict(user_id) do update set encryption_version=3;
end;
$$;

create or replace function public.apply_finance_changes(changes jsonb, migration boolean default false, finalize boolean default true) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := auth.uid(); item jsonb; t text; operation text; identifier text; field text;
  payload jsonb; expected jsonb; current_row jsonb; result_row jsonb; results jsonb := '[]';
  cols text; select_cols text; predicate text; count_changed integer;
  columns_by_table jsonb := '{"transactions":["id","user_id","type","amount","category","card_id","note","date","installment_id","account"],"money_records":["id","user_id","data"],"cards":["id","user_id","name","credit_limit","opening_balance","colors","payment_due_date"],"budgets":["user_id","month_key","income_total","income_categories","expense_total","expense_categories"],"installment_plans":["id","user_id","card_id","label","total_amount","monthly_amount","total_months","start_month","category","active"],"recurring_reminders":["id","user_id","label","amount","day_of_month","category","active"],"investments":["id","user_id","name","type","initial_amount","current_value","start_date","notes","interest_rate","payout_frequency","tenure_months"],"investment_valuations":["id","user_id","investment_id","value","recorded_date","note"],"user_settings":["user_id","categories","currency","insights_layout","custom_charts","bank_details"]}';
begin
  if uid is null or not private.session_allowed() then raise exception 'A valid verified session is required' using errcode='42501'; end if;
  if jsonb_typeof(changes)<>'array' or changes is null then raise exception 'Invalid mutation batch' using errcode='22023'; end if;
  if jsonb_array_length(changes)>250 or octet_length(changes::text)>1048576 then raise exception 'Mutation batch is too large' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
  if migration then perform private.begin_encryption_upgrade(jsonb_array_length(changes)); perform set_config('ledger.encryption_upgrade','on',true); end if;
  for item in select * from jsonb_array_elements(changes) loop
    t:=item->>'table'; operation:=item->>'op'; identifier:=item->>'id'; payload:=item->'data'; expected:=item->'before';
    if not columns_by_table ? t or operation not in ('insert','update','delete') or operation is null or identifier is null or length(identifier)>200 then raise exception 'Unsupported mutation' using errcode='22023'; end if;
    if migration and operation<>'update' then raise exception 'Encryption migration may only update existing values' using errcode='22023'; end if;
    if operation<>'delete' then
      if jsonb_typeof(payload)<>'object' or payload is null then raise exception 'Invalid row data' using errcode='22023'; end if;
      for field in select jsonb_object_keys(payload) loop
        if not (columns_by_table->t) ? field then raise exception 'Unsupported column' using errcode='22023'; end if;
        if operation='update' and field in ('id','user_id','month_key') then raise exception 'Record identity cannot change' using errcode='42501'; end if;
        if migration and (field in ('id','user_id','month_key','card_id','investment_id','installment_id','active') or (field='type' and t<>'investments')) then raise exception 'Migration may only change ciphertext' using errcode='42501'; end if;
        if migration and payload->>field is not null and payload->>field not like 'enc2:%' then raise exception 'Invalid upgraded ciphertext' using errcode='22023'; end if;
      end loop;
      if payload ? 'user_id' and payload->>'user_id'<>uid::text then raise exception 'Record ownership cannot change' using errcode='42501'; end if;
    end if;
    predicate:=case t when 'budgets' then 'month_key=$2' when 'user_settings' then 'user_id::text=$2' else 'id=$2' end;
    if operation<>'insert' then
      execute format('select to_jsonb(r) from public.%I r where user_id=$1 and %s for update',t,predicate) into current_row using uid,identifier;
      if current_row is null then raise exception 'Record not found' using errcode='42501'; end if;
      if expected is null or expected is distinct from current_row then raise exception 'Records changed on another device. Refresh before saving' using errcode='40001'; end if;
      if migration then
        for field in select jsonb_object_keys(payload) loop
          if current_row->>field is null or current_row->>field like 'enc2:%' then raise exception 'Migration only accepts legacy fields' using errcode='22023'; end if;
        end loop;
      end if;
    end if;
    if operation='delete' then
      execute format('delete from public.%I where user_id=$1 and %s',t,predicate) using uid,identifier;
      get diagnostics count_changed=row_count;
      if count_changed<>1 then raise exception 'Record not found' using errcode='42501'; end if;
      result_row:=null;
    else
      if operation='insert' then
        payload:=payload || jsonb_build_object('user_id',uid);
        if t='budgets' then payload:=payload || jsonb_build_object('month_key',identifier);
        elsif t='user_settings' then
          if identifier<>uid::text then raise exception 'Invalid owner' using errcode='42501'; end if;
        else payload:=payload || jsonb_build_object('id',identifier); end if;
      end if;
      select string_agg(format('%I',k),',' order by k),string_agg(format('x.%I',k),',' order by k) into cols,select_cols from jsonb_object_keys(payload) k;
      if cols is null then raise exception 'Empty mutation' using errcode='22023'; end if;
      if operation='insert' then
        execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) x returning to_jsonb(%I.*)',t,cols,select_cols,t,t) into result_row using payload;
      else
        execute format('update public.%I set (%s)=(select %s from jsonb_populate_record(null::public.%I,$3) x) where user_id=$1 and %s returning to_jsonb(%I.*)',t,cols,select_cols,t,predicate,t) into result_row using uid,identifier,payload;
        if result_row is null then raise exception 'Record not found' using errcode='42501'; end if;
      end if;
    end if;
    results:=results || jsonb_build_array(jsonb_build_object('table',t,'id',identifier,'row',result_row));
  end loop;
  if migration then
    if finalize then perform private.finish_encryption_upgrade(); end if;
    perform set_config('ledger.encryption_upgrade','off',true);
  end if;
  return results;
end;
$$;
create trigger secure_finance_write before insert or update or delete on public.money_records for each row execute function private.secure_finance_write();
create trigger secure_finance_usage after insert or update or delete on public.money_records for each row execute function private.secure_finance_write();
-- Every old and new write invalidates stale balances on other devices.
create or replace function private.bump_money_revision() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into private.money_revision(user_id,revision) values(coalesce(new.user_id,old.user_id),1)
 on conflict(user_id) do update set revision=private.money_revision.revision+1;
 if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.bump_money_revision() from public,anon,authenticated;
create trigger money_revision after insert or update or delete on public.transactions for each row execute function private.bump_money_revision();
create trigger money_revision after insert or update or delete on public.cards for each row execute function private.bump_money_revision();
create trigger money_revision after insert or update or delete on public.money_records for each row execute function private.bump_money_revision();
-- The small definer helper accesses only the verified caller's private counter.
create or replace function private.current_money_revision() returns bigint
language plpgsql security definer set search_path='' as $$
begin
 if not private.session_allowed() then raise exception 'A valid verified session is required' using errcode='42501'; end if;
 return coalesce((select revision from private.money_revision where user_id=auth.uid()),0);
end;
$$;
revoke all on function private.current_money_revision() from public,anon;
grant execute on function private.current_money_revision() to authenticated;
create or replace function public.money_workspace() returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 if not private.session_allowed() then raise exception 'A valid verified session is required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 return jsonb_build_object('revision',private.current_money_revision(),
  'transactions',coalesce((select jsonb_agg(to_jsonb(t)) from public.transactions t where user_id=auth.uid()),'[]'::jsonb),
  'cards',coalesce((select jsonb_agg(to_jsonb(c)) from public.cards c where user_id=auth.uid()),'[]'::jsonb),
  'records',coalesce((select jsonb_agg(to_jsonb(r)) from public.money_records r where user_id=auth.uid()),'[]'::jsonb));
end;
$$;
revoke all on function public.money_workspace() from public,anon;
grant execute on function public.money_workspace() to authenticated;
create or replace function public.apply_money_changes(changes jsonb,expected_revision bigint) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare results jsonb;
begin
 if not private.session_allowed() then raise exception 'A valid verified session is required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if expected_revision is null or private.current_money_revision()<>expected_revision then
  raise exception 'Records changed on another device. Refresh before saving' using errcode='40001';
 end if;
 results:=public.apply_finance_changes(changes);
 return jsonb_build_object('results',results,'revision',private.current_money_revision());
end;
$$;
revoke all on function public.apply_money_changes(jsonb,bigint) from public,anon;
grant execute on function public.apply_money_changes(jsonb,bigint) to authenticated;
commit;
