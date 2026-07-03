import { useContext, useState } from "react";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Target as TargetIcon,
  Check,
} from "lucide-react";
import { CurrencyCtx } from "../context.js";
import Sheet from "./Sheet.jsx";
import AmountInput from "./AmountInput.jsx";
import CustomChartCard from "./charts/CustomChartCard.jsx";
import { CHART_COLOR_TOKENS } from "../utils/chartData.js";

const CHART_TYPES = [
  { id: "bar", label: "Bar", icon: BarChart3 },
  { id: "line", label: "Line", icon: LineChartIcon },
  { id: "donut", label: "Donut", icon: PieChart },
  { id: "progress", label: "Progress", icon: TargetIcon },
];
const TX_TYPES = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expense" },
  { id: "card", label: "Card" },
];
const GROUP_BY_OPTIONS = [
  { id: "month", label: "Month" },
  { id: "category", label: "Category" },
  { id: "card", label: "Card" },
];
const METRICS = [
  { id: "sum", label: "Sum" },
  { id: "count", label: "Count" },
  { id: "average", label: "Average" },
];
const RANGES = [
  { id: "3m", label: "3 months" },
  { id: "6m", label: "6 months" },
  { id: "12m", label: "12 months" },
  { id: "this_month", label: "This month" },
  { id: "this_year", label: "This year" },
  { id: "all", label: "All time" },
];

const DEFAULT_CONFIG = {
  name: "",
  chartType: "bar",
  txType: "all",
  categoryIds: [],
  groupBy: "month",
  metric: "sum",
  range: "6m",
  target: null,
  color: "in",
};

function ChipRow({ options, value, onChange }) {
  return (
    <div className="chip-row">
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            className={`chip ${value === opt.id ? "active" : ""}`}
            onClick={() => onChange(opt.id)}
          >
            {Icon && <Icon size={14} strokeWidth={2} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ChartFormModal({
  editing,
  onClose,
  onSave,
  transactions,
  allExpCats,
  allIncCats,
  cards,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const isEditing = !!editing;
  const [cfg, setCfg] = useState(() => (editing ? { ...editing } : { ...DEFAULT_CONFIG }));
  const set = (patch) => setCfg((c) => ({ ...c, ...patch }));

  const categoryList =
    cfg.txType === "income" ? allIncCats : cfg.txType === "all" ? [...allIncCats, ...allExpCats] : allExpCats;

  const groupByOptions =
    cfg.chartType === "donut" ? GROUP_BY_OPTIONS.filter((g) => g.id !== "month") : GROUP_BY_OPTIONS;

  const toggleCategory = (id) => {
    if (cfg.categoryIds.length === 0) {
      // Currently "all categories" — tapping one narrows to just that one.
      set({ categoryIds: [id] });
      return;
    }
    const has = cfg.categoryIds.includes(id);
    set({
      categoryIds: has
        ? cfg.categoryIds.filter((c) => c !== id)
        : [...cfg.categoryIds, id],
    });
  };

  const handleSave = () => {
    if (!cfg.name.trim()) return;
    onSave({
      ...cfg,
      id: editing?.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: cfg.name.trim(),
      target: cfg.chartType === "progress" ? cfg.target : null,
      groupBy: cfg.chartType === "progress" ? undefined : cfg.groupBy,
    });
  };

  return (
    <Sheet
      title={isEditing ? "Edit chart" : "New chart"}
      onClose={onClose}
      className="sheet-split"
    >
      <div className="chart-form-preview">
        {cfg.name.trim() ? (
          <CustomChartCard
            config={cfg}
            transactions={transactions}
            allExpCats={allExpCats}
            allIncCats={allIncCats}
            cards={cards}
          />
        ) : (
          <div className="chart-form-preview-empty">
            Your chart preview will appear here once you name it.
          </div>
        )}
      </div>

      <div className="chart-form-fields">
      <label className="field-lbl">Name</label>
      <input
        type="text"
        className="text-input"
        value={cfg.name}
        onChange={(e) => set({ name: e.target.value })}
        placeholder="e.g. Groceries over time"
        maxLength={40}
        autoFocus
      />

      <label className="field-lbl">Chart type</label>
      <ChipRow
        options={CHART_TYPES}
        value={cfg.chartType}
        onChange={(chartType) =>
          set({
            chartType,
            // Donut has no "Month" option — fall back to Category so the
            // live preview never renders against a groupBy that's no
            // longer selectable in the form.
            groupBy: chartType === "donut" && cfg.groupBy === "month" ? "category" : cfg.groupBy,
          })
        }
      />

      <label className="field-lbl">Transactions</label>
      <ChipRow options={TX_TYPES} value={cfg.txType} onChange={(txType) => set({ txType, categoryIds: [] })} />

      <label className="field-lbl">Categories</label>
      <div className="chart-cat-list">
        <button
          type="button"
          className={`chart-cat-row ${cfg.categoryIds.length === 0 ? "active" : ""}`}
          onClick={() => set({ categoryIds: [] })}
        >
          <span className="chart-cat-label">All categories</span>
          {cfg.categoryIds.length === 0 && <Check size={14} strokeWidth={2.5} />}
        </button>
        {categoryList.map((c) => {
          const Icon = c.icon;
          const selected = cfg.categoryIds.includes(c.id);
          return (
            <button
              type="button"
              key={c.id}
              className={`chart-cat-row ${selected ? "active" : ""}`}
              onClick={() => toggleCategory(c.id)}
            >
              <div className="chart-cat-icon" style={{ background: `${c.color}26`, color: c.color }}>
                <Icon size={14} strokeWidth={2} />
              </div>
              <span className="chart-cat-label">{c.label}</span>
              {selected && <Check size={14} strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>

      {cfg.chartType !== "progress" && (
        <>
          <label className="field-lbl">Group by</label>
          <ChipRow options={groupByOptions} value={cfg.groupBy} onChange={(groupBy) => set({ groupBy })} />
        </>
      )}

      <label className="field-lbl">Metric</label>
      <ChipRow options={METRICS} value={cfg.metric} onChange={(metric) => set({ metric })} />

      <label className="field-lbl">Date range</label>
      <ChipRow options={RANGES} value={cfg.range} onChange={(range) => set({ range })} />

      {cfg.chartType === "progress" && (
        <>
          <label className="field-lbl">Target amount</label>
          <div className="big-input">
            <span className="big-cur">{CURRENCY}</span>
            <AmountInput value={cfg.target || ""} onChange={(v) => set({ target: +v || null })} placeholder="0.00" />
          </div>
        </>
      )}

      {(cfg.chartType === "progress" || cfg.groupBy !== "category") && (
        <>
          <label className="field-lbl">Color</label>
          <div className="color-picker">
            {CHART_COLOR_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                className={`color-opt ${cfg.color === token ? "active" : ""}`}
                onClick={() => set({ color: token })}
                style={{ background: `var(--${token})` }}
              >
                {cfg.color === token && <Check size={11} strokeWidth={3} color="#fff" />}
              </button>
            ))}
          </div>
        </>
      )}

      <button className={`save-btn ${!cfg.name.trim() ? "disabled" : ""}`} onClick={handleSave} disabled={!cfg.name.trim()}>
        {isEditing ? "Save changes" : "Create chart"}
      </button>
      </div>
    </Sheet>
  );
}
