// Fixed Deposit is treated as a non-cumulative interest instrument: the
// principal (current value) never grows on its own — interest is calculated
// and paid out separately per period, exactly like a real FD/interest-bearing
// loan. Every other investment type keeps the generic manual value-tracking
// model, since their value isn't predictable from a formula.

export const FD_PAYOUT_FREQUENCIES = [
  { id: "monthly", label: "Monthly", perLabel: "month", periodsPerYear: 12 },
  {
    id: "quarterly",
    label: "Quarterly",
    perLabel: "quarter",
    periodsPerYear: 4,
  },
  {
    id: "semi-annually",
    label: "Semi-Annually",
    perLabel: "half-year",
    periodsPerYear: 2,
  },
  { id: "annually", label: "Annually", perLabel: "year", periodsPerYear: 1 },
  { id: "maturity", label: "At Maturity", perLabel: null, periodsPerYear: null },
];

export function getPayoutFrequency(id) {
  return (
    FD_PAYOUT_FREQUENCIES.find((f) => f.id === id) || FD_PAYOUT_FREQUENCIES[0]
  );
}

export function isFixedDeposit(investment) {
  return investment?.type === "Fixed Deposit";
}

function addMonths(dateStr, months) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const date = new Date(target.getFullYear(), target.getMonth(), Math.min(d, lastDay));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthsBetween(fromStr, toStr) {
  const [fy, fm] = fromStr.split("-").map(Number);
  const [ty, tm] = toStr.split("-").map(Number);
  let months = (ty - fy) * 12 + (tm - fm);
  if (months >= 0 && addMonths(fromStr, months) > toStr) months -= 1;
  return Math.max(0, months);
}

function todayStr(today) {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

// Returns everything the UI needs to describe a Fixed Deposit's interest
// schedule: maturity date, matured status, per-period payout, interest
// earned to date (capped at maturity — nothing accrues past the term), the
// projected total at maturity, and the next payout date.
export function getFdInfo(investment, today = new Date()) {
  const principal = +investment.initialAmount || 0;
  const rate = +investment.interestRate || 0;
  const tenureMonths = +investment.tenureMonths || 0;
  const freq = getPayoutFrequency(investment.payoutFrequency);
  const startDate = investment.startDate;

  const maturityDate =
    startDate && tenureMonths ? addMonths(startDate, tenureMonths) : null;
  const now = todayStr(today);
  const isMatured = maturityDate ? now >= maturityDate : false;
  const elapsedEnd = isMatured ? maturityDate : now;
  const elapsedMonths = startDate ? monthsBetween(startDate, elapsedEnd) : 0;

  if (freq.id === "maturity") {
    const totalAtMaturity = principal * (rate / 100) * (tenureMonths / 12);
    return {
      maturityDate,
      isMatured,
      payoutPerPeriod: null,
      perLabel: null,
      totalEarned: isMatured ? totalAtMaturity : 0,
      totalAtMaturity,
      nextPayoutDate: isMatured ? null : maturityDate,
      nextPayoutAmount: isMatured ? null : totalAtMaturity,
    };
  }

  const periodMonths = 12 / freq.periodsPerYear;
  const payoutPerPeriod = (principal * (rate / 100)) / freq.periodsPerYear;
  const totalPeriods = Math.floor(tenureMonths / periodMonths);
  const completedPeriods = Math.min(
    Math.floor(elapsedMonths / periodMonths),
    totalPeriods,
  );
  const nextRegularDate = startDate ? addMonths(startDate, (completedPeriods + 1) * periodMonths) : null;
  const nextPayoutDate = !isMatured && nextRegularDate
    ? (maturityDate && maturityDate < nextRegularDate ? maturityDate : nextRegularDate)
    : null;
  const totalAtMaturity = principal * (rate / 100) * (tenureMonths / 12);

  return {
    maturityDate,
    isMatured,
    payoutPerPeriod,
    perLabel: freq.perLabel,
    totalEarned: isMatured ? totalAtMaturity : completedPeriods * payoutPerPeriod,
    totalAtMaturity,
    nextPayoutDate,
    nextPayoutAmount: isMatured ? null : Math.min(payoutPerPeriod, Math.max(0, totalAtMaturity - completedPeriods * payoutPerPeriod)),
  };
}
