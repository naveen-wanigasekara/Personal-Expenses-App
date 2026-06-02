import { useContext } from "react";
import { ChevronLeft, ChevronRight, CreditCard, AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { CARD_COLORS } from "../constants/currencies.js";
import { fmt, fmtCompact, monthKey, monthLabel } from "../utils/format.js";
import TxRow from "./TxRow.jsx";

export default function CardDetailView({ card, transactions, onBack, onEdit, onDelete, onDeleteTx, onEditTx, viewMonth, setViewMonth }) {
  const CURRENCY = useContext(CurrencyCtx);
  const [from, to] = card.colors || CARD_COLORS[0];

  const changeMonth = (dir) => {
    const [y, m] = viewMonth.split("-").map(Number);
    setViewMonth(monthKey(new Date(y, m - 1 + dir, 1)));
  };
  const util = card.limit ? (card.currentBalance / card.limit) * 100 : 0;
  const available = (+card.limit || 0) - card.currentBalance;
  const selectedMonthTx = transactions.filter((t) => monthKey(t.date) === viewMonth);
  const thisMonthPurchases = selectedMonthTx.filter((t) => t.type === "card-purchase").reduce((s, t) => s + +t.amount, 0);
  const thisMonthPayments = selectedMonthTx.filter((t) => t.type === "card-payment").reduce((s, t) => s + +t.amount, 0);
  const thisMonthInterest = selectedMonthTx.filter((t) => t.type === "card-interest").reduce((s, t) => s + +t.amount, 0);
  const thisMonthNet = thisMonthPurchases + thisMonthInterest - thisMonthPayments;

  const grouped = Object.entries(
    selectedMonthTx.reduce((g, t) => {
      if (!g[t.date]) g[t.date] = [];
      g[t.date].push(t);
      return g;
    }, {})
  ).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="view view-card-detail">
      <div className="detail-head">
        <button className="back-btn" onClick={onBack}><ChevronLeft size={18} /></button>
        <div className="month-pill">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
          <span>{monthLabel(viewMonth)}</span>
          <button onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
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
          <div className="ds-sub">{monthLabel(viewMonth)}</div>
        </div>
        <div className="ds-stat">
          <div className="ds-label">Payments</div>
          <div className="ds-val in-color">−{CURRENCY} {fmtCompact(thisMonthPayments)}</div>
          <div className="ds-sub">{monthLabel(viewMonth)}</div>
        </div>
        <div className="ds-stat">
          <div className="ds-label">Interest</div>
          <div className="ds-val warn-color">+{CURRENCY} {fmtCompact(thisMonthInterest)}</div>
          <div className="ds-sub">{monthLabel(viewMonth)}</div>
        </div>
      </div>

      <div className="section-hd">
        <h2>Activity</h2>
        <span className="count">{selectedMonthTx.length}</span>
      </div>

      {thisMonthNet !== 0 && (
        <div className="monthly-total-banner">
          <span className="monthly-total-banner-lbl">{monthLabel(viewMonth)} · Outstanding</span>
          <span className={`monthly-total-banner-amt ${thisMonthNet < 0 ? "in-color" : ""}`}>
            {thisMonthNet < 0 ? "−" : "+"}{CURRENCY} {fmt(Math.abs(thisMonthNet))}
          </span>
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="empty-sm">
          {transactions.length === 0 ? "No activity on this card yet" : `No activity for ${monthLabel(viewMonth)}`}
        </div>
      ) : (
        <div className="tx-list">
          {grouped.map(([date, items]) => {
            const [y, mo, d] = date.split("-").map(Number);
            const label = new Date(y, mo - 1, d).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric",
            });
            const dayNet = items.reduce((s, t) => {
              if (t.type === "card-purchase" || t.type === "card-interest") return s + +t.amount;
              if (t.type === "card-payment") return s - +t.amount;
              return s;
            }, 0);
            return (
              <div key={date} className="tx-group">
                <div className="tx-date">
                  <span>{label}</span>
                  <span className="tx-date-total">{dayNet < 0 ? "−" : "+"}{CURRENCY} {fmt(Math.abs(dayNet))}</span>
                </div>
                <div className="tx-stack">
                  {items.map((t) => <TxRow key={t.id} tx={t} onDelete={onDeleteTx} onEdit={onEditTx} cardName={card.name} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
