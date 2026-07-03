import { useContext } from "react";
import {
  ChevronLeft,
  LineChart,
  Edit2,
  Trash2,
  Plus,
} from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmt, fmtCompact } from "../utils/format.js";
import { isFixedDeposit, getFdInfo } from "../utils/investmentCalc.js";
import TrendLineChart from "./charts/TrendLineChart.jsx";

function fmtDate(dateStr) {
  if (!dateStr) return null;
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvestmentDetailView({
  investment,
  valuations,
  onBack,
  onEdit,
  onDelete,
  onRecordValue,
  onEditValue,
  onDeleteValue,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const isFd = isFixedDeposit(investment);
  const fdInfo = isFd ? getFdInfo(investment) : null;

  const gain = investment.currentValue - investment.initialAmount;
  const gainPct = investment.initialAmount
    ? (gain / investment.initialAmount) * 100
    : 0;

  const sorted = [...valuations].sort((a, b) =>
    a.recordedDate.localeCompare(b.recordedDate),
  );
  const reverseChron = [...sorted].reverse();

  const startLabel = fmtDate(investment.startDate);

  return (
    <div className="view view-investment-detail">
      <div className="detail-head">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={18} />
        </button>
        <div className="detail-head-title">{investment.name}</div>
        <div className="detail-actions">
          <button className="icon-btn" onClick={onEdit}>
            <Edit2 size={14} />
          </button>
          <button
            className="icon-btn danger"
            onClick={() => {
              if (
                confirm(
                  `Delete ${investment.name}? This will also remove its value history.`,
                )
              )
                onDelete();
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="ct-visual big inv-visual">
        <div className="ct-vis-top">
          <span className="ct-bank">{investment.name}</span>
          {isFd ? (
            <span className={`fd-status ${fdInfo.isMatured ? "matured" : "active"}`}>
              {fdInfo.isMatured ? "Matured" : "Active"}
            </span>
          ) : (
            <LineChart size={20} strokeWidth={1.5} />
          )}
        </div>
        <div className="ct-vis-mid">
          <div className="ct-vis-label">
            {isFd ? "Principal" : "Current Value"}
          </div>
          <div className="ct-vis-val big">
            {CURRENCY} {fmt(investment.currentValue)}
          </div>
        </div>
        <div className="ct-vis-bot">
          <div>
            <div className="ct-vis-label-sm">{investment.type || "Investment"}</div>
            <div className="ct-vis-val-sm">
              {CURRENCY} {fmt(investment.initialAmount)} invested
            </div>
          </div>
          <div className="ct-vis-right">
            <div className="ct-vis-label-sm">{isFd ? "Matures" : "Since"}</div>
            <div className="ct-vis-val-sm">
              {isFd ? fmtDate(fdInfo.maturityDate) : startLabel}
            </div>
          </div>
        </div>
      </div>

      {isFd ? (
        <div className="detail-stats">
          <div className="ds-stat">
            <div className="ds-label">Invested</div>
            <div className="ds-val">
              {CURRENCY} {fmtCompact(investment.initialAmount)}
            </div>
          </div>
          <div className="ds-stat">
            <div className="ds-label">
              {fdInfo.perLabel ? `Payout / ${fdInfo.perLabel}` : "At maturity"}
            </div>
            <div className="ds-val in-color">
              {CURRENCY}{" "}
              {fmtCompact(
                fdInfo.perLabel ? fdInfo.payoutPerPeriod : fdInfo.totalAtMaturity,
              )}
            </div>
          </div>
          <div className="ds-stat">
            <div className="ds-label">
              {fdInfo.isMatured ? "Total Earned" : "Earned to Date"}
            </div>
            <div className="ds-val in-color">
              {CURRENCY} {fmtCompact(fdInfo.totalEarned)}
            </div>
          </div>
        </div>
      ) : (
        <div className="detail-stats">
          <div className="ds-stat">
            <div className="ds-label">Invested</div>
            <div className="ds-val">
              {CURRENCY} {fmtCompact(investment.initialAmount)}
            </div>
          </div>
          <div className="ds-stat">
            <div className="ds-label">Gain / Loss</div>
            <div className={`ds-val ${gain >= 0 ? "in-color" : "out-color"}`}>
              {gain >= 0 ? "+" : "−"}
              {CURRENCY} {fmtCompact(Math.abs(gain))}
            </div>
          </div>
          <div className="ds-stat">
            <div className="ds-label">Return</div>
            <div className={`ds-val ${gainPct >= 0 ? "in-color" : "out-color"}`}>
              {gainPct >= 0 ? "+" : ""}
              {gainPct.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {isFd && !fdInfo.isMatured && fdInfo.nextPayoutDate && (
        <div className="hint" style={{ marginBottom: 16 }}>
          Next payout: {fmtDate(fdInfo.nextPayoutDate)} — {CURRENCY}{" "}
          {fmt(fdInfo.payoutPerPeriod)}
        </div>
      )}
      {isFd && fdInfo.isMatured && (
        <div className="hint" style={{ marginBottom: 16 }}>
          This deposit matured on {fmtDate(fdInfo.maturityDate)}. Total
          interest earned: {CURRENCY} {fmt(fdInfo.totalEarned)}.
        </div>
      )}

      {investment.notes && (
        <div className="hint" style={{ marginBottom: 16 }}>
          {investment.notes}
        </div>
      )}

      {sorted.length >= 2 &&
        (() => {
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const trending = last.value >= first.value;
          return (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-hd">
                <h3>Value Over Time</h3>
                <span className={`card-sub ${trending ? "in-color" : "out-color"}`}>
                  {trending ? "↑" : "↓"} {CURRENCY} {fmtCompact(Math.abs(last.value - first.value))}
                </span>
              </div>
              <TrendLineChart
                points={sorted}
                width={280}
                height={64}
                showLabels={false}
                formatValue={(v) => `${CURRENCY} ${fmtCompact(v)}`}
              />
            </div>
          );
        })()}

      <div className="section-hd">
        <h2>Value History</h2>
        <span className="count">{reverseChron.length}</span>
        <button
          className="ipr-cancel"
          style={{ marginLeft: "auto" }}
          onClick={onRecordValue}
        >
          <Plus size={13} /> Record value
        </button>
      </div>

      {reverseChron.length === 0 ? (
        <div className="empty-sm">No value history yet</div>
      ) : (
        <div className="tx-list">
          <div className="tx-stack">
            {reverseChron.map((v, idx) => {
              const prev = sorted[sorted.indexOf(v) - 1];
              const delta = prev ? v.value - prev.value : null;
              const [y, mo, d] = v.recordedDate.split("-").map(Number);
              const label = new Date(y, mo - 1, d).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const isOnlyEntry = reverseChron.length <= 1;
              return (
                <div key={v.id} className="notif-item">
                  <div className="notif-icon notif-icon-card">
                    <LineChart size={14} />
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">{label}</div>
                    {delta != null && (
                      <div className="notif-meta">
                        <span className={delta >= 0 ? "in-color" : "out-color"}>
                          {delta >= 0 ? "+" : "−"}
                          {CURRENCY} {fmt(Math.abs(delta))} vs previous
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="notif-amt">
                    {CURRENCY} {fmt(v.value)}
                  </div>
                  <div className="value-history-actions">
                    <button
                      className="manage-cat-btn"
                      onClick={() => onEditValue(v)}
                      aria-label="Edit value"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="manage-cat-btn danger"
                      disabled={isOnlyEntry}
                      title={
                        isOnlyEntry
                          ? "Can't delete the only value on record"
                          : "Delete"
                      }
                      onClick={() => {
                        if (confirm("Delete this recorded value?"))
                          onDeleteValue(v);
                      }}
                      aria-label="Delete value"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

