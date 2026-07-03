import { useState } from "react";
import { Check, ArrowDown, ArrowUp } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import {
  ICON_MAP,
  ICON_OPTIONS,
  CUSTOM_CAT_COLORS,
  getProtectedCategory,
} from "../constants/categories.js";
import Sheet from "./Sheet.jsx";

export default function CategoryFormModal({
  initialType,
  editing,
  onClose,
  onSave,
}) {
  const isEditing = !!editing;
  const protectedCat = editing
    ? getProtectedCategory(editing.type, editing.id)
    : null;
  const [type, setType] = useState(initialType || "expense");
  const [label, setLabel] = useState(editing?.label || "");
  const [iconName, setIconName] = useState(
    editing?.iconName || "MoreHorizontal",
  );
  const [color, setColor] = useState(editing?.color || "#8a8075");

  const handleSave = () => {
    if (!label.trim()) return;
    onSave(type, {
      ...(editing || {}),
      id:
        editing?.id ||
        `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: label.trim(),
      iconName,
      icon: ICON_MAP[iconName] || MoreHorizontal,
      color,
    });
  };

  return (
    <Sheet
      title={isEditing ? "Edit category" : "New category"}
      onClose={onClose}
    >
      {!isEditing && (
        <div className="mode-toggle" style={{ marginBottom: 16 }}>
          <div
            className={`mode-slider ${type === "expense" ? "left" : "right"}`}
          />
          <button
            className={type === "expense" ? "active" : ""}
            onClick={() => setType("expense")}
          >
            <ArrowDown size={13} strokeWidth={2.5} /> Expense
          </button>
          <button
            className={type === "income" ? "active" : ""}
            onClick={() => setType("income")}
          >
            <ArrowUp size={13} strokeWidth={2.5} /> Income
          </button>
        </div>
      )}

      <label className="field-lbl">Name</label>
      {protectedCat ? (
        <div className="mode-toggle" style={{ marginBottom: 4 }}>
          <div
            className={`mode-slider ${label === protectedCat.labelOptions[0] ? "left" : "right"}`}
          />
          {protectedCat.labelOptions.map((opt) => (
            <button
              key={opt}
              className={label === opt ? "active" : ""}
              onClick={() => setLabel(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          className="text-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Pet Care, Freelance…"
          maxLength={28}
          autoFocus
        />
      )}

      <label className="field-lbl">Icon</label>
      <div className="icon-picker">
        {ICON_OPTIONS.map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={`icon-opt ${iconName === name ? "active" : ""}`}
            onClick={() => setIconName(name)}
            style={
              iconName === name
                ? { borderColor: color, background: `${color}20` }
                : {}
            }
          >
            <Icon
              size={17}
              strokeWidth={2}
              style={{ color: iconName === name ? color : undefined }}
            />
          </button>
        ))}
      </div>

      <label className="field-lbl">Color</label>
      <div className="color-picker">
        {CUSTOM_CAT_COLORS.map((c) => (
          <button
            key={c}
            className={`color-opt ${color === c ? "active" : ""}`}
            onClick={() => setColor(c)}
            style={{ background: c }}
          >
            {color === c && <Check size={11} strokeWidth={3} color="#fff" />}
          </button>
        ))}
      </div>

      <button
        className={`save-btn ${!label.trim() ? "disabled" : ""}`}
        onClick={handleSave}
        disabled={!label.trim()}
      >
        {isEditing ? "Save changes" : "Add category"}
      </button>
    </Sheet>
  );
}
