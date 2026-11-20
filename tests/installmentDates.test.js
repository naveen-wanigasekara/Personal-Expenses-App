import test from 'node:test';
import assert from 'node:assert/strict';
import { installmentStart, installmentDate } from '../src/utils/installments.js';
const schedule = (value, count) => Array.from({length:count}, (_, index) => installmentDate(installmentStart(value), index));
test('new schedules start on the selected creation date and retain the day across years', () => {
  assert.deepEqual(schedule('2026-11-15', 3), ['2026-11-15','2026-12-15','2027-01-15']);
});
test('month-end schedules clamp short months without losing the original day', () => {
  assert.deepEqual(schedule('2027-01-31', 4), ['2027-01-31','2027-02-28','2027-03-31','2027-04-30']);
  assert.deepEqual(schedule('2028-01-31', 3), ['2028-01-31','2028-02-29','2028-03-31']);
});
test('saved date anchors survive reload and future schedule rebuilds', () => {
  const saved = JSON.parse(JSON.stringify({start_month:'2026-12-30'}));
  const plan = installmentStart(saved.start_month);
  assert.equal(plan.startMonth, '2026-12');
  assert.equal(plan.startDate, '2026-12-30');
  assert.equal(installmentDate(plan, 2), '2027-02-28');
  assert.equal(installmentDate(plan, 3), '2027-03-30');
});
test('legacy month-only plans keep first-of-month dates on reload and editing', () => {
  assert.deepEqual(installmentStart('2026-11'), {startMonth:'2026-11',startDate:null});
  assert.deepEqual(schedule('2026-11', 3), ['2026-11-01','2026-12-01','2027-01-01']);
});

import { revisedInstallments } from '../src/utils/installments.js';
const original={id:'p',startMonth:'2026-11',startDate:'2026-11-15',totalMonths:3,monthlyAmount:10000};
const charges=[0,1,2].map(index=>({id:`ptx_p_${index}`,type:'card-purchase',installmentId:'p',date:installmentDate(original,index),amount:10000}));
test('edited totals combine preserved billed charges with revised future amounts',()=>{
 const result=revisedInstallments(original,{totalMonths:4,monthlyAmount:12000},charges,'2026-11');
 assert.equal(result.total,46000);assert.equal(result.history[0].amount,10000);
 assert.deepEqual(result.future.map(r=>r.date),['2026-12-15','2027-01-15','2027-02-15']);
});
test('future edits keep moved occurrence IDs and dates without duplicating historical rows',()=>{
 const rows=charges.map((r,i)=>i===0?{...r,date:'2026-12-05'}:r);
 const result=revisedInstallments(original,{totalMonths:3,monthlyAmount:12000},rows,'2026-11');
 assert.equal(result.total,36000);assert.equal(result.future.find(r=>r.id==='ptx_p_0').date,'2026-12-05');
 assert.equal(new Set(result.future.map(r=>r.id)).size,3);
});
test('descriptive or duration edits do not recreate individually deleted charges',()=>{
 const result=revisedInstallments(original,{totalMonths:4,monthlyAmount:10000},charges.filter(r=>r.id!=='ptx_p_1'),'2026-11');
 assert.deepEqual(result.future.map(r=>r.id),['ptx_p_2','ptx_p_3']);assert.equal(result.total,30000);
});
