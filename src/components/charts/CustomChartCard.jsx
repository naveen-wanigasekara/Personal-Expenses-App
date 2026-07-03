import { useContext, useMemo } from "react";
import { CurrencyCtx } from "../../context.js";
import { fmtCompact } from "../../utils/format.js";
import {
  aggregateTransactions,
  aggregateSingleValue,
  resolveChartColor,
} from "../../utils/chartData.js";
import BarChartWidget from "./BarChartWidget.jsx";
import TrendLineChart from "./TrendLineChart.jsx";
import DonutChart from "./DonutChart.jsx";
import ProgressStat from "./ProgressStat.jsx";

// Renders one user-defined chart: runs the config through the aggregation
// pipeline, then hands the result to whichever generic widget matches
// config.chartType, wrapped in the same .card/.card-hd chrome as every
// built-in Insights section so it's indistinguishable in placement.
export default function CustomChartCard({ config, transactions, allExpCats, allIncCats, cards }) {
  const CURRENCY = useContext(CurrencyCtx);
  const formatValue = (v) => `${CURRENCY} ${fmtCompact(v)}`;

  const result = useMemo(() => {
    const ctx = { allExpCats, allIncCats, cards };
    if (config.chartType === "progress") {
      return { single: aggregateSingleValue(transactions, config, ctx) };
    }
    return { grouped: aggregateTransactions(transactions, config, ctx) };
  }, [transactions, allExpCats, allIncCats, cards, config]);

  const isEmpty = result.single != null
    ? result.single === 0
    : result.grouped.series.every((s) => s.value === 0);

  return (
    <div className="card">
      <div className="card-hd">
        <h3>{config.name}</h3>
      </div>
      {isEmpty ? (
        <div className="empty">
          <div className="empty-title">No data</div>
          <div className="empty-sub">
            No transactions match this chart's filters for the selected range.
          </div>
        </div>
      ) : config.chartType === "progress" ? (
        <ProgressStat
          label={config.name}
          value={result.single}
          target={config.target}
          color={resolveChartColor(config.color)}
          formatValue={formatValue}
        />
      ) : config.chartType === "donut" ? (
        <DonutChart series={result.grouped.series} formatValue={formatValue} />
      ) : config.chartType === "line" ? (
        <TrendLineChart
          points={result.grouped.series.map((s) => ({ label: s.label, value: s.value }))}
          color={config.groupBy === "category" ? undefined : resolveChartColor(config.color)}
          formatValue={formatValue}
        />
      ) : (
        <BarChartWidget
          columns={result.grouped.series.map((s) => ({
            label: s.label,
            bars: [{ value: s.value, color: s.color }],
          }))}
        />
      )}
    </div>
  );
}
