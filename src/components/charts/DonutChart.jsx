// New chart mark (no prior precedent in the app) — a ring built from
// stacked SVG circle strokes via strokeDasharray/strokeDashoffset, one
// segment per series entry, with a centered total and a legend list below.
export default function DonutChart({
  series,
  size = 140,
  strokeWidth = 18,
  formatValue = (v) => String(Math.round(v)),
  centerLabel,
}) {
  if (!series || series.length === 0) return null;
  const total = series.reduce((s, d) => s + Math.abs(d.value), 0);
  if (total === 0) return null;

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;
  const segments = series.map((d) => {
    const pct = Math.abs(d.value) / total;
    const dash = pct * circumference;
    const seg = { ...d, dash, offset: -cumulative };
    cumulative += dash;
    return seg;
  });

  return (
    <div className="donut-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--bg-2)"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={seg.offset}
            />
          ))}
        </g>
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle" className="donut-center-label">
          {centerLabel ?? formatValue(total)}
        </text>
      </svg>
      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="donut-legend-row">
            <span className="dot" style={{ background: seg.color }} />
            <span className="donut-legend-label">{seg.label}</span>
            <span className="donut-legend-value">{formatValue(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
