import test from 'node:test';
import assert from 'node:assert/strict';
import { compareLedgerTransactions } from '../src/utils/ledgerSort.js';
test('date takes precedence over creation time, then newest creation first', () => {
  const rows = [
    {id:'a',date:'2026-11-25',createdAt:'2026-11-25T08:00:00Z'},
    {id:'b',date:'2026-11-24',createdAt:'2026-11-26T08:00:00Z'},
    {id:'z',date:'2026-11-25',createdAt:'2026-11-25T09:00:00Z'},
    {id:'c',date:'2026-11-25'}
  ];
  assert.deepEqual(rows.sort(compareLedgerTransactions).map(r=>r.id),['z','a','c','b']);
});
test('equal or missing timestamps have deterministic order', () => {
  const rows = ['z','a'].map(id=>({id,date:'2026-11-25'}));
  assert.deepEqual(rows.sort(compareLedgerTransactions).map(r=>r.id),['a','z']);
});
