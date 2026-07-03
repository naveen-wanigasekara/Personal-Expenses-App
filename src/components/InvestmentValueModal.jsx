import { useState, useContext } from "react";
import { CurrencyCtx } from "../context.js";
import Sheet from "./Sheet.jsx";
import AmountInput from "./AmountInput.jsx";

export default function InvestmentValueModal({
  investment,
  valuation,
  onClose,
  onSave,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const isEditing = !!valuation;
  const [value, setValue] = useState(() => {
    if (valuation) return String(valuation.value);
    return investment?.currentValue ? String(investment.currentValue) : "";
  });
  const [date, setDate] = useState(() => {
    if (valuation) return valuation.recordedDate;
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  });
  const [note, setNote] = useState("");

  const valid = value && +value >= 0 && date;

  const handleSave = () => {
    if (!valid) return;
    onSave(+value, date, note.trim());
  };

  return (
    <Sheet
      title={`${isEditing ? "Edit value" : "Record value"} — ${investment.name}`}
      onClose={onClose}
    >
      <label className="field-lbl">Current value</label>
      <div className="big-input">
        <span className="big-cur">{CURRENCY}</span>
        <AmountInput value={value} onChange={setValue} placeholder="0.00" autoFocus />
      </div>

      <label className="field-lbl">Date</label>
      <input
        type="date"
        className="text-input"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="hint">
        The investment's current value always reflects whichever entry has
        the latest date, so backfilling an earlier date is safe.
      </div>

      <label className="field-lbl">Note (optional)</label>
      <input
        type="text"
        className="text-input"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note"
      />

      <button
        className={`save-btn ${!valid ? "disabled" : ""}`}
        onClick={handleSave}
        disabled={!valid}
      >
        {isEditing ? "Save changes" : "Record value"}
      </button>
    </Sheet>
  );
}
