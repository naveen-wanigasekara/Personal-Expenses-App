import { installmentDate, installmentOccurrences } from './installments.js';
import { validDate, validMonth } from './dateInput.js';

export function offsetMonth(month, offset) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7);
}
function monthDate(month, day) {
  const [year, number] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return `${month}-${String(Math.min(last, Math.max(1, Number(day) || 1))).padStart(2, '0')}`;
}
export function paymentStatus(date, month, today) {
  if (date) return date < today ? 'overdue' : date === today ? 'due' : 'upcoming';
  return month === today.slice(0, 7) ? 'date-needed' : 'upcoming';
}

// These are reminders, not extra debts or inferred bank statement amounts.
// A card's configured next payment date is never extrapolated into future months.
export function buildPaymentNotifications({ cards = [], installmentPlans = [], recurringReminders = [], transactions = null, today,
  isCompleted = () => false, categoryForTransaction = transaction => transaction.category }) {
  const currentMonth = today.slice(0, 7), rows = [];
  const nextMonth = offsetMonth(currentMonth, 1);
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() + 20);
  const upcomingThrough = cutoff.toISOString().slice(0, 10);
  const cardById = new Map(cards.map(card => [card.id, card]));
  const add = row => {
    if (isCompleted(row.completionMonth || row.month, row.completionId) || (row.legacyCompletionId && isCompleted(row.completionMonth, row.legacyCompletionId))) return;
    rows.push({ ...row, id: `${row.type}:${row.sourceId}:${row.occurrenceId || row.month}:${row.date || 'month'}`, status: row.status || paymentStatus(row.date, row.month, today) });
  };
  for (const card of cards) {
    if (!(Number(card.currentBalance) > 0)) continue;
    const date = validDate(card.paymentDueDate) ? card.paymentDueDate : null;
    const month = date && date > today ? date.slice(0, 7) : currentMonth;
    add({ type: 'card', sourceId: card.id, title: card.name, amount: Number(card.currentBalance), date, month,
      completionId: `cc:${card.id}:${date || currentMonth}`, detail: 'Current outstanding balance', amountLabel: 'Outstanding' });
  }
  const recordedCategories = new Map();
  for (const transaction of transactions || []) {
    const month = transaction.date?.slice(0, 7);
    if (month === currentMonth || month === nextMonth) {
      if (!recordedCategories.has(month)) recordedCategories.set(month, new Set());
      recordedCategories.get(month).add(categoryForTransaction(transaction));
    }
  }
  for (const plan of installmentPlans) {
    if (!plan.active || !validMonth(plan.startMonth) || !Number.isInteger(Number(plan.totalMonths)) || plan.totalMonths < 1 || plan.totalMonths > 120) continue;
    for (const occurrence of installmentOccurrences(plan, transactions)) {
      const { date, index } = occurrence;
      const month = date.slice(0, 7);
      if (month < currentMonth || date > upcomingThrough) continue;
      const card = cardById.get(occurrence.cardId || plan.cardId);
      const cardSettled = card && Number(card.currentBalance) <= 0 && month === currentMonth;
      add({ type: 'installment', sourceId: plan.id, occurrenceId: occurrence.id, sequence: index + 1, totalMonths: plan.totalMonths,
        title: plan.label, amount: Number(occurrence.amount), date, month,
        completionMonth: installmentDate(plan, index).slice(0, 7),
        completionId: `inst:${plan.id}:${occurrence.id}`, legacyCompletionId: `inst:${plan.id}`,
        status: cardSettled ? 'scheduled' : undefined,
        detail: `${card?.name || 'Deleted card'} · Installment ${index + 1}/${plan.totalMonths}${cardSettled ? ' · Card balance settled' : ''}`, amountLabel: 'Installment' });
    }
  }
  for (const reminder of recurringReminders) {
    if (!reminder.active) continue;
    for (const month of [currentMonth, nextMonth]) {
      // Preserve the existing monthly category-based auto-dismiss behavior.
      if (reminder.category && recordedCategories.get(month)?.has(reminder.category)) continue;
      add({ type: 'other', sourceId: reminder.id, title: reminder.label, amount: Number(reminder.amount) > 0 ? Number(reminder.amount) : null,
        date: Number.isInteger(Number(reminder.dayOfMonth)) && Number(reminder.dayOfMonth) >= 1 && Number(reminder.dayOfMonth) <= 31 ? monthDate(month, reminder.dayOfMonth) : null, month, completionId: `rec:${reminder.id}`, detail: 'Recurring bill', amountLabel: 'Amount' });
    }
  }
  return rows.sort((a, b) => (a.date || `${a.month}-01`).localeCompare(b.date || `${b.month}-01`) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export function paymentNotificationSections(rows) {
  const due = row => row.status === 'overdue' || row.status === 'due';
  return [
    { id: 'due', title: 'Due Payments', rows: rows.filter(due) },
    { id: 'card', title: 'Monthly Credit Card (CC) Payments', rows: rows.filter(row => !due(row) && row.type === 'card') },
    { id: 'installment', title: 'Installment Payments', rows: rows.filter(row => !due(row) && row.type === 'installment') },
    { id: 'other', title: 'Other Upcoming Payments', rows: rows.filter(row => !due(row) && row.type === 'other') },
  ];
}
