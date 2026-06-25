import { useContext } from "react";
import { CreditCard } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { CARD_COLORS } from "../constants/currencies.js";
import { fmt, fmtCompact } from "../utils/format.js";

export default function CardTile({ card, onClick, installmentTotal }) {
  const CURRENCY = useContext(CurrencyCtx);
  const util = card.limit ? (card.currentBalance / card.limit) * 100 : 0;
  const [from, to] = card.colors || CARD_COLORS[0];
  const available = (+card.limit || 0) - card.currentBalance;

  return (
    <button className="card-tile" onClick={onClick}>
      <div
        className="ct-visual"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div className="ct-vis-top">
          <span className="ct-bank">{card.name}</span>
          <CreditCard size={18} strokeWidth={1.5} />
        </div>
        <div className="ct-vis-mid">
          <div className="ct-vis-label">Outstanding Balance</div>
          <div className="ct-vis-val">
            {CURRENCY} {fmt(card.currentBalance)}
          </div>
        </div>
        <div className="ct-vis-bot">
          <div>
            <div className="ct-vis-label-sm">Available to Spend</div>
            <div className="ct-vis-val-sm">
              {CURRENCY} {fmtCompact(available)}
            </div>
          </div>
          <div className="ct-vis-right">
            <div className="ct-vis-label-sm">Limit</div>
            <div className="ct-vis-val-sm">
              {CURRENCY} {fmtCompact(+card.limit || 0)}
            </div>
          </div>
        </div>
      </div>
      <div className="ct-util">
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
        {installmentTotal > 0 && (
          <div className="ct-installment-note">
            {CURRENCY} {fmtCompact(installmentTotal)} in active plans
          </div>
        )}
      </div>
    </button>
  );
}
