export function matchesTransactionAmount(amount, query, currency = '') {
  const raw = query.trim();
  if (!raw) return false;
  const prefix = currency.trim();
  const withoutCurrency = prefix && raw.toLowerCase().startsWith(prefix.toLowerCase())
    ? raw.slice(prefix.length).trim() : raw;
  // Only normalize number-shaped queries; notes containing digits remain text.
  if (!/^\d[\d,]*(?:\.\d{0,2})?$/.test(withoutCurrency)) return false;
  const numeric = withoutCurrency.replaceAll(',', '');
  if (withoutCurrency.includes('.') || withoutCurrency.includes(',') || withoutCurrency !== raw) {
    return Number(amount) === Number(numeric);
  }
  return String(amount).includes(numeric);
}
