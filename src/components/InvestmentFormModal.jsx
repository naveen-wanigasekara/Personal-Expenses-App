import { useState, useContext } from "react";
import { LineChart } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmt } from "../utils/format.js";
import {
  FD_PAYOUT_FREQUENCIES,
  getPayoutFrequency,
} from "../utils/investmentCalc.js";
import Sheet from "./Sheet.jsx";
import AmountInput from "./AmountInput.jsx";

const INVESTMENT_TYPES = [
  "Stocks",
  "Mutual Fund",
  "Fixed Deposit",
  "Crypto",
  "Real Estate",
  "Other",
];

export default function InvestmentFormModal({ investment, onClose, onSave }) {
  const CURRENCY = useContext(CurrencyCtx);
  const [name, setName] = useState(investment?.name || "");
  const [type, setType] = useState(investment?.type || INVESTMENT_TYPES[0]);
  const [initialAmount, setInitialAmount] = useState(
    investment?.initialAmount ? String(investment.initialAmount) : "",
  );
  const [startDate, setStartDate] = useState(() => {
    if (investment?.startDate) return investment.startDate;
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  });
  const [notes, setNotes] = useState(investment?.notes || "");
  const [interestRate, setInterestRate] = useState(
    investment?.interestRate ? String(investment.interestRate) : "",
  );
  const [payoutFrequency, setPayoutFrequency] = useState(
    investment?.payoutFrequency || FD_PAYOUT_FREQUENCIES[0].id,
  );
  const [tenureMonths, setTenureMonths] = useState(
    investment?.tenureMonths ? String(investment.tenureMonths) : "",
  );

  const isFd = type === "Fixed Deposit";
  const selectedFreq = getPayoutFrequency(payoutFrequency);
  const payoutPeriodTooLong =
    isFd &&
    selectedFreq.periodsPerYear &&
    +tenureMonths > 0 &&
    12 / selectedFreq.periodsPerYear > +tenureMonths;
  const valid =
    name.trim() &&
    initialAmount &&
    +initialAmount > 0 &&
    startDate &&
    (!isFd || (+interestRate > 0 && +tenureMonths > 0));

  const handleSave = () => {
    if (!valid) return;
    onSave({
      id: investment?.id,
      name: name.trim(),
      type,
      initialAmount: +initialAmount,
      currentValue: investment?.currentValue,
      startDate,
      notes: notes.trim(),
      interestRate: isFd ? +interestRate : null,
      payoutFrequency: isFd ? payoutFrequency : null,
      tenureMonths: isFd ? +tenureMonths : null,
    });
  };

  return (
    <Sheet
      title={investment ? "Edit investment" : "New investment"}
      onClose={onClose}
    >
      <div className="ct-visual preview">
        <div className="ct-vis-top">
          <span className="ct-bank">{name || "Investment Name"}</span>
          <LineChart size={18} strokeWidth={1.5} />
        </div>
        <div className="ct-vis-mid">
          <div className="ct-vis-label">{investment ? "Initial Amount" : "Starting Amount"}</div>
          <div className="ct-vis-val">
            {CURRENCY} {fmt(+initialAmount || 0)}
          </div>
        </div>
      </div>

      <label className="field-lbl">Name</label>
      <input
        type="text"
        className="text-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Vanguard S&P 500, Fixed Deposit — BOC"
        autoFocus
      />

      <div className="field-row">
        <div className="field-group">
          <label className="field-lbl">Type</label>
          <select
            className="text-input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {INVESTMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-lbl">Start date</label>
          <input
            type="date"
            className="text-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>

      <label className="field-lbl">
        {investment ? "Initial amount" : "Starting amount"}
      </label>
      <div className="big-input">
        <span className="big-cur">{CURRENCY}</span>
        <AmountInput
          value={initialAmount}
          onChange={setInitialAmount}
          placeholder="0.00"
        />
      </div>
      {!investment && (
        <div className="hint">
          This also records your first value check-in, dated to the start
          date below.
        </div>
      )}

      {isFd && (
        <>
          <div className="field-row">
            <div className="field-group">
              <label className="field-lbl">Interest rate (% per annum)</label>
              <input
                type="text"
                inputMode="decimal"
                className="text-input"
                value={interestRate}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value)) setInterestRate(e.target.value);
                }}
                placeholder="e.g. 12"
              />
            </div>
            <div className="field-group">
              <label className="field-lbl">Payout frequency</label>
              <select
                className="text-input"
                value={payoutFrequency}
                onChange={(e) => setPayoutFrequency(e.target.value)}
              >
                {FD_PAYOUT_FREQUENCIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="field-lbl">Tenure (months)</label>
          <input
            type="text"
            inputMode="numeric"
            className="text-input"
            value={tenureMonths}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) setTenureMonths(e.target.value);
            }}
            placeholder="e.g. 12"
          />
          {payoutPeriodTooLong ? (
            <div className="warn-hint">
              {selectedFreq.label} payouts happen every {12 / selectedFreq.periodsPerYear}{" "}
              months, but the tenure is only {tenureMonths} — no payout would
              ever complete. Pick a shorter frequency or a longer tenure.
            </div>
          ) : (
            <div className="hint">
              Interest is paid out separately each period — the deposit's own
              value stays at the principal until maturity, matching how a
              real fixed deposit works.
            </div>
          )}
        </>
      )}

      <label className="field-lbl">Notes (optional)</label>
      <input
        type="text"
        className="text-input"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes"
      />

      <button
        className={`save-btn ${!valid ? "disabled" : ""}`}
        onClick={handleSave}
        disabled={!valid}
      >
        {investment ? "Save changes" : "Add investment"}
      </button>
    </Sheet>
  );
}
