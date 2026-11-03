import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, webcrypto, pbkdf2Sync } from 'node:crypto';
import { initCrypto, clearCrypto, encryptValue, decryptValue } from '../src/lib/crypto.js';
import { upgradeEncryption, ENCRYPTED_FIELDS } from '../src/lib/dataSecurity.js';

const user='11111111-1111-4111-8111-111111111111';
const key=randomBytes(32).toString('base64');
const legacyKey=pbkdf2Sync(user+'synthetic-legacy-secret',user,100000,32,'sha256').toString('base64');
const unlock=(id=user,k=key,legacy=legacyKey)=>initCrypto(id,{accessToken:'synthetic-token',fetcher:async()=>({ok:true,json:async()=>({userId:id,version:2,key:k,legacyKey:legacy})})});
async function oldCipher(value) {
 const k=await webcrypto.subtle.importKey('raw',Buffer.from(legacyKey,'base64'),'AES-GCM',false,['encrypt']);
 const iv=randomBytes(12); const ct=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(JSON.stringify(value)));
 return `enc:${iv.toString('base64')}.${Buffer.from(ct).toString('base64')}`;
}
test('versioned encryption: random IV, real legacy compatibility, authentication, logout race',async(t)=>{
 t.after(clearCrypto);await unlock();
 const a=await encryptValue({amount:100.25,note:'synthetic'}), b=await encryptValue({amount:100.25,note:'synthetic'});
 assert.match(a,/^enc2:/);assert.notEqual(a,b);assert.deepEqual(await decryptValue(a),{amount:100.25,note:'synthetic'});
 assert.equal(await decryptValue(await oldCipher(123.45)),123.45);
 await assert.rejects(decryptValue('enc2:corrupt.invalid'),/could not be decrypted/);
 await unlock('22222222-2222-4222-8222-222222222222');await assert.rejects(decryptValue(a),/could not be decrypted/);
 await unlock(user,randomBytes(32).toString('base64'));await assert.rejects(decryptValue(a),/could not be decrypted/);
 clearCrypto();await assert.rejects(encryptValue('x'),/locked/);
 let release;const pending=initCrypto(user,{accessToken:'t',fetcher:()=>new Promise(r=>{release=r})});clearCrypto();release({ok:true,json:async()=>({userId:user,version:2,key})});await assert.rejects(pending,/Session changed/);await assert.rejects(encryptValue('x'),/locked/);
});
test('key acquisition fails closed for wrong identity, HTTP failure and invalid keys',async()=>{
 await assert.rejects(initCrypto(user,{accessToken:'t',fetcher:async()=>({ok:false,status:401})}),/expired/);
 await assert.rejects(initCrypto(user,{accessToken:'t',fetcher:async()=>({ok:true,json:async()=>({userId:'other',version:2,key})})}),/Invalid encryption/);
 await assert.rejects(unlock(user,Buffer.from('short').toString('base64')),/Invalid encryption key/);
 clearCrypto();
});
test('migration covers bank details and refuses to write anything after a failed decryption',async()=>{
 await unlock();let called=false;
 const client={from(table){return {select(){return this},eq(){return this},order(){return this},async range(){return {data:table==='transactions'?[{id:'bad',user_id:user,amount:'enc:broken'}]:[],error:null}}}},async rpc(){called=true;return {error:null}}};
 await assert.rejects(upgradeEncryption(client,user),/could not be decrypted/);assert.equal(called,false);assert.ok(ENCRYPTED_FIELDS.user_settings.includes('bank_details'));clearCrypto();
});
test('migration preserves source snapshots and upgrades every encrypted field atomically',async()=>{
 await unlock();const old=await oldCipher([{id:'bank',bank:'Synthetic Bank',accountNumber:'00001'}]);let batch;
 const row={user_id:user,bank_details:old,currency:'"Rs."'};
 const client={from(table){return {select(){return this},eq(){return this},order(){return this},async range(){return {data:table==='user_settings'?[row]:[],error:null}}}},async rpc(name,args){assert.equal(name,'apply_finance_changes');assert.equal(args.migration,true);batch=args.changes;return {error:null}}};
 await upgradeEncryption(client,user);assert.equal(batch.length,1);assert.deepEqual(batch[0].before,row);assert.match(batch[0].data.bank_details,/^enc2:/);assert.deepEqual(await decryptValue(batch[0].data.bank_details),[{id:'bank',bank:'Synthetic Bank',accountNumber:'00001'}]);clearCrypto();
});


test('more than 20,000 legacy rows are split into bounded resumable transactions',async()=>{
 await unlock();let calls=0,total=0;
 const rows=Array.from({length:20001},(_,i)=>({id:`tx-${i}`,user_id:user,amount:'1'}));
 const client={from(table){return {select(){return this},eq(){return this},order(){return this},async range(from,to){return {data:table==='transactions'?rows.slice(from,to+1):[],error:null}}}},async rpc(name,args){calls++;total+=args.changes.length;assert.ok(args.changes.length<=100);assert.ok(new TextEncoder().encode(JSON.stringify(args.changes)).length<1048576);assert.equal(args.finalize,total===rows.length);return {error:null}}};
 await upgradeEncryption(client,user);assert.equal(total,20001);assert.ok(calls>200);clearCrypto();
});
