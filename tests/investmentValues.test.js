import test from 'node:test';import assert from 'node:assert/strict';
import { latestValuationValue, compareValuations } from '../src/utils/investmentValues.js';
test('same-day investment values are stable across database row ordering',()=>{
 const rows=[{id:'old',recordedDate:'2026-11-20',createdAt:'2026-11-20T10:00:00Z',value:100},{id:'new',recordedDate:'2026-11-20',createdAt:'2026-11-20T11:00:00Z',value:150}];
 assert.equal(latestValuationValue(rows),150);assert.equal(latestValuationValue([...rows].reverse()),150);assert.equal([...rows].sort(compareValuations).at(-1).value,150);
});
test('backfilled values cannot override a later recorded day and missing timestamps have a stable fallback',()=>{
 const rows=[{id:'val_100',recordedDate:'2026-11-20',value:150},{id:'val_200',recordedDate:'2026-11-19',value:200},{id:'val_300',recordedDate:'2026-11-20',value:170}];
 assert.equal(latestValuationValue(rows),170);assert.equal(latestValuationValue([...rows].reverse()),170);assert.equal(latestValuationValue([]),null);
});
