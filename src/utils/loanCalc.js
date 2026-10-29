/** Fixed-rate, reducing-balance loan with monthly payments at period end.
 * Annual rate is a nominal percentage; fees and insurance are excluded.
 */
export function monthlyInstallment(principal, annualRate, months) {
  if (!Number.isFinite(principal) || principal <= 0 ||
      !Number.isFinite(annualRate) || annualRate < 0 ||
      !Number.isSafeInteger(months) || months < 1) return null;
  const rate = annualRate / 1200;
  // expm1/log1p retain precision at very small interest rates and long terms.
  const payment = rate === 0 ? principal / months
    : principal * (rate / -Math.expm1(-months * Math.log1p(rate)));
  return Number.isFinite(payment) && payment > 0 ? payment : null;
}

export function loanMonths(period, unit) {
  if (!Number.isFinite(period) || period <= 0 || !["years", "months"].includes(unit)) return null;
  const months = period * (unit === "years" ? 12 : 1);
  const rounded = Math.round(months);
  // Permit fractional years that represent whole months (e.g. 1.5 years).
  return Number.isSafeInteger(rounded) && rounded > 0 && Math.abs(months - rounded) < 1e-8
    ? rounded : null;
}

/** Totals use the unrounded payment; round only when displaying currency. */
export function loanEstimate(principal, annualRate, months) {
  const installment = monthlyInstallment(principal, annualRate, months);
  if (installment === null) return null;
  const totalInterest = annualRate === 0 ? 0 : Math.max(0, installment * months - principal);
  return Number.isFinite(totalInterest) ? { installment, totalInterest } : null;
}
