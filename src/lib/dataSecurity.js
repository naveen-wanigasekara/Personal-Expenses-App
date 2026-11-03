import { encryptFields, decryptFields } from './crypto.js';

export const ENCRYPTED_FIELDS = {
  transactions: ['amount', 'category', 'note', 'date'],
  cards: ['name', 'credit_limit', 'opening_balance', 'colors'],
  budgets: ['income_total', 'income_categories', 'expense_total', 'expense_categories'],
  installment_plans: ['label', 'total_amount', 'monthly_amount', 'total_months', 'start_month', 'category'],
  recurring_reminders: ['label', 'amount', 'day_of_month', 'category'],
  investments: ['name', 'type', 'initial_amount', 'current_value', 'start_date', 'notes', 'interest_rate', 'payout_frequency', 'tenure_months'],
  investment_valuations: ['value', 'recorded_date', 'note'],
  user_settings: ['categories', 'currency', 'insights_layout', 'custom_charts', 'bank_details'],
};

// Existing ciphertext is replaced only if every expected source row still matches.
// Preflight decrypts every legacy value before any writes. Large accounts use
// resumable, bounded transactions; mixed v1/v2 data remains readable on retry.
export async function upgradeEncryption(client, userId) {
  const changes = [];
  for (const [table, fields] of Object.entries(ENCRYPTED_FIELDS)) {
    let offset = 0;
    while (true) {
      const query = client.from(table).select('*').eq('user_id', userId).order(table === 'user_settings' ? 'user_id' : table === 'budgets' ? 'month_key' : 'id').range(offset, offset + 499);
      const { data, error } = await query;
      if (error) throw error;
      for (const row of data || []) {
        const source = Object.fromEntries(fields.filter((field) => row[field] != null && !String(row[field]).startsWith('enc2:')).map((field) => [field, row[field]]));
        if (!Object.keys(source).length) continue;
        const plain = await decryptFields(source, Object.keys(source));
        changes.push({ table, op: 'update', id: table === 'budgets' ? row.month_key : table === 'user_settings' ? userId : row.id,
          before: row, data: await encryptFields(plain, Object.keys(source)) });
      }
      if ((data || []).length < 500) break;
      offset += 500;
    }
  }
  const batches = [];
  let batch = [], bytes = 0;
  for (const change of changes) {
    const size = new TextEncoder().encode(JSON.stringify(change)).length;
    if (size > 524288) throw new Error('An existing record is too large to upgrade safely. Contact support.');
    if (batch.length && (batch.length >= 100 || bytes + size > 524288)) { batches.push(batch); batch = []; bytes = 0; }
    batch.push(change); bytes += size;
  }
  if (batch.length || !batches.length) batches.push(batch);
  for (let i = 0; i < batches.length; i++) {
    const { error } = await client.rpc('apply_finance_changes', {
      changes: batches[i], migration: true, finalize: i === batches.length - 1,
    });
    if (error) throw error;
  }
}
