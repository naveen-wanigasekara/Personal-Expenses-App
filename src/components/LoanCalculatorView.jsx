import { useContext, useState } from "react";
import { Bell, Menu, RefreshCw, Calculator } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import AmountInput from "./AmountInput.jsx";
import { fmt } from "../utils/format.js";
import { loanMonths, loanEstimate } from "../utils/loanCalc.js";

export default function LoanCalculatorView({
  onOpenMenu, onOpenNotifications, notifCount, showQuickRefresh, onQuickRefresh,
}) {
  const currency = useContext(CurrencyCtx);
  const [amount, setAmount] = useState("");
  const [interest, setInterest] = useState("");
  const [period, setPeriod] = useState("");
  const [unit, setUnit] = useState("years");
  const months = loanMonths(Number(period), unit);
  const complete = amount !== "" && interest !== "" && period !== "";
  const estimate = complete ? loanEstimate(Number(amount), Number(interest), months) : null;
  const payment = estimate?.installment ?? null;
  const error = complete && payment === null
    ? "Enter a positive loan amount, a non-negative interest rate, and a period in whole months."
    : null;

  return (
    <div className="view view-loan">
      <div className="dash-topbar">
        <div className="mheader-left">
          <button className="icon-btn" onClick={onOpenMenu} aria-label="Menu"><Menu size={16} /></button>
        </div>
        <div className="mheader-center"><span className="mheader-title">Loan Calculator</span></div>
        <div className="mheader-right">
          {showQuickRefresh && <button className="bell-btn" onClick={onQuickRefresh} aria-label="Refresh"><RefreshCw size={16} /></button>}
          <button className="bell-btn" onClick={onOpenNotifications} aria-label="Notifications">
            <Bell size={16} />
            {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
          </button>
        </div>
      </div>
      <div className="loan-scroll">
        <div className="page-hd">
          <h1 className="page-title">Loan Calculator</h1>
          <p className="loan-intro">Find your estimated monthly installment.</p>
        </div>
        <div className="loan-layout">
          <form className="card loan-form" onSubmit={(event) => event.preventDefault()}>
            <label className="field-lbl" htmlFor="loan-amount">Loan amount</label>
            <div className="big-input">
              <span className="big-cur">{currency}</span>
              <AmountInput id="loan-amount" aria-label="Loan amount" value={amount} onChange={setAmount} placeholder="0.00" aria-describedby={error ? "loan-error" : undefined} />
            </div>
            <label className="field-lbl" htmlFor="loan-interest">Annual interest rate (%)</label>
            <input id="loan-interest" className="text-input" type="number" inputMode="decimal" min="0" step="any" value={interest} onChange={(event) => setInterest(event.target.value)} placeholder="e.g. 12" aria-describedby={error ? "loan-error" : undefined} />
            <label className="field-lbl" htmlFor="loan-period">Repayment period</label>
            <div className="loan-period">
              <input id="loan-period" className="text-input" type="number" inputMode="decimal" min={unit === "years" ? 1 / 12 : 1} step="any" value={period} onChange={(event) => setPeriod(event.target.value)} placeholder={unit === "years" ? "e.g. 5" : "e.g. 60"} aria-describedby={error ? "loan-error" : undefined} />
              <select className="text-input" aria-label="Period unit" value={unit} onChange={(event) => setUnit(event.target.value)}>
                <option value="years">Years</option><option value="months">Months</option>
              </select>
            </div>
            {error && <p id="loan-error" className="loan-error" role="alert">{error}</p>}
          </form>
          <div className="card loan-result" role="status" aria-live="polite" aria-atomic="true">
            <div className="loan-result-icon"><Calculator size={22} aria-hidden="true" /></div>
            <h2>Monthly installment</h2>
            {payment !== null ? <>
              <div className="loan-payment"><span>{currency}</span> {fmt(payment)}</div>
              <p className="loan-result-detail">per month for {months} {months === 1 ? "month" : "months"}</p>
              <dl className="loan-totals">
                <div><dt>Total interest</dt><dd>{currency} {fmt(estimate.totalInterest)}</dd></div>
              </dl>
            </> : <p className="loan-empty">Enter your loan details to see the installment.</p>}
          </div>
        </div>
        <p className="loan-assumption">Estimate based on a fixed annual interest rate and monthly reducing-balance repayments. Fees and insurance are not included.</p>
      </div>
    </div>
  );
}
