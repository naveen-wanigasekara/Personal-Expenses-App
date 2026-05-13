import { useState, useContext, useEffect } from "react";
import { X, Check, CreditCard } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { CARD_COLORS } from "../constants/currencies.js";
import { fmt } from "../utils/format.js";

export default function CardFormModal({ card, onClose, onSave }) {
  const CURRENCY = useContext(CurrencyCtx);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  const [name, setName] = useState(card?.name || "");
  const [limit, setLimit] = useState(card?.limit || "");
  const [openingBalance, setOpeningBalance] = useState(card?.openingBalance || "");

  const fmtLive = (raw) => {
    const parts = raw.split(".");
    const i = parts[0] ? parseInt(parts[0], 10).toLocaleString("en-US") : "";
    return raw.includes(".") ? i + "." + parts[1] : i;
  };
  const numericChange = (e, setRaw, setDisplay) => {
    const raw = e.target.value.replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(raw)) return;
    setRaw(raw);
    setDisplay(fmtLive(raw));
  };

  const [displayLimit, setDisplayLimit] = useState(() => limit ? fmtLive(String(limit)) : "");
  const [displayOpeningBalance, setDisplayOpeningBalance] = useState(() => openingBalance ? fmtLive(String(openingBalance)) : "");
  const [colorIdx, setColorIdx] = useState(
    card?.colors ? CARD_COLORS.findIndex((c) => c[0] === card.colors[0])
      : Math.floor(Math.random() * CARD_COLORS.length)
  );

  const handleSave = () => {
    if (!name.trim() || !limit || +limit <= 0) return;
    onSave({
      id: card?.id, name: name.trim(),
      limit: +limit, openingBalance: +openingBalance || 0,
      colors: CARD_COLORS[colorIdx],
    });
  };

  const valid = name.trim() && limit && +limit > 0;
  const [from, to] = CARD_COLORS[colorIdx];

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>{card ? "Edit card" : "New card"}</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ct-visual preview" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
          <div className="ct-vis-top">
            <span className="ct-bank">{name || "Card Name"}</span>
            <CreditCard size={18} strokeWidth={1.5} />
          </div>
          <div className="ct-vis-mid">
            <div className="ct-vis-label">Limit</div>
            <div className="ct-vis-val">{CURRENCY} {fmt(+limit || 0)}</div>
          </div>
        </div>

        <label className="field-lbl">Card name</label>
        <input type="text" className="text-input" value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. HSBC Visa, Sampath Platinum" autoFocus />

        <label className="field-lbl">Credit limit</label>
        <div className="big-input">
          <span className="big-cur">{CURRENCY}</span>
          <input type="text" value={displayLimit}
            onChange={(e) => numericChange(e, setLimit, setDisplayLimit)}
            placeholder="0.00" inputMode="decimal" />
        </div>

        <label className="field-lbl">Current outstanding balance {card ? "" : "(optional)"}</label>
        <div className="big-input">
          <span className="big-cur">{CURRENCY}</span>
          <input type="text" value={displayOpeningBalance}
            onChange={(e) => numericChange(e, setOpeningBalance, setDisplayOpeningBalance)}
            placeholder="0.00" inputMode="decimal" />
        </div>
        <div className="hint">
          {card ? "Editing this adjusts the card's starting balance. Transactions still count on top."
            : "If you already owe money on this card, enter it here. Leave 0 if starting fresh."}
        </div>

        <label className="field-lbl">Color</label>
        <div className="color-grid">
          {CARD_COLORS.map((c, i) => (
            <button key={i} className={`color-swatch ${colorIdx === i ? "active" : ""}`}
              style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }}
              onClick={() => setColorIdx(i)} aria-label={`Color ${i + 1}`}>
              {colorIdx === i && <Check size={14} strokeWidth={3} color="white" />}
            </button>
          ))}
        </div>

        <button className={`save-btn ${!valid ? "disabled" : ""}`} onClick={handleSave} disabled={!valid}>
          {card ? "Update card" : "Add card"}
        </button>
      </div>
    </div>
  );
}
