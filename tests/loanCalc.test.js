import test from "node:test";
import assert from "node:assert/strict";
import { loanMonths, monthlyInstallment, loanEstimate } from "../src/utils/loanCalc.js";

test("known fixed-rate monthly installment", () => {
  assert.ok(Math.abs(monthlyInstallment(100000, 12, 12) - 8884.878867834166) < 1e-7);
  assert.ok(Math.abs(monthlyInstallment(1000000, 12, 60) - 22244.44768490176) < 1e-7);
});
test("zero interest divides principal into equal payments", () => {
  assert.equal(monthlyInstallment(120000, 0, 12), 10000);
  assert.equal(monthlyInstallment(15000, 0, 1), 15000);
});
test("payments amortize the loan to zero", () => {
  for (const [principal, annualRate, months] of [[250000, 9.5, 36], [1000000, 18, 60], [1000, 3, 1]]) {
    const payment = monthlyInstallment(principal, annualRate, months);
    let balance = principal;
    for (let month = 0; month < months; month++) balance = balance * (1 + annualRate / 1200) - payment;
    assert.ok(Math.abs(balance) < 1e-6, `Unpaid balance: ${balance}`);
  }
});
test("small interest rates retain precision and long terms remain finite", () => {
  assert.ok(Math.abs(monthlyInstallment(120000, 1e-12, 12) - 10000) < 1e-7);
  assert.ok(Number.isFinite(monthlyInstallment(100000, 120, 12000)));
});
test("rejects invalid inputs instead of displaying misleading amounts", () => {
  for (const args of [[0, 12, 12], [-100, 12, 12], [100, -1, 12], [100, 12, 0], [100, 12, 1.5], [100, 12, null], [NaN, 12, 12], [100, Infinity, 12], [Infinity, 12, 12], [100, 12, Number.MAX_VALUE]]) {
    assert.equal(monthlyInstallment(...args), null);
  }
});
test("converts years and months, including fractional years", () => {
  assert.equal(loanMonths(5, "years"), 60);
  assert.equal(loanMonths(60, "months"), 60);
  assert.equal(loanMonths(1.5, "years"), 18);
  assert.equal(loanMonths(1 / 12, "years"), 1);
  for (const [period, unit] of [[0, "years"], [-1, "months"], [1.5, "months"], [1, "weeks"], [Infinity, "months"], [1.1, "years"]]) {
    assert.equal(loanMonths(period, unit), null);
  }
});

test("total interest agrees with the interest accrued across the loan", () => {
  const principal = 100000;
  const rate = 12;
  const months = 12;
  const estimate = loanEstimate(principal, rate, months);
  assert.ok(Math.abs(estimate.totalInterest - 6618.546414009993) < 1e-6);
  let balance = principal;
  let accruedInterest = 0;
  for (let month = 0; month < months; month++) {
    const interest = balance * rate / 1200;
    accruedInterest += interest;
    balance += interest - estimate.installment;
  }
  assert.ok(Math.abs(accruedInterest - estimate.totalInterest) < 1e-6);
  // Display rounding must not compound into the total interest calculation.
  assert.notEqual(estimate.totalInterest, 8884.88 * months - principal);
});
test("zero-interest totals are exactly zero and invalid estimates stay hidden", () => {
  assert.deepEqual(loanEstimate(100000, 0, 3), { installment: 100000 / 3, totalInterest: 0 });
  assert.equal(loanEstimate(100000, -12, 12), null);
  assert.equal(loanEstimate(100000, 12, null), null);
});
