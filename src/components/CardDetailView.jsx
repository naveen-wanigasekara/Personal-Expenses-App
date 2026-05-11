import { useContext } from "react";
import { ChevronLeft, CreditCard, AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { CARD_COLORS } from "../constants/currencies.js";
import { fmt, fmtCompact, monthKey } from "../utils/format.js";
import TxRow from "./TxRow.jsx";

export default function CardDetailView({ card, transactions, onBack, onEdit, onDelete, onDeleteTx }) {
  const CURRENCY = useContext(CurrencyCtx);
  const [from, to] = card.colors || CARD_COLORS[0];
  const util = card.limit ? (card.currentBalance / card.limit) * 100 : 0;
  const available = (+card.limit || 0) - card.currentBalance;
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const thisMonthTx = transactions.filter((t) => monthKey(t.date) === monthKey(new Date()));
  const thisMonthPurchases = thisMonthTx.filter((t) => t.type === "card-purchase").reduce((s, t) => s + +t.amount, 0);
  const thisMonthPayments = thisMonthTx.filter((t) => t.type === "card-payment").reduce((s, t) => s + +t.amount, 0);
  const thisMonthInterest = thisMonthTx.filter((t) => t.type === "card-interest").reduce((s, t) => s + +t.amount, 0);

  return (
    <div className="view view-card-detail">
      <div className="detail-head">
        <button className="back-btn" onClick={onBack}><ChevronLeft size={18} /></button>
        <div className="detail-actions">
          <button className="icon-btn" onClick={onEdit}><Edit2 size={14} /></button>
          <button className="icon-btn danger"
            onClick={() => { if (confirm(`Delete ${card.name}? This won't delete linked transactions.`)) onDelete(); }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="ct-visual big" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
        <div className="ct-vis-top">
          <span className="ct-bank">{card.name}</span>
          <CreditCard size={20} strokeWidth={1.5} />
        </div>
        <div className="ct-vis-mid">
          <div className="ct-vis-label">Balance</div>
          <div className="ct-vis-val big">{CURRENCY} {fmt(card.currentBalance)}</div>
        </div>
        <div className="ct-vis-bot">
          <div>
            <div className="ct-vis-label-sm">Available</div>
            <div className="ct-vis-val-sm">{CURRENCY} {fmt(available)}</div>
          </div>
          <div className="ct-vis-right">
            <div className="ct-vis-label-sm">Limit</div>
            <div className="ct-vis-val-sm">{CURRENCY} {fmt(+card.limit || 0)}</div>
          </div>
        </div>
      </div>

      <div className="ct-util card-detail-util">
        <div className="ct-util-top">
          <span>Utilization</span>
          <span className={util > 90 ? "over" : util > 70 ? "warn" : ""}>{util.toFixed(0)}%</span>
        </div>
        <div className="ct-util-bar">
          <div className={`ct-util-fill ${util > 90 ? "over" : util > 70 ? "warn" : ""}`}
            style={{ width: `${Math.min(util, 100)}%` }} />
        </div>
        {util > 70 && (
          <div className="util-warning">
            <AlertTriangle size={11} />
            <span>High utilization hurts credit score. Aim for under 30%.</span>
          </div>
        )}
      </div>

      <div className="detail-stats">
        <div className="ds-stat">
          <div className="ds-label">Purchases</div>
          <div className="ds-val out-color">+{CURRENCY} {fmtCompact(thisMonthPurchases)}</div>
          <div className="ds-sub">This month</div>
        </div>
        <div className="ds-stat">
          <div className="ds-label">Payments</div>
          <div className="ds-val in-color">−{CURRENCY} {fmtCompact(thisMonthPayments)}</div>
          <div className="ds-sub">This month</div>
        </div>
        <div className="ds-stat">
          <div className="ds-label">Interest</div>
          <div className="ds-val warn-color">+{CURRENCY} {fmtCompact(thisMonthInterest)}</div>
          <div className="ds-sub">This month</div>
        </div>
      </div>

      <div className="section-hd">
        <h2>Activity</h2>
        <span className="count">{sorted.length}</span>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-sm">No activity on this card yet</div>
      ) : (
        <div className="tx-stack">
          {sorted.map((t) => <TxRow key={t.id} tx={t} onDelete={onDeleteTx} cardName={card.name} />)}
        </div>
      )}
    </div>
  );
}
