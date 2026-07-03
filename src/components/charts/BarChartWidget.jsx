// Shared bar-chart mark, generalizing DashView's Cashflow chart (.chart /
// .bar-col / .bar-wrap / .bar, percentage heights against a shared max)
// from its hardcoded income/expense pair to N columns of 1+ bars each, with
// dynamic per-bar colors instead of fixed .bar.in/.bar.out modifier classes.
export default function BarChartWidget({ columns, height = 150 }) {
  if (!columns || columns.length === 0) return null;
  const maxValue = Math.max(
    1,
    ...columns.flatMap((c) => c.bars.map((b) => Math.abs(b.value))),
  );
  // Beyond ~6 columns a dashboard card is too narrow for every label to show
  // in full (they'd truncate to 1-2 characters) — skip adaptively instead,
  // matching TrendLineChart's approach for the same problem. The default
  // 10px .chart gap (tuned for Cashflow's fixed 6 columns) also needs to
  // shrink at higher column counts, or hiding labels alone can't reclaim
  // enough width to keep even the visible ones from truncating.
  const labelStep = Math.max(1, Math.ceil(columns.length / 6));
  const gap = columns.length > 6 ? Math.max(3, 10 - (columns.length - 6)) : 10;

  return (
    <div className="chart" style={{ height, gap }}>
      {columns.map((col, i) => (
        <div key={i} className="bar-col">
          <div className="bar-wrap">
            {col.bars.map((bar, bi) => (
              <div
                key={bi}
                className="bar"
                style={{
                  height: `${(Math.abs(bar.value) / maxValue) * 100}%`,
                  background: bar.color,
                }}
              />
            ))}
          </div>
          <div className="bar-lbl">{i % labelStep === 0 ? col.label : ""}</div>
        </div>
      ))}
    </div>
  );
}
