import { validDate } from './dateInput.js';
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

// The existing encrypted start_month text stores a full date for new plans.
// Legacy YYYY-MM values retain their original first-of-month schedule.
export function installmentStart(value) {
  return { startMonth: value.slice(0, 7), startDate: validDate(value) ? value : null };
}
export function installmentDate(plan, index) {
  const anchor = plan.startDate || `${plan.startMonth}-01`;
  const [year, month, day] = anchor.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + index, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return `${target.toISOString().slice(0, 7)}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}
