// Shared SVG line-chart mark: fixed viewBox, area fill under the line, a
// trend-colored polyline, and a ring-marker on the last point. Originally
// hand-rolled twice (DashView's Net Worth Trend and InvestmentDetailView's
// Value Over Time chart, which was explicitly copy-adapted from it) —
// extracted here so both, plus any custom chart, share one implementation.
export default function TrendLineChart({
  points,
  color,
  width = 220,
  height = 52,
  showLabels = true,
  showMinMax = true,
  formatValue = (v) => String(Math.round(v)),
}) {
  if (!points || points.length < 2) return null;

  const vals = points.map((p) => p.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const PAD = 4;
  const coords = points.map((p, i) => [
    PAD + (i / (points.length - 1)) * (width - PAD * 2),
    PAD + (1 - (p.value - minV) / range) * (height - PAD * 2),
  ]);
  const pts = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];
  const areaPath = `M${coords[0][0].toFixed(1)},${height - PAD} L${pts.replaceAll(" ", " L")} L${lastX.toFixed(1)},${height - PAD} Z`;
  const first = points[0];
  const last = points[points.length - 1];
  const trending = last.value >= first.value;
  const lineColor = color || (trending ? "var(--in)" : "var(--out)");
  const zeroY =
    minV < 0 && maxV > 0
      ? PAD + (1 - (0 - minV) / range) * (height - PAD * 2)
      : null;

  // Skip labels adaptively so wide point counts (e.g. 12 months) don't
  // crowd the axis, while short series (e.g. 3 months) show every label.
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <>
      <svg className="nw-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {zeroY !== null && (
          <line x1={PAD} y1={zeroY} x2={width - PAD} y2={zeroY} stroke="var(--border-2)" strokeWidth="1" />
        )}
        <path d={areaPath} fill={lineColor} opacity="0.1" />
        <polyline
          points={pts}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={lastX} cy={lastY} r="3.5" fill={lineColor} />
        <circle cx={lastX} cy={lastY} r="3.5" fill="none" stroke="var(--surface)" strokeWidth="2" />
      </svg>
      {showLabels && (
        <div className="nw-labels">
          {points
            .filter((_, i) => i % labelStep === 0)
            .map((p, i) => (
              <span key={`${p.label}-${i}`}>{p.label}</span>
            ))}
        </div>
      )}
      {showMinMax && (
        <div className="nw-minmax">
          <span className={minV < 0 ? "out-color" : ""}>{formatValue(minV)}</span>
          <span className={last.value >= 0 ? "in-color" : "out-color"}>
            {formatValue(last.value)} now
          </span>
          <span className="in-color">{formatValue(maxV)}</span>
        </div>
      )}
    </>
  );
}
