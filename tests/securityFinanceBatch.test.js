import test from 'node:test';import assert from 'node:assert/strict';
import {createFinanceBatchStore} from '../src/utils/financeBatch.js';
const change={table:'investments',op:'update',id:'investment',data:{current_value:120}};
test('batch captures all stale-edit preconditions before yielding and refreshes snapshots only on success',async()=>{
 let captured;let store;
 const client={async rpc(name,{changes}){assert.equal(name,'apply_finance_changes');captured=changes;return {data:changes.map(c=>({table:c.table,id:c.id,row:{id:c.id,current_value:c.data.current_value}}))}}};
 store=createFinanceBatchStore(client,async data=>{store.remember('investments',{id:'investment',current_value:'changed-during-encryption'});return {...data,current_value:'enc2:120'}},{investments:['current_value']});
 store.remember('investments',{id:'investment',current_value:'enc2:100'});await store.commit([change]);assert.equal(captured[0].before.current_value,'enc2:100');assert.equal(captured[0].data.current_value,'enc2:120');
});
test('missing snapshots, partial acknowledgements and database rejection fail without REST fallback',async()=>{
 let called=0;const client={async rpc(){called++;return {data:[]}}};const store=createFinanceBatchStore(client,async d=>d,{investments:['current_value']});
 await assert.rejects(store.commit([change]),/Refresh/);assert.equal(called,0);
 store.remember('investments',{id:'investment'});await assert.rejects(store.commit([change]),/could not be confirmed/);assert.equal(called,1);
 client.rpc=async()=>({error:new Error('stale record')});await assert.rejects(store.commit([change]),/stale record/);
 store.clear();await assert.rejects(store.commit([change]),/Refresh/);
});
