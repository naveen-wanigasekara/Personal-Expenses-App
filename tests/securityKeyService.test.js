import test from 'node:test';import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';
import {createKeyHandler} from '../server/key-service.js';
const uid='11111111-1111-4111-8111-111111111111';
const token=(claims)=>`e30.${Buffer.from(JSON.stringify({sub:uid,aal:'aal1',...claims})).toString('base64url')}.signature`;
const env={ENCRYPTION_MASTER_KEY:randomBytes(32).toString('base64url'),LEGACY_ENCRYPTION_SECRET:'synthetic-legacy',SUPABASE_URL:'https://preview-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public-test-key',VERCEL_ENV:'preview',PREVIEW_SUPABASE_PROJECT_REF:'preview-project',PRODUCTION_SUPABASE_PROJECT_REF:'production-project'};
async function call({method='POST',origin='https://app.example',authorization=`Bearer ${token()}`,configuration=env,user={id:uid},allowed=true,rateLimited=false,authError=null}={}) {
 let status,body;const headers={};let authCalled=false;
 const handler=createKeyHandler({env:configuration,clientFactory:()=>({auth:{async getUser(){authCalled=true;return {data:{user},error:authError}}},async rpc(){return {data:{allowed,rateLimited},error:null}}})});
 await handler({method,headers:{origin,host:'app.example',authorization}},{setHeader(k,v){headers[k]=v},status(s){status=s;return this},json(b){body=b}});
 return {status,body,headers,authCalled};
}
test('server key boundary rejects unauthenticated, cross-origin, unverified, revoked and misconfigured requests',async()=>{
 assert.equal((await call({method:'GET'})).status,405);assert.equal((await call({authorization:''})).status,401);const badOrigin=await call({origin:'https://evil.example'});assert.equal(badOrigin.status,403);assert.equal(badOrigin.authCalled,false);
 assert.equal((await call({authError:{message:'invalid'}})).status,401);assert.equal((await call({user:{id:'other'}})).status,401);
 assert.equal((await call({user:{id:uid,factors:[{status:'verified'}]}})).status,403);
 assert.equal((await call({allowed:false})).status,403);assert.equal((await call({allowed:false,rateLimited:true})).status,429);
 assert.equal((await call({configuration:{...env,PREVIEW_SUPABASE_PROJECT_REF:'production-project',SUPABASE_URL:'https://production-project.supabase.co'}})).status,503);
 assert.equal((await call({configuration:{...env,ENCRYPTION_MASTER_KEY:''}})).status,503);
 assert.equal((await call({configuration:{...env,PRODUCTION_SUPABASE_PROJECT_REF:undefined}})).status,503);
});
test('authenticated key delivery is stable, user-bound, not cacheable and never returns the master secret',async()=>{
 const one=await call(),two=await call();assert.equal(one.status,200);assert.equal(one.body.key,two.body.key);assert.equal(one.body.userId,uid);assert.equal(Buffer.from(one.body.key,'base64').length,32);assert.equal(one.headers['Cache-Control'],'no-store, private');assert.ok(one.body.legacyKey);assert.ok(!JSON.stringify(one.body).includes(env.ENCRYPTION_MASTER_KEY));assert.ok(!JSON.stringify(one.body).includes(env.LEGACY_ENCRYPTION_SECRET));
 const other='22222222-2222-4222-8222-222222222222';const next=await call({authorization:`Bearer ${token({sub:other})}`,user:{id:other}});assert.equal(next.status,200);assert.notEqual(next.body.key,one.body.key);
 assert.equal((await call({authorization:`Bearer ${token({aal:'aal2'})}`,user:{id:uid,factors:[{status:'verified'}]}})).status,200);
});
