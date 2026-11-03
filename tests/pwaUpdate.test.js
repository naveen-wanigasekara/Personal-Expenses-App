import test from 'node:test';
import assert from 'node:assert/strict';
import {activateAppUpdate} from '../src/utils/pwaUpdate.js';
const mockWorker=(state)=>{
 const listeners=new Set();
 return {state, messages:[],addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),postMessage(message){this.messages.push(message);this.state='activated';for(const fn of [...listeners])fn();},change(state){this.state=state;for(const fn of [...listeners])fn();},listeners};
};
test('explicit refresh checks for updates before activating a waiting worker',async()=>{
 const worker=mockWorker('installed');let checked=false;
 await activateAppUpdate({update:async()=>{checked=true},waiting:worker});assert.equal(checked,true);assert.deepEqual(worker.messages,[{type:'SKIP_WAITING'}]);assert.equal(worker.listeners.size,0);
});
test('refresh waits for a downloading update to install and activate',async()=>{
 const worker=mockWorker('installing');const result=activateAppUpdate({update:async()=>{},installing:worker});await Promise.resolve();worker.change('installed');await result;assert.equal(worker.state,'activated');assert.equal(worker.listeners.size,0);
});
test('missing updates and rejected checks do not leave a pending wait',async()=>{
 await activateAppUpdate(null);await activateAppUpdate({update:async()=>{}});await assert.rejects(activateAppUpdate({update:async()=>{throw Error('offline')}}),/offline/);
});
test('stalled worker times out and removes its listener',async()=>{
 const worker=mockWorker('installing');await activateAppUpdate({update:async()=>{},installing:worker},5);assert.equal(worker.listeners.size,0);
});
