import { useAsyncSave } from '../hooks/useAsyncSave.js';
import { useState, useContext } from "react";
import { Check, CreditCard } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { CARD_COLORS } from "../constants/currencies.js";
import { fmt } from "../utils/format.js";
import Sheet from "./Sheet.jsx";
import AmountInput from "./AmountInput.jsx";

export default function CardFormModal({ card, onClose, onSave, moneyEnabled = false }) {
  const CURRENCY = useContext(CurrencyCtx);
  const { saving, saveError, runSave } = useAsyncSave();
  const [paymentDueDate,setPaymentDueDate]=useState(card?.paymentDueDate || "");
  const [name, setName] = useState(card?.name || "");
  const [limit, setLimit] = useState(card?.limit || "");
  const [openingBalance, setOpeningBalance] = useState(
    card?.openingBalance || "",
  );
  const [colorIdx, setColorIdx] = useState(() => {
    if (!card?.colors) return Math.floor(Math.random() * CARD_COLORS.length);
    const idx = CARD_COLORS.findIndex((c) => c[0] === card.colors[0]);
    return idx >= 0 ? idx : 0;
  });

  const handleSave = () => {
    if (!name.trim() || !limit || +limit <= 0) return;
    return runSave(() => onSave({
      id: card?.id,
      name: name.trim(),
      limit: +limit,
      openingBalance: +openingBalance || 0,
      colors: CARD_COLORS[colorIdx],
      paymentDueDate,
    }));
  };

  const valid = name.trim() && limit && +limit > 0;
  const [from, to] = CARD_COLORS[colorIdx];

  return (
    <Sheet protectDraft busy={saving} title={card ? "Edit card" : "New card"} onClose={() => { if (!saving) onClose(); }}>
      {saveError && <p role="alert" className="auth-err">{saveError}</p>}<fieldset className="save-fields" disabled={saving}>
      <div
        className="ct-visual preview"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div className="ct-vis-top">
          <span className="ct-bank">{name || "Card Name"}</span>
          <CreditCard size={18} strokeWidth={1.5} />
        </div>
        <div className="ct-vis-mid">
          <div className="ct-vis-label">Limit</div>
          <div className="ct-vis-val">
            {CURRENCY} {fmt(+limit || 0)}
          </div>
        </div>
      </div>

      <label className="field-lbl">Card name</label>
      <input
        aria-label="Card name"
        type="text"
        className="text-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. HSBC Visa, Sampath Platinum"
        autoFocus
      />

      <div className="field-row">
        <div className="field-group">
          <label className="field-lbl">Credit limit</label>
          <div className="big-input">
            <span className="big-cur">{CURRENCY}</span>
            <AmountInput aria-label="Credit limit" value={limit} onChange={setLimit} placeholder="0.00" />
          </div>
        </div>
        <div className="field-group">
          <label className="field-lbl">
            Current outstanding balance {card ? "" : "(optional)"}
          </label>
          <div className="big-input">
            <span className="big-cur">{CURRENCY}</span>
            <AmountInput
              aria-label="Current outstanding balance"
              value={openingBalance}
              onChange={setOpeningBalance}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
      <div className="hint">
        {card
          ? "Editing this adjusts the card's starting balance. Transactions still count on top."
          : "If you already owe money on this card, enter it here. Leave 0 if starting fresh."}
      </div>

      {moneyEnabled && <label className="money-field"><span>Next card payment date (optional)</span><input type="date" aria-label="Next card payment date" className="text-input" value={paymentDueDate} onChange={e=>setPaymentDueDate(e.target.value)}/><span className="money-hint">A reminder date, not a calculated statement amount. Update it for each statement.</span></label>}
      <label className="field-lbl">Color</label>
      <div className="color-grid">
        {CARD_COLORS.map((c, i) => (
          <button
            key={i}
            className={`color-swatch ${colorIdx === i ? "active" : ""}`}
            style={{
              background: `linear-gradient(135deg, ${c[0]}, ${c[1]})`,
            }}
            onClick={() => setColorIdx(i)}
            aria-label={`Color ${i + 1}`}
            aria-pressed={colorIdx === i}
          >
            {colorIdx === i && (
              <Check size={14} strokeWidth={3} color="white" />
            )}
          </button>
        ))}
      </div>

      <button
        className={`save-btn ${!valid ? "disabled" : ""}`}
        onClick={handleSave}
        disabled={!valid}
      >
        {card ? "Update card" : "Add card"}
      </button>
      </fieldset>
    </Sheet>
  );
}
