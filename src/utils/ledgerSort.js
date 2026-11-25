const timestamp = value => { const time = Date.parse(value); return Number.isFinite(time) ? time : -Infinity; };
export function compareLedgerTransactions(a,b) {
  return b.date.localeCompare(a.date) || (timestamp(b.createdAt)-timestamp(a.createdAt)) || a.id.localeCompare(b.id);
}
