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
  await db.exec(readFileSync(new URL('../db/money_lending.sql',import.meta.url),'utf8'));
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


test('money schema preserves old rows, enforces ownership, encryption, sessions and atomic revisions',async(t)=>{
 const db=await setup();t.after(()=>db.close());await as(db);
 await rpc(db,[tx('legacy')]);await rpc(db,[],true);
 const workspace=async()=>(await db.query('select public.money_workspace() as result')).rows[0].result;
 const write=async(changes,rev)=>(await db.query('select public.apply_money_changes($1::jsonb,$2) as result',[JSON.stringify(changes),rev])).rows[0].result;
 const before=await workspace();assert.equal(before.transactions.length,1);assert.equal(before.records.length,0);
 const result=await write([insert('money_records','loan',{data:'enc2:loan'})],before.revision);
 assert.ok(Number(result.revision)>Number(before.revision));assert.equal((await workspace()).transactions.length,1);
 await assert.rejects(write([insert('money_records','stale',{data:'enc2:stale'})],before.revision),/another device/);
 assert.equal(await row(db,'money_records','stale'),undefined);
 const v=(await workspace()).revision;
 await assert.rejects(write([insert('money_records','rollback',{data:'enc2:loan'}),tx('bad',{amount:'plain'})],v),/Update the app/);
 assert.equal(await row(db,'money_records','rollback'),undefined);assert.equal((await workspace()).revision,v);
 const owned=await row(db,'money_records','loan');
 await as(db,B);assert.equal((await workspace()).records.length,0);
 await assert.rejects(rpc(db,[{table:'money_records',op:'update',id:'loan',before:owned,data:{data:'enc2:other'}}]),/Record not found/);
 await assert.rejects(rpc(db,[insert('money_records','forged',{user_id:A,data:'enc2:forged'})]),/ownership/);
 await as(db);await assert.rejects(db.query("update public.money_records set data='plain' where id='loan'"),/Update the app/);
 // Direct legacy writes also invalidate the revision: old clients cannot make
 // a new client's cached savings balance silently overwrite updated data.
 const rev=(await workspace()).revision;await rpc(db,[tx('legacy-other-device')]);
 await assert.rejects(write([insert('money_records','after-old-write',{data:'enc2:test'})],rev),/another device/);
 await db.exec('reset role; set role anon');await assert.rejects(db.query('select public.money_workspace()'),/permission denied/);
 await as(db,B);await rpc(db,[insert('money_records','cleanup-B',{data:'enc2:test'})]);
 await db.exec('reset role');await db.query("select set_config('request.jwt.claims','{}',false)");
 await db.query('delete from auth.sessions where user_id=$1',[B]);
 await db.query('delete from auth.users where id=$1',[B]);
 assert.equal((await db.query('select count(*)::int as n from private.money_revision where user_id=$1',[B])).rows[0].n,0);
 await as(db);await db.exec('reset role');await db.query('delete from auth.sessions where id=$1',[SA]);await as(db);
 await assert.rejects(db.query('select public.money_workspace()'),/verified session/);
});
