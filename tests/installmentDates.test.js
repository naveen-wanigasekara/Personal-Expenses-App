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
