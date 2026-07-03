import { useState, useEffect, useContext } from "react";
import { LineChart, Plus, Bell, Menu } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmtCompact } from "../utils/format.js";
import InvestmentTile from "./InvestmentTile.jsx";
import InvestmentDetailView from "./InvestmentDetailView.jsx";

export default function InvestmentsView({
  investments,
  valuations,
  onNew,
  onEdit,
  onDelete,
  onRecordValue,
  onEditValue,
  onDeleteValue,
  onOpenMenu,
  onOpenNotifications,
  notifCount,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  const totalInvested = investments.reduce((s, i) => s + (i.initialAmount || 0), 0);
  const totalValue = investments.reduce((s, i) => s + (i.currentValue || 0), 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPct = totalInvested ? (totalGain / totalInvested) * 100 : 0;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const currentSelected = selectedInvestment
    ? investments.find((i) => i.id === selectedInvestment.id)
    : null;

  return (
    <div className="view view-investments">
      <div
        className={`investments-master ${currentSelected ? "investments-master-hidden" : ""}`}
      >
        <div className="dash-topbar">
          <div className="mheader-left">
            <button className="icon-btn" onClick={onOpenMenu} aria-label="Menu">
              <Menu size={16} />
            </button>
          </div>
          <div className="mheader-center">
            <span className="mheader-title">Investments</span>
          </div>
          <div className="mheader-right">
            <button
              className="bell-btn"
              onClick={onOpenNotifications}
              aria-label="Notifications"
            >
              <Bell size={16} />
              {notifCount > 0 && (
                <span className="notif-badge">{notifCount}</span>
              )}
            </button>
          </div>
        </div>
        <div className="cards-header">
          <div className="page-hd">
            <div className="page-eyebrow">Portfolio</div>
            <h1 className="page-title">Investments</h1>
          </div>

          {investments.length > 0 && (
            <div className="summary-card">
              <div className="summary-row">
                <div className="summary-col">
                  <div className="summary-label">Total invested</div>
                  <div className="summary-val">
                    {CURRENCY} {fmtCompact(totalInvested)}
                  </div>
                </div>
                <div className="summary-divider" />
                <div className="summary-col">
                  <div className="summary-label">Current value</div>
                  <div className="summary-val in-color">
                    {CURRENCY} {fmtCompact(totalValue)}
                  </div>
                </div>
              </div>
              <div className="summary-savings">
                <span>Gain / Loss</span>
                <strong className={totalGain >= 0 ? "pos" : "neg"}>
                  {totalGain >= 0 ? "+" : "−"}
                  {CURRENCY} {fmtCompact(Math.abs(totalGain))} (
                  {totalGainPct >= 0 ? "+" : ""}
                  {totalGainPct.toFixed(1)}%)
                </strong>
              </div>
            </div>
          )}

          <button className="add-card-btn" onClick={onNew}>
            <Plus size={16} /> Add an investment
          </button>
        </div>

        <div className="cards-scroll">
          {investments.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">
                <LineChart size={26} strokeWidth={1.5} />
              </div>
              <div className="empty-title">No investments yet</div>
              <div className="empty-sub">
                Add an investment to start tracking your portfolio
              </div>
            </div>
          ) : (
            <div className="cards-stack">
              {investments.map((investment) => (
                <InvestmentTile
                  key={investment.id}
                  investment={investment}
                  onSelect={setSelectedInvestment}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {currentSelected && (
        <div className="investments-detail-pane">
          <InvestmentDetailView
            investment={currentSelected}
            valuations={valuations.filter(
              (v) => v.investmentId === currentSelected.id,
            )}
            onBack={() => setSelectedInvestment(null)}
            onEdit={() => onEdit(currentSelected)}
            onDelete={() => {
              onDelete(currentSelected.id);
              setSelectedInvestment(null);
            }}
            onRecordValue={() => onRecordValue(currentSelected)}
            onEditValue={(valuation) => onEditValue(currentSelected, valuation)}
            onDeleteValue={(valuation) =>
              onDeleteValue(currentSelected, valuation)
            }
          />
        </div>
      )}
    </div>
  );
}
