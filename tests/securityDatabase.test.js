import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
const SA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', SB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
async function setup() {
  const db=new PGlite();
  await db.exec(`create role anon; create role authenticated;
    create schema auth; grant usage on schema auth to anon,authenticated;
    create table auth.users(id uuid primary key);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users);
    create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users,status text);
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    insert into auth.users values('${A}'),('${B}');
    insert into auth.sessions values('${SA}','${A}'),('${SB}','${B}');`);
  await db.exec(readFileSync(new URL('../db/schema.sql',import.meta.url),'utf8'));
  await db.exec(readFileSync(new URL('../db/schema_migration.sql',import.meta.url),'utf8'));
  await db.exec('grant select,insert,update,delete,truncate,references,trigger on all tables in schema public to anon,authenticated');
  await db.exec(readFileSync(new URL('../db/security_hardening.sql',import.meta.url),'utf8'));
  return db;
}
async function as(db,user=A,aal='aal1',session=user===A?SA:SB) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claims',$1,false)`,[JSON.stringify({sub:user,aal,session_id:session})]);
  await db.exec('set role authenticated');
}
async function rpc(db,changes,migration=false,finalize=true) {
  return (await db.query('select public.apply_finance_changes($1::jsonb,$2,$3) as result',[JSON.stringify(changes),migration,finalize])).rows[0].result;
}
const insert=(table,id,data)=>({table,op:'insert',id,data});
const tx=(id,extra={})=>insert('transactions',id,{type:'income',amount:'enc2:test',date:'enc2:test',note:'enc2:test',...extra});
const row=async(db,table,id)=>(await db.query(`select to_jsonb(r) as row from public.${table} r where id=$1`,[id])).rows[0]?.row;

test('migration upgrades encrypted investment types while preserving transaction type identity',async(t)=>{
  const db=await setup();t.after(()=>db.close());
  await db.query("insert into public.investments(id,user_id,name,type,initial_amount,current_value) values('legacy-investment',$1,'enc2:name','Stocks','enc2:initial','enc2:current')",[A]);
  await db.query("insert into public.transactions(id,user_id,type,amount,date,note) values('legacy-tx',$1,'income','enc2:amount','enc2:date','enc2:note')",[A]);
  await as(db);
  await rpc(db,[{table:'investments',op:'update',id:'legacy-investment',before:await row(db,'investments','legacy-investment'),data:{type:'enc2:stocks'}}],true);
  assert.equal((await row(db,'investments','legacy-investment')).type,'enc2:stocks');
  await db.exec('reset role');await db.query('update private.user_security set encryption_version=1 where user_id=$1',[A]);await as(db);
  await assert.rejects(rpc(db,[{table:'transactions',op:'update',id:'legacy-tx',before:await row(db,'transactions','legacy-tx'),data:{type:'enc2:income'}}],true),/Migration may only change ciphertext/);
});

test('database security: owner boundaries, rollback, stale data, quotas, MFA and revocation',async(t)=>{
  const db=await setup(); t.after(()=>db.close());
  await as(db);
  await t.test('legitimate insert and transactional encryption finalization',async()=>{
    await rpc(db,[tx('own')]);
    await rpc(db,[],true);
    assert.equal((await row(db,'transactions','own')).user_id,A);
  });
  await t.test('anonymous access denied and another user cannot read or mutate owner rows',async()=>{
    await db.exec('reset role; set role anon');
    await assert.rejects(db.query('select * from public.transactions'),/permission denied/);
    await as(db,B);
    assert.equal((await db.query('select count(*)::int as n from public.transactions')).rows[0].n,0);
    await assert.rejects(rpc(db,[{table:'transactions',op:'delete',id:'own',before:{}}]),/Record not found/);
    await assert.rejects(rpc(db,[tx('forged',{user_id:A})]),/ownership/);
    await as(db);
  });
  await t.test('a late batch failure rolls back all earlier inserts',async()=>{
    await assert.rejects(rpc(db,[tx('rollback'),{table:'investments',op:'update',id:'missing',before:{},data:{name:'enc2:test'}}]),/Record not found/);
    assert.equal(await row(db,'transactions','rollback'),undefined);
  });
  await t.test('stale snapshots fail and roll back related mutations',async()=>{
    const before=await row(db,'transactions','own');
    await rpc(db,[{table:'transactions',op:'update',id:'own',before,data:{note:'enc2:changed'}}]);
    await assert.rejects(rpc(db,[tx('stale-child'),{table:'transactions',op:'update',id:'own',before,data:{note:'enc2:stale'}}]),/another device/);
    assert.equal(await row(db,'transactions','stale-child'),undefined);
  });
  await t.test('unsupported tables, identity changes, and oversized batches rejected',async()=>{
    await assert.rejects(rpc(db,[insert('auth.users','x',{})]),/Unsupported mutation/);
    await assert.rejects(rpc(db,[{table:'transactions',op:'update',id:'own',before:await row(db,'transactions','own'),data:{user_id:B}}]),/identity cannot change/);
    await assert.rejects(rpc(db,Array.from({length:251},(_,i)=>tx(`many-${i}`))),/too large/);
  });
  await t.test('direct API writes cannot bypass ciphertext or payload restrictions',async()=>{
    await assert.rejects(db.query('update public.transactions set note=$1 where id=$2',['plaintext','own']),/Update the app/);
    await assert.rejects(db.query('update public.transactions set note=$1 where id=$2',['enc2:'+ 'a'.repeat(270000),'own']),/256 KiB/);
  });
  await t.test('cross-owner parent references are rejected',async()=>{
    await as(db,B); await rpc(db,[insert('cards','other-card',{name:'enc2:test',credit_limit:'enc2:test',opening_balance:'enc2:test'})]);
    await as(db);
    await assert.rejects(rpc(db,[tx('bad-card',{card_id:'other-card'})]),/Card not found/);
    await assert.rejects(rpc(db,[insert('investment_valuations','bad-investment',{investment_id:'absent',value:'enc2:test',recorded_date:'enc2:test'})]),/Investment not found/);
  });
  await t.test('repeated settings/card upserts preserve edits and exact storage usage',async()=>{
    await db.query("insert into public.user_settings(user_id,currency,bank_details) values($1,'enc2:currency','enc2:banks') on conflict(user_id) do update set currency=excluded.currency,bank_details=excluded.bank_details",[A]);
    await db.exec('reset role');
    const usageBefore=(await db.query('select bytes_used from private.user_security where user_id=$1',[A])).rows[0].bytes_used;
    await as(db);
    for(let i=0;i<4;i++) await db.query("insert into public.user_settings(user_id,currency,bank_details) values($1,'enc2:currency','enc2:banks') on conflict(user_id) do update set currency=excluded.currency,bank_details=excluded.bank_details",[A]);
    await db.exec('reset role');
    assert.equal((await db.query('select bytes_used from private.user_security where user_id=$1',[A])).rows[0].bytes_used,usageBefore);
    await as(db);
  });
  await t.test('deleted-card history remains editable without accepting new foreign references',async()=>{
    await rpc(db,[insert('cards','deleted-card',{name:'enc2:test',credit_limit:'enc2:test',opening_balance:'enc2:test'}),tx('history',{card_id:'deleted-card'})]);
    await rpc(db,[{table:'cards',op:'delete',id:'deleted-card',before:await row(db,'cards','deleted-card')}]);
    await rpc(db,[{table:'transactions',op:'update',id:'history',before:await row(db,'transactions','history'),data:{note:'enc2:edited'}}]);
    assert.equal((await row(db,'transactions','history')).note,'enc2:edited');
    await assert.rejects(rpc(db,[tx('new-orphan',{card_id:'deleted-card'})]),/Card not found/);
  });
  await t.test('direct writes cannot bypass per-table, storage or write-rate quotas',async()=>{
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims','{}',false)");
    await db.query("insert into public.cards(id,user_id,name,credit_limit,opening_balance) select 'quota-card-'||n,$1,'enc2:test','enc2:test','enc2:test' from generate_series(1,100) n",[A]);
    await as(db);
    await assert.rejects(rpc(db,[insert('cards','over-quota',{name:'enc2:test',credit_limit:'enc2:test',opening_balance:'enc2:test'})]),/record limit/);
    await db.exec('reset role');
    await db.query('update private.user_security set bytes_used=52428800 where user_id=$1',[A]);
    await as(db);await assert.rejects(rpc(db,[tx('over-storage')]),/storage limit/);
    await db.exec('reset role');
    await db.query('update private.user_security set bytes_used=0,writes=600,minute_started=now() where user_id=$1',[A]);
    await as(db);await assert.rejects(rpc(db,[tx('rate-limit')]),/Too many writes/);
    await db.exec('reset role');await db.query('update private.user_security set writes=0 where user_id=$1',[A]);await as(db);
  });
  await t.test('key delivery is rate-limited per authenticated account without weakening data access',async()=>{
    for(let i=0;i<20;i++) assert.equal((await db.query('select public.authorize_key_access() as result')).rows[0].result.allowed,true);
    const blocked=(await db.query('select public.authorize_key_access() as result')).rows[0].result;
    assert.equal(blocked.allowed,false);assert.equal(blocked.rateLimited,true);assert.ok(await row(db,'transactions','own'));
  });
  await t.test('MFA is enforced at direct database and RPC boundaries',async()=>{
    await db.exec('reset role'); await db.query('insert into auth.mfa_factors values($1,$2,$3)',['cccccccc-cccc-4ccc-8ccc-cccccccccccc',A,'verified']);
    await as(db);
    assert.equal((await db.query('select count(*)::int as n from public.transactions')).rows[0].n,0);
    await assert.rejects(rpc(db,[tx('unverified')]),/verified session/);
    await as(db,A,'aal2'); assert.ok(await row(db,'transactions','own'));
    assert.equal((await db.query('select public.security_session_status() as allowed')).rows[0].allowed,true);
  });
  await t.test('a revoked session immediately loses database access',async()=>{
    await db.exec('reset role'); await db.query('delete from auth.sessions where id=$1',[SA]);
    await as(db,A,'aal2');
    assert.equal((await db.query('select count(*)::int as n from public.transactions')).rows[0].n,0);
    assert.equal((await db.query('select public.security_session_status() as allowed')).rows[0].allowed,false);
    await assert.rejects(rpc(db,[tx('revoked')]),/verified session/);
  });
});

test('legacy encryption migration rejects partial upgrades without marking completion',async(t)=>{
 const db=await setup();t.after(()=>db.close());await as(db);
 await rpc(db,[tx('legacy',{amount:'enc:legacy'})]);
 const before=await row(db,'transactions','legacy');
 await assert.rejects(rpc(db,[],true),/incomplete/);
 assert.equal((await row(db,'transactions','legacy')).amount,'enc:legacy');
 await rpc(db,[{table:'transactions',op:'update',id:'legacy',before,data:{amount:'enc2:upgraded'}}],true);
 await assert.rejects(db.query("update public.transactions set amount='enc:old' where id='legacy'"),/Update the app/);
 await assert.rejects(rpc(db,[{table:'transactions',op:'update',id:'legacy',before:await row(db,'transactions','legacy'),data:{amount:'enc2:rate-bypass'}}],true),/already upgraded/);
});


test('large migration can resume bounded batches while blocking legacy and rate-bypass writes',async(t)=>{
 const db=await setup();t.after(()=>db.close());await as(db);
 await rpc(db,[tx('one',{amount:'enc:one'}),tx('two',{amount:'enc:two'})]);
 await rpc(db,[{table:'transactions',op:'update',id:'one',before:await row(db,'transactions','one'),data:{amount:'enc2:one'}}],true,false);
 await assert.rejects(db.query("update public.transactions set note='enc:old' where id='one'"),/Update the app/);
 await assert.rejects(rpc(db,[{table:'transactions',op:'update',id:'one',before:await row(db,'transactions','one'),data:{amount:'enc2:again'}}],true,false),/only accepts legacy/);
 await assert.rejects(rpc(db,[],true,true),/incomplete/);
 await rpc(db,[{table:'transactions',op:'update',id:'two',before:await row(db,'transactions','two'),data:{amount:'enc2:two'}}],true,true);
 assert.equal((await row(db,'transactions','one')).amount,'enc2:one');
 assert.equal((await row(db,'transactions','two')).amount,'enc2:two');
});
