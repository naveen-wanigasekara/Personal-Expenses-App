import { useState, useContext, useRef, memo } from "react";
import { Edit2, Trash2, CreditCard, ChevronDown } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { getCat } from "../constants/categories.js";
import { fmt } from "../utils/format.js";

const SWIPE_THRESHOLD = 60;

function TxRow({
  tx,
  onDelete,
  onEdit,
  cardName,
  allExpCats,
  allIncCats,
  installmentPlan,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const [open, setOpen] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  let cat, sign, color;
  if (tx.type === "income") {
    cat = getCat(tx.category, "income", allExpCats, allIncCats);
    sign = "+";
    color = "income";
  } else if (tx.type === "card-payment") {
    cat = { label: "Card Payment", icon: CreditCard, color: "#a594f9" };
    sign = "↔";
    color = "neutral";
  } else if (tx.type === "card-interest") {
    cat = getCat("card-interest", "expense", allExpCats, allIncCats);
    sign = "−";
    color = "expense";
  } else if (tx.type === "card-purchase") {
    cat = getCat(tx.category, "expense", allExpCats, allIncCats);
    sign = "−";
    color = "expense";
  } else {
    cat = getCat(tx.category, "expense", allExpCats, allIncCats);
    sign = "−";
    color = "expense";
  }
  const Icon = cat.icon;

  let installmentSeq = null;
  if (installmentPlan && tx.installmentId) {
    const [sy, sm] = installmentPlan.startMonth.split("-").map(Number);
    const [ty, tm] = tx.date.slice(0, 7).split("-").map(Number);
    installmentSeq = (ty - sy) * 12 + (tm - sm) + 1;
  }

  // Desktop-only date column (hidden on mobile/tablet via CSS). Built from
  // the raw date components, not `new Date(tx.date)`, to avoid the UTC
  // parsing shift that a bare ISO date string triggers.
  const [dy, dmo, dd] = tx.date.split("-").map(Number);
  const dateLabel = new Date(dy, dmo - 1, dd).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    // Treat as swipe only if horizontal movement dominates
    if (dy < 20) {
      if (dx > SWIPE_THRESHOLD) {
        setSwiped(true);
        setOpen(false);
      } else if (dx < -20) setSwiped(false);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleDelete = () => {
    setSwiped(false);
    onDelete(tx.id);
  };

  const handleRowClick = () => {
    if (swiped) {
      setSwiped(false);
      return;
    }
    setOpen(!open);
  };

  return (
    <div
      className={`tx ${open ? "tx-open" : ""} ${swiped ? "tx-swiped" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        className="tx-swipe-del-btn"
        onClick={handleDelete}
        tabIndex={-1}
        aria-label="Delete"
      >
        <Trash2 size={16} />
      </button>
      <button className="tx-main" onClick={handleRowClick}>
        <div
          className="tx-icon"
          style={{ background: `${cat.color}1a`, color: cat.color }}
        >
          <Icon size={17} strokeWidth={2} />
        </div>
        <div className="tx-body">
          <div className="tx-title">
            {tx.note || cat.label}
            {cardName && tx.type !== "card-payment" && (
              <span className="tx-card-chip">
                <CreditCard size={9} /> {cardName}
              </span>
            )}
            {installmentPlan && installmentSeq && (
              <span className="tx-installment-chip">
                {installmentSeq}/{installmentPlan.totalMonths}
              </span>
            )}
          </div>
          <div className="tx-sub">
            {tx.type === "card-payment"
              ? `Payment → ${cardName}`
              : tx.type === "card-interest"
                ? `Interest/fees · ${cardName}`
                : tx.type === "card-purchase" && cardName
                  ? `${cat.label} · ${cardName}`
                  : cat.label}
          </div>
        </div>
        <div className="tx-date-col">{dateLabel}</div>
        <div className={`tx-amt ${color}`}>
          <span className="tx-amt-sign">{sign}</span>
          {CURRENCY} {fmt(tx.amount)}
        </div>
        <ChevronDown
          size={14}
          className={`disclosure-chevron tx-chevron ${open ? "open" : ""}`}
        />
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

export default memo(TxRow);
