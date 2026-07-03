import { useContext, memo } from "react";
import { LineChart } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmt, fmtCompact } from "../utils/format.js";
import { isFixedDeposit, getFdInfo } from "../utils/investmentCalc.js";

function InvestmentTile({ investment, onSelect }) {
  const CURRENCY = useContext(CurrencyCtx);
  const isFd = isFixedDeposit(investment);
  const fdInfo = isFd ? getFdInfo(investment) : null;
  const gain = investment.currentValue - investment.initialAmount;
  const gainPct = investment.initialAmount
    ? (gain / investment.initialAmount) * 100
    : 0;

  return (
    <button className="card-tile" onClick={() => onSelect(investment)}>
      <div className="ct-visual inv-visual">
        <div className="ct-vis-top">
          <span className="ct-bank">{investment.name}</span>
          {isFd ? (
            <span className={`fd-status ${fdInfo.isMatured ? "matured" : "active"}`}>
              {fdInfo.isMatured ? "Matured" : "Active"}
            </span>
          ) : (
            <LineChart size={18} strokeWidth={1.5} />
          )}
        </div>
        <div className="ct-vis-mid">
          <div className="ct-vis-label">{isFd ? "Principal" : "Current Value"}</div>
          <div className="ct-vis-val">
            {CURRENCY} {fmt(investment.currentValue)}
          </div>
        </div>
        <div className="ct-vis-bot">
          <div>
            <div className="ct-vis-label-sm">{investment.type || "Investment"}</div>
            <div className="ct-vis-val-sm">
              {CURRENCY} {fmtCompact(investment.initialAmount)} invested
            </div>
          </div>
        </div>
      </div>
      <div className="ct-util">
        <div className="ct-util-top">
          {isFd ? (
            <>
              <span>{fdInfo.perLabel ? `Payout / ${fdInfo.perLabel}` : "At maturity"}</span>
              <span className="in-color">
                {CURRENCY}{" "}
                {fmtCompact(
                  fdInfo.perLabel ? fdInfo.payoutPerPeriod : fdInfo.totalAtMaturity,
                )}
              </span>
            </>
          ) : (
            <>
              <span>Gain / Loss</span>
              <span className={gain >= 0 ? "in-color" : "out-color"}>
                {gain >= 0 ? "+" : "−"}
                {CURRENCY} {fmtCompact(Math.abs(gain))} ({gainPct >= 0 ? "+" : ""}
                {gainPct.toFixed(1)}%)
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export default memo(InvestmentTile);
