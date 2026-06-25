import { useState, useEffect, useContext } from "react";
import { X, Plus, Trash2, Bell } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmt } from "../utils/format.js";

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function RecurringRemindersModal({
  reminders,
  onClose,
  onSave,
  onDelete,
  allExpCats,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [category, setCategory] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const resetForm = () => {
    setLabel("");
    setAmount("");
    setDayOfMonth("1");
    setCategory("");
    setAdding(false);
  };

  const handleSave = () => {
    if (!label.trim() || !dayOfMonth || +dayOfMonth < 1 || +dayOfMonth > 28)
      return;
    onSave({
      label: label.trim(),
      amount: amount ? +amount : null,
      dayOfMonth: +dayOfMonth,
      category: category || null,
    });
    resetForm();
  };

  const valid =
    label.trim() && dayOfMonth && +dayOfMonth >= 1 && +dayOfMonth <= 28;

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>Recurring Reminders</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {reminders.filter((r) => r.active).length === 0 && !adding && (
          <div className="empty-sm">No recurring reminders set up yet.</div>
        )}

        {reminders.filter((r) => r.active).length > 0 && (
          <div className="reminder-list">
            {reminders
              .filter((r) => r.active)
              .map((r) => {
                const cat = r.category
                  ? allExpCats.find((c) => c.id === r.category)
                  : null;
                return (
                  <div key={r.id} className="reminder-row">
                    <div className="reminder-icon">
                      <Bell size={14} />
                    </div>
                    <div className="reminder-info">
                      <div className="reminder-label">{r.label}</div>
                      <div className="reminder-meta">
                        Due {ordinal(r.dayOfMonth)} of each month
                        {r.amount ? ` · ${CURRENCY} ${fmt(r.amount)}` : ""}
                        {cat ? ` · ${cat.label}` : ""}
                      </div>
                    </div>
                    <button
                      className="manage-cat-btn danger"
                      onClick={() => onDelete(r.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        {adding && (
          <div className="reminder-form">
            <label className="field-lbl">Label</label>
            <input
              type="text"
              className="text-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Electricity Bill"
              autoFocus
            />

            <label className="field-lbl">Estimated amount (optional)</label>
            <input
              type="number"
              className="text-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
            />

            <label className="field-lbl">Due day each month (1–28)</label>
            <input
              type="number"
              className="text-input"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              min="1"
              max="28"
              placeholder="15"
            />

            <label className="field-lbl">
              Category for auto-dismiss (optional)
            </label>
            <select
              className="text-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">None — dismiss manually</option>
              {allExpCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <button
              className={`save-btn ${!valid ? "disabled" : ""}`}
              onClick={handleSave}
              disabled={!valid}
            >
              Save Reminder
            </button>
            <button className="text-btn" onClick={resetForm}>
              Cancel
            </button>
          </div>
        )}

        {!adding && (
          <button
            className="add-card-btn"
            style={{ marginTop: 12 }}
            onClick={() => setAdding(true)}
          >
            <Plus size={16} /> Add reminder
          </button>
        )}
      </div>
    </div>
  );
}
