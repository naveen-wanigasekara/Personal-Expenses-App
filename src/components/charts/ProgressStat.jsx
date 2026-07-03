// Generalizes DashView's Budget Progress bar (.pi-track/.pi-fill,
// DashView.jsx budget_pulse section) from a hardcoded income/expense pair
// into a single reusable big-number + bar-vs-target widget.
export default function ProgressStat({
  label,
  value,
  target,
  color = "var(--in)",
  formatValue = (v) => String(Math.round(v)),
}) {
  const hasTarget = target != null && target > 0;
  const pct = hasTarget ? (value / target) * 100 : null;
  // Same 80%/100% warn/over thresholds as the Budget Progress bars this is
  // generalized from, so a custom progress chart reads consistently with
  // every other target-vs-actual bar in the app.
  const overWarn = pct == null ? "" : pct > 100 ? "over" : pct > 80 ? "warn" : "";

  return (
    <div className="pulse-item">
      <div className="pi-top">
        <span className="pi-label">{label}</span>
        {pct != null && (
          <span className={`pi-pct ${overWarn || (pct >= 100 ? "good" : "")}`}>
            {pct.toFixed(0)}%
          </span>
        )}
      </div>
      {hasTarget && (
        <div className="pi-track">
          <div
            className="pi-fill"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: overWarn === "over" ? "var(--danger)" : overWarn === "warn" ? "var(--warn)" : color,
            }}
          />
        </div>
      )}
      <div className="pi-foot">
        <span>
          {formatValue(value)}
          {hasTarget && ` / ${formatValue(target)}`}
        </span>
      </div>
    </div>
  );
}
