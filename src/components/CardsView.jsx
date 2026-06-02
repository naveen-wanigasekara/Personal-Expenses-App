import { useState, useEffect, useContext } from "react";
import { CreditCard, Plus } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmt, fmtCompact } from "../utils/format.js";
import CardTile from "./CardTile.jsx";
import CardDetailView from "./CardDetailView.jsx";

export default function CardsView({ cards, transactions, onEdit, onNew, onDelete, onDeleteTx, onEditTx, viewMonth, setViewMonth }) {
  const CURRENCY = useContext(CurrencyCtx);
  const [selectedCard, setSelectedCard] = useState(null);
  const totalDebt = cards.reduce((s, c) => s + (c.currentBalance || 0), 0);
  const totalLimit = cards.reduce((s, c) => s + (+c.limit || 0), 0);
  const totalAvailable = totalLimit - totalDebt;
  const totalUtil = totalLimit ? (totalDebt / totalLimit) * 100 : 0;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const currentSelected = selectedCard ? cards.find((c) => c.id === selectedCard.id) : null;

  if (currentSelected) {
    return (
      <CardDetailView card={currentSelected}
        transactions={transactions.filter((t) => t.cardId === currentSelected.id)}
        onBack={() => setSelectedCard(null)}
        onEdit={() => onEdit(currentSelected)}
        onDelete={() => { onDelete(currentSelected.id); setSelectedCard(null); }}
        onDeleteTx={onDeleteTx}
        onEditTx={onEditTx}
        viewMonth={viewMonth}
        setViewMonth={setViewMonth} />
    );
  }

  return (
    <div className="view view-cards">
      <div className="cards-header">
        <div className="page-hd">
          <div className="page-eyebrow">Credit</div>
          <h1 className="page-title">Cards</h1>
        </div>

        {cards.length > 0 && (
          <div className="summary-card">
            <div className="summary-row">
              <div className="summary-col">
                <div className="summary-label">Total debt</div>
                <div className="summary-val out-color">{CURRENCY} {fmtCompact(totalDebt)}</div>
              </div>
              <div className="summary-divider" />
              <div className="summary-col">
                <div className="summary-label">Available</div>
                <div className="summary-val in-color">{CURRENCY} {fmtCompact(totalAvailable)}</div>
              </div>
            </div>
            <div className="summary-savings">
              <span>Utilization</span>
              <strong className={totalUtil > 70 ? "neg" : "pos"}>
                {totalUtil.toFixed(0)}% of {CURRENCY} {fmtCompact(totalLimit)}
              </strong>
            </div>
          </div>
        )}

        <button className="add-card-btn" onClick={onNew}>
          <Plus size={16} /> Add a card
        </button>
      </div>

      <div className="cards-scroll">
        {cards.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><CreditCard size={26} strokeWidth={1.5} /></div>
            <div className="empty-title">No cards yet</div>
            <div className="empty-sub">Add a card to start tracking</div>
          </div>
        ) : (
          <div className="cards-stack">
            {cards.map((card) => (
              <CardTile key={card.id} card={card} onClick={() => setSelectedCard(card)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
