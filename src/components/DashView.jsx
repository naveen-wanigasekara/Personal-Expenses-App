import { useState, useMemo, useContext, useEffect, Fragment } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUp, ArrowDown, CreditCard, Lock, SlidersHorizontal, Eye, EyeOff, X } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmt, fmtCompact, monthKey, monthLabel, getTimeOfDay } from "../utils/format.js";
import { getCat } from "../constants/categories.js";
import { loadInsightsLayout, saveInsightsLayout } from "../utils/storage.js";

const SECTION_DEFS = [
  { id: "net_this_month", label: "Net This Month",    desc: "Income minus expenses for the selected month" },
  { id: "income_in",      label: "In",                desc: "Total income received this month" },
  { id: "expense_out",    label: "Out",               desc: "Total expenses spent this month" },
  { id: "cash_in_hand",   label: "Cash in Hand",      desc: "Cumulative cash balance across all time" },
  { id: "card_debt",      label: "Card Debt",         desc: "Total credit card balance and utilization" },
  { id: "budget_pulse",   label: "Budget Progress",   desc: "Income target and expense budget bars" },
  { id: "plan_vs_actual", label: "Plan vs. Actual",   desc: "Detailed budget comparison" },
  { id: "cashflow",       label: "Cashflow",          desc: "3-month income vs. expenses chart" },
  { id: "income_cats",    label: "Income Breakdown",  desc: "Where your income came from" },
  { id: "expense_cats",   label: "Expense Breakdown", desc: "Where your money went" },
];

function mergeLayout(saved) {
  if (!saved) return SECTION_DEFS.map((s) => ({ ...s, visible: true }));
  const validIds = new Set(SECTION_DEFS.map((s) => s.id));
  const valid = saved
    .filter((s) => validIds.has(s.id))
    .map((s) => ({ ...SECTION_DEFS.find((d) => d.id === s.id), visible: s.visible }));
  const savedIds = new Set(saved.map((s) => s.id));
  const missing = SECTION_DEFS.filter((s) => !savedIds.has(s.id)).map((s) => ({ ...s, visible: true }));
  return [...valid, ...missing];
}

export default function DashView({ transactions, getEffectivePlan, cards, viewMonth, setViewMonth, user, onOpenSettings, allExpCats, allIncCats, onModalChange }) {
  const CURRENCY = useContext(CurrencyCtx);
  const [showCustomize, setShowCustomize] = useState(false);
  const [sections, setSections] = useState(() => mergeLayout(loadInsightsLayout(user.id)));

  useEffect(() => {
    onModalChange?.(showCustomize);
    document.body.style.overflow = showCustomize ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showCustomize]);

  const changeMonth = (dir) => {
    const [y, m] = viewMonth.split("-").map(Number);
    setViewMonth(monthKey(new Date(y, m - 1 + dir, 1)));
  };

  const isCurrentMonth = viewMonth === monthKey(new Date());
  const [mLbl, yLbl] = monthLabel(viewMonth).split(" ");
  const initial = (user.email || "?")[0].toUpperCase();
  const greeting = getTimeOfDay();

  const last6 = useMemo(() => {
    const out = [];
    const [vy, vm] = viewMonth.split("-").map(Number);
    for (let i = 2; i >= 0; i--) {
      const d = new Date(vy, vm - 1 - i, 1);
      const k = monthKey(d);
      const inMonth = transactions.filter((t) => monthKey(t.date) === k);
      const income = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + +t.amount, 0);
      const expenses = inMonth
        .filter((t) => t.type === "expense" || t.type === "card-purchase" || t.type === "card-interest")
        .reduce((s, t) => s + +t.amount, 0);
      const p = getEffectivePlan(k);
      out.push({
        key: k, short: d.toLocaleDateString("en-US", { month: "short" }),
        income, expenses, net: income - expenses,
        incomeTarget: p?.income?.total || 0,
        expenseBudget: p?.expense?.total || 0,
      });
    }
    return out;
  }, [transactions, getEffectivePlan, viewMonth]);

  const maxBar = Math.max(...last6.flatMap((m) => [m.income, m.expenses, m.incomeTarget, m.expenseBudget]), 1);
  const thisStats = last6[last6.length - 1];
  const currentPlan = getEffectivePlan(viewMonth);

  const expCatSpend = useMemo(() => {
    const inMonth = transactions.filter(
      (t) => monthKey(t.date) === viewMonth &&
        (t.type === "expense" || t.type === "card-purchase" || t.type === "card-interest")
    );
    const by = {};
    inMonth.forEach((t) => { by[t.category] = (by[t.category] || 0) + +t.amount; });
    const total = Object.values(by).reduce((s, v) => s + v, 0);
    const budgetedCats = currentPlan?.expense?.categories || {};
    const allCatIds = new Set([
      ...Object.keys(by),
      ...Object.keys(budgetedCats).filter((id) => +budgetedCats[id] > 0),
    ]);
    return Array.from(allCatIds)
      .map((id) => {
        const val = by[id] || 0;
        const budgeted = +budgetedCats[id] || 0;
        return {
          id, val, budgeted,
          pct: total ? (val / total) * 100 : 0,
          budgetPct: budgeted ? (val / budgeted) * 100 : null,
          remaining: budgeted ? budgeted - val : null,
          cat: getCat(id, "expense", allExpCats, allIncCats),
        };
      })
      .sort((a, b) => {
        const aOver = a.budgetPct != null && a.budgetPct > 100 ? 1 : 0;
        const bOver = b.budgetPct != null && b.budgetPct > 100 ? 1 : 0;
        if (aOver !== bOver) return bOver - aOver;
        if (a.val !== b.val) return b.val - a.val;
        return (b.budgeted || 0) - (a.budgeted || 0);
      });
  }, [transactions, viewMonth, currentPlan]);

  const incCatEarn = useMemo(() => {
    const inMonth = transactions.filter((t) => monthKey(t.date) === viewMonth && t.type === "income");
    const by = {};
    inMonth.forEach((t) => { by[t.category] = (by[t.category] || 0) + +t.amount; });
    const total = Object.values(by).reduce((s, v) => s + v, 0);
    const budgetedCats = currentPlan?.income?.categories || {};
    const allCatIds = new Set([
      ...Object.keys(by),
      ...Object.keys(budgetedCats).filter((id) => +budgetedCats[id] > 0),
    ]);
    return Array.from(allCatIds)
      .map((id) => {
        const val = by[id] || 0;
        const budgeted = +budgetedCats[id] || 0;
        return {
          id, val, budgeted,
          pct: total ? (val / total) * 100 : 0,
          budgetPct: budgeted ? (val / budgeted) * 100 : null,
          remaining: budgeted ? budgeted - val : null,
          cat: getCat(id, "income", allExpCats, allIncCats),
        };
      })
      .sort((a, b) => b.val - a.val);
  }, [transactions, viewMonth, currentPlan]);

  const runningBalance = useMemo(() => {
    return transactions
      .filter((t) => monthKey(t.date) <= viewMonth)
      .reduce((sum, t) => {
        if (t.type === "income") return sum + +t.amount;
        if (t.type === "expense" || t.type === "card-payment") return sum - +t.amount;
        return sum;
      }, 0);
  }, [transactions, viewMonth]);

  const budgetProgress = currentPlan?.expense?.total ? (thisStats.expenses / currentPlan.expense.total) * 100 : 0;
  const incomeProgress = currentPlan?.income?.total ? (thisStats.income / currentPlan.income.total) * 100 : 0;
  const hasPlan = currentPlan?.income?.total > 0 || currentPlan?.expense?.total > 0;

  const totalCardDebt = cards.reduce((s, c) => s + (c.currentBalance || 0), 0);
  const totalLimit = cards.reduce((s, c) => s + (+c.limit || 0), 0);
  const totalUtil = totalLimit ? (totalCardDebt / totalLimit) * 100 : 0;

  const updateSections = (next) => {
    setSections(next);
    saveInsightsLayout(user.id, next.map(({ id, visible }) => ({ id, visible })));
  };
  const toggleSection = (id) => updateSections(sections.map((s) => s.id === id ? { ...s, visible: !s.visible } : s));
  const moveSection = (id, dir) => {
    const idx = sections.findIndex((s) => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const next = [...sections];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    updateSections(next);
  };
  const resetSections = () => updateSections(SECTION_DEFS.map((s) => ({ ...s, visible: true })));

  const sectionContent = {
    net_this_month: (
      <div className="summary-net">
        <div className="balance-label">Net this month</div>
        <div className={`balance-amt ${thisStats.net < 0 ? "neg" : ""}`}>
          <span className="balance-sign">{thisStats.net < 0 ? "−" : ""}</span>
          <span className="balance-cur">{CURRENCY}</span>
          <span className="balance-num">{fmt(Math.abs(thisStats.net))}</span>
        </div>
      </div>
    ),

    income_in: (
      <div className="io-cell">
        <div className="io-dot io-in"><ArrowUp size={12} strokeWidth={3} /></div>
        <div className="io-text">
          <div className="io-label">In</div>
          <div className="io-val">{CURRENCY} {fmt(thisStats.income)}</div>
        </div>
      </div>
    ),

    expense_out: (
      <div className="io-cell">
        <div className="io-dot io-out"><ArrowDown size={12} strokeWidth={3} /></div>
        <div className="io-text">
          <div className="io-label">Out</div>
          <div className="io-val">{CURRENCY} {fmt(thisStats.expenses)}</div>
        </div>
      </div>
    ),

    cash_in_hand: (
      <div className="running-bal">
        <span className="running-bal-label">Cash in Hand</span>
        <span className={`running-bal-amt ${runningBalance < 0 ? "neg" : ""}`}>
          {runningBalance < 0 ? "−" : "+"}{CURRENCY} {fmt(Math.abs(runningBalance))}
        </span>
      </div>
    ),

    card_debt: cards.length > 0 && totalCardDebt !== 0 ? (
      <div className="debt-banner">
        <div className="db-left">
          <CreditCard size={16} />
          <div>
            <div className="db-label">Card debt</div>
            <div className="db-val">{CURRENCY} {fmt(totalCardDebt)}</div>
          </div>
        </div>
        <div className="db-right">
          <div className={`db-util ${totalUtil > 70 ? "warn" : ""} ${totalUtil > 90 ? "over" : ""}`}>
            {totalUtil.toFixed(0)}% used
          </div>
          <div className="db-limit">of {CURRENCY} {fmtCompact(totalLimit)}</div>
        </div>
      </div>
    ) : null,

    budget_pulse: (currentPlan?.income?.total > 0 || currentPlan?.expense?.total > 0) ? (
      <div className="pulse-pair">
        {currentPlan?.income?.total > 0 && (
          <div className="pulse-item">
            <div className="pi-top">
              <span className="pi-label">
                <span className="pi-tag pi-in">Income</span>
                Target
                {currentPlan?.source === "fixed" && <Lock size={10} />}
              </span>
              <span className={`pi-pct ${incomeProgress >= 100 ? "good" : ""}`}>
                {incomeProgress.toFixed(0)}%
              </span>
            </div>
            <div className="pi-track">
              <div className="pi-fill in" style={{ width: `${Math.min(incomeProgress, 100)}%` }} />
            </div>
            <div className="pi-foot">
              <span>{CURRENCY} {fmtCompact(thisStats.income)} / {CURRENCY} {fmtCompact(currentPlan.income.total)}</span>
            </div>
          </div>
        )}
        {currentPlan?.expense?.total > 0 && (
          <div className="pulse-item">
            <div className="pi-top">
              <span className="pi-label">
                <span className="pi-tag pi-out">Budget</span>
                {currentPlan?.source === "fixed" && <Lock size={10} />}
              </span>
              <span className={`pi-pct ${budgetProgress > 100 ? "over" : budgetProgress > 80 ? "warn" : ""}`}>
                {budgetProgress.toFixed(0)}%
              </span>
            </div>
            <div className="pi-track">
              <div
                className={`pi-fill out ${budgetProgress > 100 ? "over" : budgetProgress > 80 ? "warn" : ""}`}
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              />
            </div>
            <div className="pi-foot">
              <span>{CURRENCY} {fmtCompact(thisStats.expenses)} / {CURRENCY} {fmtCompact(currentPlan.expense.total)}</span>
              <span className={budgetProgress > 100 ? "pi-over" : "pi-left"}>
                {budgetProgress > 100 ? "over" : `${CURRENCY} ${fmtCompact(Math.abs(currentPlan.expense.total - thisStats.expenses))} left`}
              </span>
            </div>
          </div>
        )}
      </div>
    ) : null,

    plan_vs_actual: hasPlan ? (
      <div className="card plan-card">
        <div className="card-hd">
          <h3>Plan vs. Actual</h3>
          <span className="card-sub">This month</span>
        </div>
        {currentPlan?.income?.total > 0 && (
          <div className="plan-row">
            <div className="plan-info">
              <div className="plan-label">
                <span className="pi-tag pi-in">Income</span> Target
              </div>
              <div className="plan-nums">
                <span className="plan-actual">{CURRENCY} {fmtCompact(thisStats.income)}</span>
                <span className="plan-vs">of {CURRENCY} {fmtCompact(currentPlan.income.total)}</span>
              </div>
            </div>
            <div className="plan-bar">
              <div className="plan-fill in" style={{ width: `${Math.min(incomeProgress, 100)}%` }} />
            </div>
            <div className="plan-pct">
              <span className={incomeProgress >= 100 ? "good" : ""}>{incomeProgress.toFixed(0)}% achieved</span>
              {incomeProgress < 100 && (
                <span className="plan-gap">{CURRENCY} {fmtCompact(currentPlan.income.total - thisStats.income)} to go</span>
              )}
              {incomeProgress >= 100 && (
                <span className="plan-gap good">+{CURRENCY} {fmtCompact(thisStats.income - currentPlan.income.total)} over</span>
              )}
            </div>
          </div>
        )}
        {currentPlan?.expense?.total > 0 && (
          <div className="plan-row">
            <div className="plan-info">
              <div className="plan-label">
                <span className="pi-tag pi-out">Expenses</span> Budget
                {currentPlan.source === "fixed" && <Lock size={10} />}
              </div>
              <div className="plan-nums">
                <span className="plan-actual">{CURRENCY} {fmtCompact(thisStats.expenses)}</span>
                <span className="plan-vs">of {CURRENCY} {fmtCompact(currentPlan.expense.total)}</span>
              </div>
            </div>
            <div className="plan-bar">
              <div className={`plan-fill out ${budgetProgress > 100 ? "over" : budgetProgress > 80 ? "warn" : ""}`}
                style={{ width: `${Math.min(budgetProgress, 100)}%` }} />
            </div>
            <div className="plan-pct">
              <span className={budgetProgress > 100 ? "bad" : budgetProgress > 80 ? "warn-t" : ""}>
                {budgetProgress.toFixed(0)}% used
              </span>
              <span className={budgetProgress > 100 ? "plan-gap bad" : "plan-gap"}>
                {budgetProgress > 100
                  ? `${CURRENCY} ${fmtCompact(thisStats.expenses - currentPlan.expense.total)} over`
                  : `${CURRENCY} ${fmtCompact(currentPlan.expense.total - thisStats.expenses)} left`}
              </span>
            </div>
          </div>
        )}
        {currentPlan?.income?.total > 0 && currentPlan?.expense?.total > 0 && (
          <div className="plan-summary">
            <div className="plan-sum-row">
              <span>Planned savings</span>
              <strong className={currentPlan.income.total - currentPlan.expense.total >= 0 ? "pos" : "neg"}>
                {CURRENCY} {fmtCompact(currentPlan.income.total - currentPlan.expense.total)}
              </strong>
            </div>
            <div className="plan-sum-row">
              <span>Actual net</span>
              <strong className={thisStats.net >= 0 ? "pos" : "neg"}>
                {CURRENCY} {fmtCompact(thisStats.net)}
              </strong>
            </div>
          </div>
        )}
      </div>
    ) : null,

    cashflow: (
      <div className="card">
        <div className="card-hd">
          <h3>Cashflow</h3>
          <div className="legend">
            <span><span className="dot in" />In</span>
            <span><span className="dot out" />Out</span>
            <span><span className="dot bud" />Plan</span>
          </div>
        </div>
        <div className="chart">
          {last6.map((m) => (
            <div key={m.key} className="bar-col">
              <div className="bar-wrap">
                <div className="bar in" style={{ height: `${(m.income / maxBar) * 100}%` }} />
                <div className="bar out" style={{ height: `${(m.expenses / maxBar) * 100}%` }} />
                {m.incomeTarget > 0 && (
                  <div className="plan-line in-line"
                    style={{ bottom: `${(m.incomeTarget / maxBar) * 100}%`, left: "8%", width: "38%" }} />
                )}
                {m.expenseBudget > 0 && (
                  <div className="plan-line out-line"
                    style={{ bottom: `${(m.expenseBudget / maxBar) * 100}%`, left: "54%", width: "38%" }} />
                )}
              </div>
              <div className="bar-lbl">{m.short}</div>
            </div>
          ))}
        </div>
      </div>
    ),

    income_cats: incCatEarn.length > 0 ? (
      <div className="card">
        <div className="card-hd">
          <h3>Where it came from</h3>
          <span className="card-sub">Income · This month</span>
        </div>
        <div className="cat-list-v2">
          {incCatEarn.map((c) => {
            const Icon = c.cat.icon;
            const hasBudget = c.budgeted > 0;
            const pct = hasBudget ? Math.min(c.budgetPct, 100) : 100;
            const isAchieved = hasBudget && c.budgetPct >= 100;
            const isUnearned = c.val === 0 && hasBudget;
            return (
              <div key={c.id} className={`catv2 ${isUnearned ? "unused" : ""}`}>
                <div className="catv2-head">
                  <div className="catv2-left">
                    <div className="cat-icon" style={{ background: `${c.cat.color}1a`, color: c.cat.color }}>
                      <Icon size={15} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="catv2-name">{c.cat.label}</div>
                      <div className="catv2-sub">
                        {hasBudget ? (<>{CURRENCY} {fmt(c.val)} <span className="sep">/</span> {CURRENCY} {fmt(c.budgeted)}</>)
                          : <>{c.pct.toFixed(1)}% of income · no target set</>}
                      </div>
                    </div>
                  </div>
                  <div className="catv2-right">
                    {hasBudget ? (
                      <>
                        <div className={`catv2-remaining ${isAchieved ? "good" : ""}`}>
                          {isAchieved ? <>+{CURRENCY} {fmt(c.val - c.budgeted)}</> : <>{CURRENCY} {fmt(c.remaining)}</>}
                        </div>
                        <div className="catv2-remaining-lbl">{isAchieved ? "over" : "to go"}</div>
                      </>
                    ) : (
                      <div className="catv2-val">{CURRENCY} {fmt(c.val)}</div>
                    )}
                  </div>
                </div>
                {hasBudget && (
                  <>
                    <div className="catv2-bar">
                      <div className="catv2-fill" style={{ width: `${pct}%`, background: c.cat.color }} />
                    </div>
                    <div className="catv2-foot">
                      <span className={isAchieved ? "good" : ""}>{c.budgetPct.toFixed(0)}% achieved</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ) : null,

    expense_cats: (
      <div className="card">
        <div className="card-hd">
          <h3>Where it went</h3>
          <span className="card-sub">Expenses · This month</span>
        </div>
        {expCatSpend.length === 0 ? (
          <div className="empty-sm">No expenses or budgets this month</div>
        ) : (
          <div className="cat-list-v2">
            {expCatSpend.map((c) => {
              const Icon = c.cat.icon;
              const hasBudget = c.budgeted > 0;
              const pct = hasBudget ? Math.min(c.budgetPct, 100) : 100;
              const isOver = hasBudget && c.budgetPct > 100;
              const isWarn = hasBudget && c.budgetPct > 80 && c.budgetPct <= 100;
              const isUnused = c.val === 0 && hasBudget;
              return (
                <div key={c.id} className={`catv2 ${isUnused ? "unused" : ""}`}>
                  <div className="catv2-head">
                    <div className="catv2-left">
                      <div className="cat-icon" style={{ background: `${c.cat.color}1a`, color: c.cat.color }}>
                        <Icon size={15} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="catv2-name">{c.cat.label}</div>
                        <div className="catv2-sub">
                          {hasBudget ? (<>{CURRENCY} {fmt(c.val)} <span className="sep">/</span> {CURRENCY} {fmt(c.budgeted)}</>)
                            : <>{c.pct.toFixed(1)}% of spending · no budget set</>}
                        </div>
                      </div>
                    </div>
                    <div className="catv2-right">
                      {hasBudget ? (
                        <>
                          <div className={`catv2-remaining ${isOver ? "over" : isWarn ? "warn" : ""}`}>
                            {isOver ? <>−{CURRENCY} {fmt(Math.abs(c.remaining))}</> : <>{CURRENCY} {fmt(c.remaining)}</>}
                          </div>
                          <div className="catv2-remaining-lbl">{isOver ? "over" : "left"}</div>
                        </>
                      ) : (
                        <div className="catv2-val">{CURRENCY} {fmt(c.val)}</div>
                      )}
                    </div>
                  </div>
                  {hasBudget && (
                    <>
                      <div className="catv2-bar">
                        <div className={`catv2-fill ${isOver ? "over" : isWarn ? "warn" : ""}`}
                          style={{ width: `${pct}%`, background: isOver ? undefined : c.cat.color }} />
                      </div>
                      <div className="catv2-foot">
                        <span className={isOver ? "over" : isWarn ? "warn-t" : ""}>{c.budgetPct.toFixed(0)}% used</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    ),
  };

  return (
    <div className="view">
      <div className="hero">
        <div className="hero-top">
          <div>
            <div className="hero-meta">{isCurrentMonth ? `Good ${greeting}` : "Viewing"}</div>
            <h1 className="hero-title">Your Money</h1>
          </div>
          <div className="hero-right">
            <div className="month-pill">
              <button onClick={() => changeMonth(-1)} aria-label="Previous month">
                <ChevronLeft size={16} />
              </button>
              <span>{mLbl.slice(0, 3)} {yLbl}</span>
              <button onClick={() => changeMonth(1)} aria-label="Next month">
                <ChevronRight size={16} />
              </button>
            </div>
            <button className="avatar-btn" onClick={() => setShowCustomize(true)} aria-label="Customize sections">
              <SlidersHorizontal size={14} />
            </button>
            <button className="avatar-btn" onClick={onOpenSettings} aria-label="Account">
              {initial}
            </button>
          </div>
        </div>
      </div>

      {(() => {
        const isInOut = (id) => id === "income_in" || id === "expense_out";
        const visible = sections.filter((s) => s.visible);
        const result = [];
        let i = 0;
        while (i < visible.length) {
          const cur = visible[i];
          const next = visible[i + 1];
          if (isInOut(cur.id) && next && isInOut(next.id) && cur.id !== next.id) {
            result.push(
              <div key="inout-pair" className="inout inout-section">
                {sectionContent[cur.id]}
                {sectionContent[next.id]}
              </div>
            );
            i += 2;
          } else if (isInOut(cur.id)) {
            result.push(
              <div key={cur.id} className="inout inout-section">
                {sectionContent[cur.id]}
              </div>
            );
            i++;
          } else {
            const content = sectionContent[cur.id];
            if (content) result.push(<Fragment key={cur.id}>{content}</Fragment>);
            i++;
          }
        }
        return result;
      })()}

      {showCustomize && (
        <div className="backdrop" onClick={() => setShowCustomize(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-hd">
              <h2>Customize</h2>
              <button className="close-btn" onClick={() => setShowCustomize(false)}><X size={18} /></button>
            </div>
            <p className="customize-hint">Choose which sections appear and arrange them in your preferred order.</p>
            <div className="section-list">
              {sections.map((s, i) => (
                <div key={s.id} className={`section-row ${!s.visible ? "section-hidden" : ""}`}>
                  <div className="section-move">
                    <button onClick={() => moveSection(s.id, -1)} disabled={i === 0} aria-label="Move up">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveSection(s.id, 1)} disabled={i === sections.length - 1} aria-label="Move down">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="section-info">
                    <div className="section-label">{s.label}</div>
                    <div className="section-desc">{s.desc}</div>
                  </div>
                  <button
                    className={`section-toggle ${s.visible ? "on" : "off"}`}
                    onClick={() => toggleSection(s.id)}
                    aria-label={s.visible ? "Hide section" : "Show section"}
                  >
                    {s.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              ))}
            </div>
            <button className="text-btn" onClick={resetSections}>Reset to default</button>
          </div>
        </div>
      )}
    </div>
  );
}
