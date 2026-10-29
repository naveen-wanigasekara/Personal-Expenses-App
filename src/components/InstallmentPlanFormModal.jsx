import { useContext, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { CARD_COLORS } from "../constants/currencies.js";
import { fmtCompact, monthLabel } from "../utils/format.js";
import Sheet from "./Sheet.jsx";
import AmountInput from "./AmountInput.jsx";
import {elapsedInstallments, validInstallmentMonths} from "../utils/installments.js";

// How many of the plan's months are already billed (this month included) —
// mirrors CardDetailView's planElapsed. Total months can never be edited
// below this, and the start month can't be edited at all, since those
// months' transactions already exist with real, immutable dates.

export default function InstallmentPlanFormModal({
  plan,
  cards,
  allExpCats,
  onClose,
  onSave,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const paid = elapsedInstallments(plan);

  const [label, setLabel] = useState(plan.label);
  const [amount, setAmount] = useState(String(plan.monthlyAmount));
  const [totalMonths, setTotalMonths] = useState(String(plan.totalMonths));
  const [category, setCategory] = useState(plan.category);
  const [cardId, setCardId] = useState(plan.cardId);

  const valid =
    label.trim() &&
    amount &&
    +amount > 0 &&
    validInstallmentMonths(+totalMonths, paid, plan.totalMonths) &&
    cardId;

  const planTotal =
    +amount > 0 && +totalMonths > 0 ? +amount * +totalMonths : 0;

  const handleSave = () => {
    if (!valid) return;
    onSave(plan.id, {
      label: label.trim(),
      monthlyAmount: +amount,
      totalMonths: +totalMonths,
      category,
      cardId,
    });
  };

  return (
    <Sheet title="Edit installment plan" onClose={onClose}>
      <label className="field-lbl">What is this for?</label>
      <input
        type="text"
        aria-label="Installment description"
        className="text-input"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. Samsung TV"
        autoFocus
      />

      <label className="field-lbl">Monthly amount</label>
      <div className="amount-input">
        <span className="amt-cur">{CURRENCY}</span>
        <AmountInput aria-label="Monthly amount" value={amount} onChange={setAmount} placeholder="0.00" />
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-lbl">Number of months</label>
          <input
            type="number"
            aria-label="Number of months"
            className="text-input"
            value={totalMonths}
            onChange={(e) => setTotalMonths(e.target.value)}
            min={Math.max(1, paid)}
            max={Math.max(120, plan.totalMonths)}
          />
        </div>
        <div className="field-group">
          <label className="field-lbl">Start month</label>
          <input
            type="text"
            aria-label="Start month"
            className="text-input"
            value={monthLabel(plan.startMonth)}
            disabled
          />
        </div>
      </div>
      {+totalMonths < paid && (
        <div className="hint warn-hint">
          <AlertTriangle size={13} /> {paid} month(s) are already billed and
          can't be reduced below that.
        </div>
      )}
      {planTotal > 0 && (
        <div className="installment-total">
          Total: {CURRENCY} {fmtCompact(planTotal)}
        </div>
      )}

      <label className="field-lbl">Card</label>
      <div className="card-picker">
        {cards.map((c) => {
          const [from, to] = c.colors || CARD_COLORS[0];
          return (
            <button
              key={c.id}
              className={`cp-btn ${cardId === c.id ? "active" : ""}`}
              aria-pressed={cardId === c.id}
              onClick={() => setCardId(c.id)}
              style={{ borderColor: cardId === c.id ? to : "transparent" }}
            >
              <div
                className="cp-swatch"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              />
              <div className="cp-info">
                <div className="cp-name">{c.name}</div>
                <div className="cp-bal">
                  {CURRENCY} {fmtCompact(c.currentBalance)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <label className="field-lbl">Category</label>
      <div className="cat-grid">
        {allExpCats.map((c) => {
          const Icon = c.icon;
          const active = category === c.id;
          return (
            <button
              key={c.id}
              className={`cat-btn ${active ? "active" : ""}`}
              aria-pressed={active}
              onClick={() => setCategory(c.id)}
              style={active ? { borderColor: c.color, background: `${c.color}14` } : {}}
            >
              <div
                className="cb-btn-icon"
                style={{ background: `${c.color}26`, color: c.color }}
              >
                <Icon size={14} strokeWidth={2} />
              </div>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="hint" style={{ marginTop: 12 }}>
        Name and category changes apply to the whole plan, including past
        months. Amount, card, and duration changes only apply from next
        month onward — the {paid} month(s) already billed keep their
        original values.
      </div>

      <button
        className={`save-btn ${!valid ? "disabled" : ""}`}
        onClick={handleSave}
        disabled={!valid}
      >
        Save changes
      </button>
    </Sheet>
  );
}
