import { useState, useEffect, useContext, useRef } from "react";
import {
  X,
  ArrowDown,
  ArrowUp,
  CreditCard,
  Percent,
  LucideDollarSign,
  Repeat,
  AlertTriangle,
} from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { CARD_COLORS } from "../constants/currencies.js";
import { getCat } from "../constants/categories.js";
import { fmtCompact } from "../utils/format.js";
import { loadLastCategory, saveLastCategory } from "../utils/storage.js";

export default function AddModal({
  cards,
  onClose,
  onSave,
  onSaveInstallment,
  allExpCats,
  allIncCats,
  onAddCat,
  editing,
  userId,
  installmentPlans,
}) {
  const isEditing = !!editing;
  const CURRENCY = useContext(CurrencyCtx);
  const amountUserEdited = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const [type, setType] = useState(editing?.type || "expense");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [category, setCategory] = useState(editing?.category || "loan");
  const [note, setNote] = useState(editing?.note || "");
  const [date, setDate] = useState(() => {
    if (editing?.date) return editing.date;
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  });
  const [cardId, setCardId] = useState(editing?.cardId || cards[0]?.id || "");
  const [isInstallment, setIsInstallment] = useState(false);
  const [installLabel, setInstallLabel] = useState("");
  const [installMonths, setInstallMonths] = useState("12");
  const [installStartMonth, setInstallStartMonth] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
  });

  const [displayAmount, setDisplayAmount] = useState(() => {
    if (!editing) return "";
    const n = Number(editing.amount);
    if (!n) return "";
    const [i, d] = n.toFixed(2).split(".");
    return parseInt(i, 10).toLocaleString("en-US") + "." + d;
  });

  const isCardType =
    type === "card-purchase" ||
    type === "card-payment" ||
    type === "card-interest";

  const cats =
    type === "income"
      ? allIncCats
      : type === "card-interest"
        ? [getCat("card-interest", "expense")]
        : type === "card-payment"
          ? []
          : allExpCats;

  // Restore last-used category when type changes; auto-suggest card-payment amount
  useEffect(() => {
    if (isEditing) return;
    amountUserEdited.current = false;

    if (type === "card-payment") {
      setCategory("");
      if (type !== "card-purchase") setIsInstallment(false);
      return;
    }
    if (type === "card-interest") {
      setCategory("card-interest");
      setIsInstallment(false);
      return;
    }

    const validCats = type === "income" ? allIncCats : allExpCats;
    const defaults = {
      income: "fixed",
      expense: "loan",
      "card-purchase": "loan",
    };
    const last = userId ? loadLastCategory(userId, type) : null;
    const isValid = last && validCats.find((c) => c.id === last);
    setCategory(isValid ? last : defaults[type] || "loan");

    if (type !== "card-purchase") setIsInstallment(false);
  }, [type]);

  // Auto-suggest outstanding balance when card-payment is selected or card changes
  useEffect(() => {
    if (type !== "card-payment" || isEditing || amountUserEdited.current)
      return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.currentBalance <= 0) return;
    const bal = card.currentBalance.toFixed(2);
    setAmount(bal);
    const [i, d] = bal.split(".");
    setDisplayAmount(parseInt(i, 10).toLocaleString("en-US") + "." + d);
  }, [type, cardId]);

  useEffect(() => {
    if (isCardType && cards.length > 0 && !cardId) setCardId(cards[0].id);
  }, [type, cards, cardId, isCardType]);

  // Persist last-used category when it changes
  useEffect(() => {
    if (
      !isEditing &&
      userId &&
      category &&
      type !== "card-payment" &&
      type !== "card-interest"
    ) {
      saveLastCategory(userId, type, category);
    }
  }, [category]);

  const handleSave = () => {
    if (isInstallment) {
      if (
        !amount ||
        +amount <= 0 ||
        !installLabel.trim() ||
        +installMonths < 1 ||
        !cardId
      )
        return;
      onSaveInstallment({
        label: installLabel.trim(),
        monthlyAmount: +amount,
        totalMonths: +installMonths,
        startMonth: installStartMonth,
        category,
        cardId,
      });
      return;
    }
    if (!amount || +amount <= 0) return;
    if (isCardType && !cardId) return;
    const tx = { type, amount: +amount, note, date };
    if (type === "income") tx.category = category;
    else if (type === "expense") tx.category = category;
    else if (type === "card-purchase") {
      tx.category = category;
      tx.cardId = cardId;
    } else if (type === "card-interest") {
      tx.category = "card-interest";
      tx.cardId = cardId;
    } else if (type === "card-payment") {
      tx.cardId = cardId;
    }
    onSave(tx);
  };

  const handleAmountChange = (e) => {
    amountUserEdited.current = true;
    const raw = e.target.value.replace(/,/g, "");
    if (!/^\d*\.?\d*$/.test(raw)) return;
    setAmount(raw);
    const parts = raw.split(".");
    const intPart = parts[0]
      ? parseInt(parts[0], 10).toLocaleString("en-US")
      : "";
    setDisplayAmount(raw.includes(".") ? intPart + "." + parts[1] : intPart);
  };

  const valid = isInstallment
    ? amount &&
      +amount > 0 &&
      installLabel.trim() &&
      +installMonths >= 1 &&
      cardId
    : amount && +amount > 0 && (!isCardType || cardId);

  // Installment limit warning
  const selectedCard = cards.find((c) => c.id === cardId);
  const planTotal =
    isInstallment && +amount > 0 && +installMonths > 0
      ? +amount * +installMonths
      : 0;
  const availableCredit = selectedCard
    ? (+selectedCard.limit || 0) - selectedCard.currentBalance
    : 0;
  const exceedsLimit =
    isInstallment &&
    planTotal > 0 &&
    selectedCard?.limit &&
    planTotal > availableCredit;

  const typeOptions = [
    { id: "income", label: "Income", icon: ArrowDown },
    { id: "expense", label: "Cash Purchase", icon: LucideDollarSign },
    {
      id: "card-purchase",
      label: "Card Purchase",
      icon: CreditCard,
      needCard: true,
    },
    {
      id: "card-payment",
      label: "Card Payment",
      icon: CreditCard,
      needCard: true,
    },
    {
      id: "card-interest",
      label: "Card Interest",
      icon: Percent,
      needCard: true,
    },
  ];
  const availableTypes = typeOptions.filter(
    (t) => !t.needCard || cards.length > 0,
  );

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>{isEditing ? "Edit entry" : "New entry"}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="type-chips">
          {availableTypes.map((t) => {
            const Ic = t.icon;
            return (
              <button
                key={t.id}
                className={`type-chip ${type === t.id ? "active" : ""} ${t.id.startsWith("card") ? "card" : ""}`}
                onClick={() => setType(t.id)}
              >
                <Ic size={12} strokeWidth={2.5} />
                {t.label}
              </button>
            );
          })}
        </div>

        {cards.length === 0 && (
          <div className="hint" style={{ marginBottom: 12 }}>
            Add a card in the Cards tab to record card transactions.
          </div>
        )}

        {isEditing && editing?.installmentId && (
          <div className="hint warn-hint">
            <AlertTriangle size={13} /> This transaction is part of an
            installment plan — editing it here won't update the plan's monthly
            amount.
          </div>
        )}

        {type === "card-purchase" && !isEditing && (
          <button
            className={`installment-toggle ${isInstallment ? "active" : ""}`}
            onClick={() => setIsInstallment(!isInstallment)}
          >
            <Repeat size={13} strokeWidth={2.5} />
            Split into installments
          </button>
        )}

        <div className="amount-input">
          <span className="amt-cur">{CURRENCY}</span>
          <input
            type="text"
            value={displayAmount}
            onChange={handleAmountChange}
            placeholder="0.00"
            autoFocus
            inputMode="decimal"
          />
        </div>

        {type === "card-payment" && (
          <div className="hint" style={{ marginTop: 8 }}>
            This reduces your card balance — it's not a new expense (the
            purchases were already recorded).
          </div>
        )}

        {isInstallment && (
          <>
            <label className="field-lbl">What is this for?</label>
            <input
              type="text"
              className="text-input"
              value={installLabel}
              onChange={(e) => setInstallLabel(e.target.value)}
              placeholder="e.g. Samsung TV"
              autoFocus
            />
            <label className="field-lbl">Number of months</label>
            <input
              type="number"
              className="text-input"
              value={installMonths}
              onChange={(e) => setInstallMonths(e.target.value)}
              min="2"
              max="120"
              placeholder="12"
            />
            <label className="field-lbl">Start month</label>
            <input
              type="month"
              className="text-input"
              value={installStartMonth}
              onChange={(e) => setInstallStartMonth(e.target.value)}
            />
            {amount && installMonths && +installMonths > 0 && (
              <div className="installment-total">
                Total: {CURRENCY} {fmtCompact(+amount * +installMonths)}
              </div>
            )}
            {exceedsLimit && (
              <div className="hint warn-hint">
                <AlertTriangle size={13} /> Plan total ({CURRENCY}{" "}
                {fmtCompact(planTotal)}) exceeds available credit ({CURRENCY}{" "}
                {fmtCompact(availableCredit)}).
              </div>
            )}
          </>
        )}

        {isCardType && cards.length > 0 && (
          <>
            <label className="field-lbl">Card</label>
            <div className="card-picker">
              {cards.map((c) => {
                const [from, to] = c.colors || CARD_COLORS[0];
                return (
                  <button
                    key={c.id}
                    className={`cp-btn ${cardId === c.id ? "active" : ""}`}
                    onClick={() => setCardId(c.id)}
                    style={{
                      borderColor: cardId === c.id ? to : "transparent",
                    }}
                  >
                    <div
                      className="cp-swatch"
                      style={{
                        background: `linear-gradient(135deg, ${from}, ${to})`,
                      }}
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
          </>
        )}

        {cats.length > 0 &&
          type !== "card-interest" &&
          type !== "card-payment" && (
            <>
              <label className="field-lbl">Category</label>
              <div className="cat-grid">
                {cats.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.id;
                  return (
                    <button
                      key={c.id}
                      className={`cat-btn ${active ? "active" : ""}`}
                      onClick={() => setCategory(c.id)}
                      style={
                        active
                          ? { borderColor: c.color, background: `${c.color}14` }
                          : {}
                      }
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
            </>
          )}

        {!isInstallment && (
          <>
            <label className="field-lbl">Note</label>
            <input
              type="text"
              className="text-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional description"
            />
            <label className="field-lbl">Date</label>
            <input
              type="date"
              className="text-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </>
        )}

        <button
          className={`save-btn ${!valid ? "disabled" : ""}`}
          onClick={handleSave}
          disabled={!valid}
        >
          {isInstallment
            ? "Create Plan"
            : isEditing
              ? "Save changes"
              : "Record"}
        </button>
      </div>
    </div>
  );
}
