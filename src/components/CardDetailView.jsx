import { useContext, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  Edit2,
  Trash2,
} from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { CARD_COLORS } from "../constants/currencies.js";
import { fmt, fmtCompact, monthKey, monthLabel } from "../utils/format.js";
import TxRow from "./TxRow.jsx";

export default function CardDetailView({
  card,
  transactions,
  onBack,
  onEdit,
  onDelete,
  onDeleteTx,
  onEditTx,
  installmentPlans,
  onCancelPlan,
  allExpCats,
  allIncCats,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const [from, to] = card.colors || CARD_COLORS[0];
  const [viewMonth, setViewMonth] = useState(monthKey(new Date()));

  const now = new Date();
  const currentMk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const activePlans = (installmentPlans || []).filter(
    (p) => p.cardId === card.id && p.active,
  );
  const planElapsed = (plan) => {
    const [sy, sm] = plan.startMonth.split("-").map(Number);
    const [cy, cm] = currentMk.split("-").map(Number);
    return Math.min((cy - sy) * 12 + (cm - sm) + 1, plan.totalMonths);
  };

  const changeMonth = (dir) => {
    const [y, m] = viewMonth.split("-").map(Number);
    setViewMonth(monthKey(new Date(y, m - 1 + dir, 1)));
  };

  const todayMonth = monthKey(new Date());

  const currentOutstanding = transactions
    .filter((t) => monthKey(t.date) <= todayMonth)
    .reduce((sum, t) => {
      switch (t.type) {
        case "card-purchase":
        case "card-interest":
          return sum + Number(t.amount);

        case "card-payment":
          return sum - Number(t.amount);

        default:
          return sum;
      }
    }, 0);

  const util = card.limit ? (currentOutstanding / card.limit) * 100 : 0;
  const available = (+card.limit || 0) - currentOutstanding;

  const selectedMonthTx = transactions.filter(
    (t) => monthKey(t.date) === viewMonth,
  );
  const thisMonthPurchases = selectedMonthTx
    .filter((t) => t.type === "card-purchase")
    .reduce((s, t) => s + +t.amount, 0);
  const thisMonthPayments = selectedMonthTx
    .filter((t) => t.type === "card-payment")
    .reduce((s, t) => s + +t.amount, 0);
  const thisMonthInterest = selectedMonthTx
    .filter((t) => t.type === "card-interest")
    .reduce((s, t) => s + +t.amount, 0);
  const thisMonthNet =
    thisMonthPurchases + thisMonthInterest - thisMonthPayments;

  const grouped = Object.entries(
    selectedMonthTx.reduce((g, t) => {
      if (!g[t.date]) g[t.date] = [];
      g[t.date].push(t);
      return g;
    }, {}),
  ).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="view view-card-detail">
      <div className="detail-head">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={18} />
        </button>
        <div className="month-pill">
          <button onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span>{monthLabel(viewMonth)}</span>
          <button onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="detail-actions">
          <button className="icon-btn" onClick={onEdit}>
            <Edit2 size={14} />
          </button>
          <button
            className="icon-btn danger"
            onClick={() => {
              if (
                confirm(
                  `Delete ${card.name}? This won't delete linked transactions.`,
                )
              )
                onDelete();
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div
        className="ct-visual big"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div className="ct-vis-top">
          <span className="ct-bank">{card.name}</span>
          <CreditCard size={20} strokeWidth={1.5} />
        </div>
        <div className="ct-vis-mid">
          <div className="ct-vis-label">Balance</div>
          <div className="ct-vis-val big">
            {CURRENCY} {fmt(currentOutstanding)}
          </div>
        </div>
        <div className="ct-vis-bot">
          <div>
            <div className="ct-vis-label-sm">Available</div>
            <div className="ct-vis-val-sm">
              {CURRENCY} {fmt(available)}
            </div>
          </div>
          <div className="ct-vis-right">
            <div className="ct-vis-label-sm">Limit</div>
            <div className="ct-vis-val-sm">
              {CURRENCY} {fmt(+card.limit || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="ct-util card-detail-util">
        <div className="ct-util-top">
          <span>Utilization</span>
          <span className={util > 90 ? "over" : util > 70 ? "warn" : ""}>
            {util.toFixed(0)}%
          </span>
        </div>
        <div className="ct-util-bar">
          <div
            className={`ct-util-fill ${util > 90 ? "over" : util > 70 ? "warn" : ""}`}
            style={{ width: `${Math.min(util, 100)}%` }}
          />
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
          <div className="ds-val out-color">
            +{CURRENCY} {fmtCompact(thisMonthPurchases)}
          </div>
          <div className="ds-sub">{monthLabel(viewMonth)}</div>
        </div>
        <div className="ds-stat">
          <div className="ds-label">Payments</div>
          <div className="ds-val in-color">
            −{CURRENCY} {fmtCompact(thisMonthPayments)}
          </div>
          <div className="ds-sub">{monthLabel(viewMonth)}</div>
        </div>
        <div className="ds-stat">
          <div className="ds-label">Interest</div>
          <div className="ds-val warn-color">
            +{CURRENCY} {fmtCompact(thisMonthInterest)}
          </div>
          <div className="ds-sub">{monthLabel(viewMonth)}</div>
        </div>
      </div>

      {activePlans.length > 0 && (
        <>
          <div className="section-hd">
            <h2>Active Plans</h2>
            <span className="count">{activePlans.length}</span>
          </div>
          <div className="installment-plans-list">
            {activePlans.map((plan) => {
              const paid = planElapsed(plan);
              const remaining = plan.totalMonths - paid;
              return (
                <div key={plan.id} className="installment-plan-row">
                  <div className="ipr-info">
                    <div className="ipr-label">{plan.label}</div>
                    <div className="ipr-meta">
                      {CURRENCY} {fmtCompact(plan.monthlyAmount)}/mo · {paid}/
                      {plan.totalMonths} months
                    </div>
                    <div className="ipr-bar">
                      <div
                        className="ipr-fill"
                        style={{ width: `${(paid / plan.totalMonths) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button
                    className="ipr-cancel"
                    onClick={() => {
                      if (
                        confirm(
                          `Cancel "${plan.label}"? Past installments are kept. ${remaining} future installment(s) will be removed.`,
                        )
                      ) {
                        onCancelPlan(plan.id);
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="section-hd">
        <h2>Activity</h2>
        <span className="count">{selectedMonthTx.length}</span>
      </div>

      {currentOutstanding !== 0 && (
        <div className="monthly-total-banner">
          <span className="monthly-total-banner-lbl">Current Outstanding</span>
          <span className="monthly-total-banner-amt">
            {CURRENCY} {fmt(currentOutstanding)}
          </span>
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="empty-sm">
          {transactions.length === 0
            ? "No activity on this card yet"
            : `No activity for ${monthLabel(viewMonth)}`}
        </div>
      ) : (
        <div className="tx-list">
          {grouped.map(([date, items]) => {
            const [y, mo, d] = date.split("-").map(Number);
            const label = new Date(y, mo - 1, d).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const dayNet = items.reduce((s, t) => {
              if (t.type === "card-purchase" || t.type === "card-interest")
                return s + +t.amount;
              if (t.type === "card-payment") return s - +t.amount;
              return s;
            }, 0);
            return (
              <div key={date} className="tx-group">
                <div className="tx-date">
                  <span>{label}</span>
                  <span className="tx-date-total">
                    {dayNet < 0 ? "−" : "+"}
                    {CURRENCY} {fmt(Math.abs(dayNet))}
                  </span>
                </div>
                <div className="tx-stack">
                  {items.map((t) => (
                    <TxRow
                      key={t.id}
                      tx={t}
                      onDelete={onDeleteTx}
                      onEdit={onEditTx}
                      cardName={card.name}
                      allExpCats={allExpCats}
                      allIncCats={allIncCats}
                      installmentPlan={
                        t.installmentId
                          ? (installmentPlans || []).find(
                              (p) => p.id === t.installmentId,
                            )
                          : null
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
