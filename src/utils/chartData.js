import { monthKey } from "./format.js";
import { getCat, isSpendableExpense } from "../constants/categories.js";

// The six semantic chart tokens already used by every hand-rolled chart in
// the app (Cashflow legend, budget bars, card utilization) — reused here so
// a custom chart never introduces a color outside the existing palette.
export const CHART_COLOR_TOKENS = [
  "in",
  "out",
  "bud",
  "warn",
  "danger",
  "neutral",
];

export function resolveChartColor(colorToken) {
  return `var(--${CHART_COLOR_TOKENS.includes(colorToken) ? colorToken : "neutral"})`;
}

const TX_TYPE_FILTERS = {
  all: () => true,
  income: (t) => t.type === "income",
  expense: (t) =>
    t.type === "expense" || t.type === "card-purchase" || t.type === "card-interest",
  card: (t) =>
    t.type === "card-purchase" || t.type === "card-payment" || t.type === "card-interest",
};

function shortMonthLabel(mk) {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

// Explicit month lists for the fixed-width ranges so empty months still show
// up as zero-value buckets (matching DashView's last6 pattern) instead of
// silently disappearing when a month has no matching transactions.
function monthsForRange(range, now) {
  if (range === "this_month") return [monthKey(now)];
  const n = { "3m": 3, "6m": 6, "12m": 12 }[range];
  if (!n) return null; // "this_year" / "all" — no fixed list
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
}

function inDateRange(t, range, now) {
  const tk = monthKey(t.date);
  if (range === "all") return true;
  if (range === "this_year") return tk.slice(0, 4) === String(now.getFullYear());
  const months = monthsForRange(range, now);
  return months ? months.includes(tk) : true;
}

function effectiveCategory(t, allExpCats, allIncCats) {
  if (t.type === "card-payment") return null;
  const type = t.type === "income" ? "income" : "expense";
  return getCat(t.category, type, allExpCats, allIncCats);
}

function filterTransactions(transactions, config, { allExpCats, allIncCats }, now) {
  const { txType, categoryIds, range } = config;
  let rows = transactions.filter(TX_TYPE_FILTERS[txType] || TX_TYPE_FILTERS.all);
  // Exclude Savings-tagged expenses, matching isSpendableExpense's use
  // everywhere else "spending" is computed (Cashflow, category breakdown).
  if (txType === "expense") {
    rows = rows.filter((t) => isSpendableExpense(t, allExpCats, allIncCats));
  }
  rows = rows.filter((t) => inDateRange(t, range, now));
  if (categoryIds && categoryIds.length > 0) {
    rows = rows.filter((t) => {
      const cat = effectiveCategory(t, allExpCats, allIncCats);
      return cat && categoryIds.includes(cat.id);
    });
  }
  return rows;
}

function metricValue(amounts, metric) {
  if (amounts.length === 0) return 0;
  const sum = amounts.reduce((s, v) => s + v, 0);
  if (metric === "count") return amounts.length;
  if (metric === "average") return sum / amounts.length;
  return sum;
}

// Buckets filtered transactions by config.groupBy and reduces each bucket by
// config.metric — used by Bar/Line/Donut widgets. Returns
// { labels, series: [{ key, label, value, color }] }.
export function aggregateTransactions(transactions, config, ctx, now = new Date()) {
  const rows = filterTransactions(transactions, config, ctx, now);
  const buckets = new Map();

  if (config.groupBy === "month") {
    (monthsForRange(config.range, now) || []).forEach((mk) =>
      buckets.set(mk, { label: shortMonthLabel(mk), amounts: [] }),
    );
  }

  rows.forEach((t) => {
    let key, label, catColor;
    if (config.groupBy === "month") {
      key = monthKey(t.date);
      label = shortMonthLabel(key);
    } else if (config.groupBy === "category") {
      const cat = effectiveCategory(t, ctx.allExpCats, ctx.allIncCats);
      if (!cat) return;
      key = cat.id;
      label = cat.label;
      catColor = cat.color;
    } else {
      key = t.cardId || "cash";
      label = t.cardId
        ? (ctx.cards || []).find((c) => c.id === t.cardId)?.name || "Card"
        : "Cash";
    }
    if (!buckets.has(key)) buckets.set(key, { label, color: catColor, amounts: [] });
    buckets.get(key).amounts.push(+t.amount);
  });

  let entries = Array.from(buckets.entries()).map(([key, b]) => ({
    key,
    label: b.label,
    value: metricValue(b.amounts, config.metric),
    color: b.color || resolveChartColor(config.color),
  }));

  entries =
    config.groupBy === "month"
      ? entries.sort((a, b) => a.key.localeCompare(b.key))
      : entries.sort((a, b) => b.value - a.value);

  return { labels: entries.map((e) => e.label), series: entries };
}

// Progress charts have no grouping — one aggregate number over the whole
// filtered set, compared against config.target.
export function aggregateSingleValue(transactions, config, ctx, now = new Date()) {
  const rows = filterTransactions(transactions, config, ctx, now);
  const amounts = rows.map((t) => +t.amount);
  return metricValue(amounts, config.metric);
}
