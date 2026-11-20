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

// Saved transactions are authoritative. Never recreate a moved/deleted charge
// in its original month; month-only fallback is for legacy plans with no rows.
export function installmentOccurrences(plan, transactions) {
  const rows = Array.isArray(transactions) ? transactions.filter(row => row.installmentId === plan.id && row.type === 'card-purchase') : null;
  if (rows === null) return Array.from({ length: Number(plan.totalMonths) }, (_, index) => ({
    id: `ptx_${plan.id}_${index}`, index, date: installmentDate(plan, index), amount: Number(plan.monthlyAmount), cardId: plan.cardId,
  }));
  return rows.filter(row => validDate(row.date)).map(row => {
    const prefix = `ptx_${plan.id}_`;
    const suffix = row.id?.startsWith(prefix) ? row.id.slice(prefix.length) : '';
    const [year, month] = row.date.split('-').map(Number);
    const [startYear, startMonth] = plan.startMonth.split('-').map(Number);
    const index = /^\d+$/.test(suffix) ? Number(suffix) : Math.max(0, (year - startYear) * 12 + month - startMonth);
    return { ...row, index };
  }).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function revisedInstallments(plan, updates, transactions, currentMonth) {
  const rows = transactions.filter(row => row.installmentId === plan.id);
  const history = rows.filter(row => row.date.slice(0, 7) <= currentMonth);
  const occurrences = installmentOccurrences(plan, transactions);
  const byIndex = new Map(occurrences.map(row => [row.index, row]));
  const future = [];
  for (let index = 0; index < Number(updates.totalMonths); index++) {
    const existing = byIndex.get(index);
    if (existing && existing.date.slice(0, 7) <= currentMonth) continue;
    // Missing saved rows may have been deliberately deleted. Only extend a
    // real schedule, or reconstruct an entirely month-only legacy schedule.
    if (!existing && rows.length && index < Number(plan.totalMonths)) continue;
    const date = existing?.date || installmentDate(plan, index);
    if (date.slice(0, 7) <= currentMonth) continue;
    future.push({ id: existing?.id || `ptx_${plan.id}_${index}`, type: 'card-purchase',
      amount: Number(updates.monthlyAmount), category: updates.category, cardId: updates.cardId,
      note: updates.label, date, installmentId: plan.id });
  }
  return { history, future, total: Math.round([...history, ...future].reduce((sum, row) => sum + Math.round(Number(row.amount) * 100), 0)) / 100 };
}
