import { useState, useContext } from "react";
import { Edit2, Trash2, CreditCard } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { getCat } from "../constants/categories.js";
import { fmt } from "../utils/format.js";

export default function TxRow({ tx, onDelete, onEdit, cardName, allExpCats, allIncCats }) {
  const CURRENCY = useContext(CurrencyCtx);
  const [open, setOpen] = useState(false);

  let cat, sign, color;
  if (tx.type === "income") {
    cat = getCat(tx.category, "income", allExpCats, allIncCats); sign = "+"; color = "income";
  } else if (tx.type === "card-payment") {
    cat = { label: "Card Payment", icon: CreditCard, color: "#a594f9" };
    sign = "↔"; color = "neutral";
  } else if (tx.type === "card-interest") {
    cat = getCat("card-interest", "expense", allExpCats, allIncCats); sign = "−"; color = "expense";
  } else if (tx.type === "card-purchase") {
    cat = getCat(tx.category, "expense", allExpCats, allIncCats); sign = "−"; color = "expense";
  } else {
    cat = getCat(tx.category, "expense", allExpCats, allIncCats); sign = "−"; color = "expense";
  }
  const Icon = cat.icon;

  return (
    <div className={`tx ${open ? "tx-open" : ""}`}>
      <button className="tx-main" onClick={() => setOpen(!open)}>
        <div className="tx-icon" style={{ background: `${cat.color}1a`, color: cat.color }}>
          <Icon size={17} strokeWidth={2} />
        </div>
        <div className="tx-body">
          <div className="tx-title">
            {tx.note || cat.label}
            {cardName && tx.type !== "card-payment" && (
              <span className="tx-card-chip"><CreditCard size={9} /> {cardName}</span>
            )}
          </div>
          <div className="tx-sub">
            {tx.type === "card-payment" ? `Payment → ${cardName}` :
              tx.type === "card-interest" ? `Interest/fees · ${cardName}` : cat.label}
          </div>
        </div>
        <div className={`tx-amt ${color}`}>
          <span className="tx-amt-sign">{sign}</span>{CURRENCY} {fmt(tx.amount)}
        </div>
      </button>
      {open && (
        <div className="tx-expand">
          {onEdit && (
            <button className="tx-edit" onClick={() => onEdit(tx)}>
              <Edit2 size={13} /> Edit
            </button>
          )}
          <button className="tx-del" onClick={() => onDelete(tx.id)}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
