import {monthKey} from './format.js';
export function elapsedInstallments(plan, currentMonth = monthKey(new Date())) {
  const [sy,sm]=plan.startMonth.split('-').map(Number);
  const [cy,cm]=currentMonth.split('-').map(Number);
  return Math.max(0, Math.min((cy-sy)*12+cm-sm+1, plan.totalMonths));
}
export function validInstallmentMonths(months, billed = 0, existingTotal = 0) {
  const minimum = existingTotal > 0 ? Math.max(1, billed) : 2;
  const maximum = Math.max(120, existingTotal);
  return Number.isSafeInteger(months) && months >= minimum && months <= maximum;
}
// A descriptive edit covers every month unless future rows are being rebuilt.
export function installmentMetadataTargets(rows, currentMonth, scheduleChanged) {
  return scheduleChanged ? rows.filter(row => monthKey(row.date) <= currentMonth) : rows;
}
