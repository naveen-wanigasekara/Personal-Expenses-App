import { useState, useEffect, useContext } from "react";
import {
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Bell,
  Menu,
} from "lucide-react";
import { CurrencyCtx } from "../context.js";
import {
  fmt,
  fmtCompact,
  monthLabel,
  emptyPlan,
  shiftMonth,
} from "../utils/format.js";
import { SAVINGS_CATEGORY_ID } from "../constants/categories.js";
import AmountInput from "./AmountInput.jsx";

export default function BudgetView({
  monthPlans,
  setMonthPlan,
  viewMonth,
  setViewMonth,
  stats,
  fixedPlan,
  setFixedPlan,
  allExpCats,
  allIncCats,
  onOpenMenu,
  onOpenNotifications,
  notifCount,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const [mode, setMode] = useState("fixed");
  const [side, setSide] = useState("expense");
  const [fixedEdit, setFixedEdit] = useState(fixedPlan);
  const [monthEdit, setMonthEdit] = useState(
    monthPlans[viewMonth] || emptyPlan(),
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFixedEdit(fixedPlan);
  }, [fixedPlan]);
  useEffect(() => {
    setMonthEdit(
      monthPlans[viewMonth] || JSON.parse(JSON.stringify(fixedPlan)),
    );
  }, [viewMonth, monthPlans]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const changeMonth = (dir) => setViewMonth(shiftMonth(viewMonth, dir));

  const handleSave = async () => {
    if (mode === "fixed") await setFixedPlan(fixedEdit);
    else await setMonthPlan(viewMonth, monthEdit);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const copyFromFixed = () =>
    setMonthEdit(JSON.parse(JSON.stringify(fixedPlan)));

  const isFixed = mode === "fixed";
  const plan = isFixed ? fixedEdit : monthEdit;
  const setPlan = isFixed ? setFixedEdit : setMonthEdit;
  const sidePlan = plan[side] || { total: 0, categories: {} };
  const total = sidePlan.total || "";
  const cats = sidePlan.categories || {};

  const updateTotal = (v) =>
    setPlan({ ...plan, [side]: { ...sidePlan, total: +v || 0 } });
  const updateCat = (id, v) =>
    setPlan({
      ...plan,
      [side]: { ...sidePlan, categories: { ...cats, [id]: v } },
    });

  const catList = side === "income" ? allIncCats : allExpCats;
  const actuals = side === "income" ? stats.byIncCat : stats.byExpCat;
  const allocated = catList.reduce((s, c) => s + (+cats[c.id] || 0), 0);
  const remaining = +total - allocated;

  const incomeTotal = plan.income?.total || 0;
  const expenseTotal = plan.expense?.total || 0;
  const plannedSavings = incomeTotal - expenseTotal;

  return (
    <div className="view view-budget">
      <div className="dash-topbar">
        <div className="mheader-left">
          <button className="icon-btn" onClick={onOpenMenu} aria-label="Menu">
            <Menu size={16} />
          </button>
        </div>
        <div className="mheader-center">
          <span className="mheader-title">Budget</span>
        </div>
        <div className="mheader-right">
          <button
            className="bell-btn"
            onClick={onOpenNotifications}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
          </button>
        </div>
      </div>
      <div className="budget-scroll">
      <div className="page-hd">
        <div className="page-eyebrow">Plan</div>
        <h1 className="page-title">Budget</h1>
      </div>

      <div className="mode-toggle">
        <div className={`mode-slider ${mode}`} />
        <button
          className={isFixed ? "active" : ""}
          onClick={() => setMode("fixed")}
        >
          <Lock size={13} strokeWidth={2.5} /> Fixed plan
        </button>
        <button
          className={!isFixed ? "active" : ""}
          onClick={() => setMode("month")}
        >
          <Unlock size={13} strokeWidth={2.5} /> This month
        </button>
      </div>

      {isFixed ? (
        <div className="mode-desc">
          Your default recurring plan. Applied every month unless overridden.
        </div>
      ) : (
        <>
          <div className="month-pill month-pill-full">
            <button onClick={() => changeMonth(-1)}>
              <ChevronLeft size={16} />
            </button>
            <span>{monthLabel(viewMonth)}</span>
            <button onClick={() => changeMonth(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
          {(fixedPlan.income?.total > 0 || fixedPlan.expense?.total > 0) && (
            <button className="copy-btn" onClick={copyFromFixed}>
              <div className="copy-btn-icon">
                <Copy size={15} />
              </div>
              <div className="copy-btn-text">
                <span className="copy-btn-title">Copy from fixed plan</span>
                <span className="copy-btn-sub">
                  Apply your fixed budget to this month
                </span>
              </div>
              <ChevronRight size={15} className="copy-btn-arrow" />
            </button>
          )}
        </>
      )}

      {(incomeTotal > 0 || expenseTotal > 0) && (
        <div className="summary-card">
          <div className="summary-row">
            <div className="summary-col">
              <div className="summary-label">Income target</div>
              <div className="summary-val in-color">
                {CURRENCY} {fmtCompact(incomeTotal)}
              </div>
            </div>
            <div className="summary-divider" />
            <div className="summary-col">
              <div className="summary-label">Expense budget</div>
              <div className="summary-val out-color">
                {CURRENCY} {fmtCompact(expenseTotal)}
              </div>
            </div>
          </div>
          {incomeTotal > 0 && expenseTotal > 0 && (
            <div className="summary-savings">
              <span>Planned savings</span>
              <strong className={plannedSavings >= 0 ? "pos" : "neg"}>
                {CURRENCY} {fmt(plannedSavings)} ·{" "}
                {((plannedSavings / incomeTotal) * 100).toFixed(0)}%
              </strong>
            </div>
          )}
        </div>
      )}

      <div className="side-toggle">
        <div className={`side-slider ${side}`} />
        <button
          className={side === "income" ? "active" : ""}
          onClick={() => setSide("income")}
        >
          <ArrowUp size={13} strokeWidth={2.5} /> Income
        </button>
        <button
          className={side === "expense" ? "active" : ""}
          onClick={() => setSide("expense")}
        >
          <ArrowDown size={13} strokeWidth={2.5} /> Expenses
        </button>
      </div>

      <div className="card">
        <label className="field-lbl">
          {side === "income"
            ? isFixed
              ? "Fixed monthly income target"
              : "This month's income target"
            : isFixed
              ? "Fixed monthly expense budget"
              : "This month's expense budget"}
        </label>
        <div className={`big-input ${side === "income" ? "in-accent" : ""}`}>
          <span className="big-cur">{CURRENCY}</span>
          <AmountInput
            value={total}
            onChange={updateTotal}
            placeholder="0.00"
          />
        </div>
        <div className="hint">
          {side === "income"
            ? "The total you expect to earn across all sources"
            : "The total you plan to spend across all categories"}
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>By category</h3>
          {+total > 0 && (
            <span className={`alloc ${remaining < 0 ? "neg" : ""}`}>
              {CURRENCY} {fmtCompact(Math.abs(remaining))}{" "}
              {remaining < 0 ? "over" : "unallocated"}
            </span>
          )}
        </div>
        <div className="cat-budgets">
          {catList.map((c) => {
            const Icon = c.icon;
            const actual = isFixed ? 0 : actuals[c.id] || 0;
            const limit = +cats[c.id] || 0;
            const pct = limit && !isFixed ? (actual / limit) * 100 : 0;
            const isSavingsRow = side === "expense" && c.id === SAVINGS_CATEGORY_ID;
            return (
              <div key={c.id} className="cat-budget">
                <div className="cb-top">
                  <div className="cb-left">
                    <div
                      className="cb-icon"
                      style={{ background: `${c.color}1a`, color: c.color }}
                    >
                      <Icon size={14} strokeWidth={2} />
                    </div>
                    <span className="cb-name">{c.label}</span>
                  </div>
                  <div className="cb-input">
                    <span>{CURRENCY}</span>
                    <AmountInput
                      value={cats[c.id] || ""}
                      onChange={(v) => updateCat(c.id, v)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {limit > 0 &&
                  !isFixed &&
                  (isSavingsRow ? (
                    <div className="hint">
                      Actual savings aren't tracked against this target — see
                      Total Savings on your Dashboard.
                    </div>
                  ) : (
                    <>
                      <div className="cb-bar">
                        <div
                          className={`cb-fill ${side === "expense" ? (pct > 100 ? "over" : pct > 80 ? "warn" : "") : ""}`}
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background:
                              side === "expense"
                                ? pct > 100
                                  ? undefined
                                  : c.color
                                : c.color,
                          }}
                        />
                      </div>
                      <div className="cb-foot">
                        {CURRENCY} {fmt(actual)} / {CURRENCY} {fmt(limit)} ·{" "}
                        {pct.toFixed(0)}%
                      </div>
                    </>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      <button
        className={`save-btn ${saved ? "saved" : ""}`}
        onClick={handleSave}
      >
        {saved ? (
          <>
            <Check size={17} strokeWidth={2.5} /> Saved
          </>
        ) : isFixed ? (
          "Save fixed plan"
        ) : (
          "Save for this month"
        )}
      </button>
      <div style={{ height: "80px" }} />
      </div>
    </div>
  );
}
