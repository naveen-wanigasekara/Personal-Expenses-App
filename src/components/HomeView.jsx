import { useState, useEffect, useMemo, useContext } from "react";
import { Sparkles } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../constants/categories.js";
import { fmt, monthKey } from "../utils/format.js";
import TxRow from "./TxRow.jsx";

export default function HomeView({ stats, viewMonth, setViewMonth, transactions, onDelete, cards, allExpCats, allIncCats }) {
  const CURRENCY = useContext(CurrencyCtx);
  const [filterCat, setFilterCat] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => { setFilterCat("all"); setFilterType("all"); }, [viewMonth]);

  const last6months = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(monthKey(d));
    }
    return out;
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const typeMatch = filterType === "all"
        || (filterType === "card" && ["card-purchase", "card-payment", "card-interest"].includes(t.type))
        || (filterType === "income" && t.type === "income")
        || (filterType === "expense" && t.type === "expense");
      const catMatch = filterCat === "all" || t.category === filterCat;
      return typeMatch && catMatch;
    });
  }, [transactions, filterCat, filterType]);

  const activeCats = useMemo(() => {
    const ids = new Set(transactions.map((t) => t.category));
    const pool = filterType === "income"
      ? INCOME_CATEGORIES
      : filterType === "expense" || filterType === "card"
        ? EXPENSE_CATEGORIES
        : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
    return pool.filter((c) => ids.has(c.id));
  }, [transactions, filterType]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((t) => {
      const k = new Date(t.date).toDateString();
      if (!g[k]) g[k] = [];
      g[k].push(t);
    });
    return Object.entries(g).sort(([a], [b]) => new Date(b) - new Date(a));
  }, [filtered]);

  const getCardName = (id) => cards.find((c) => c.id === id)?.name || "Card";

  return (
    <div className="view view-home">
      <div className="home-header">
        <div className="section-hd">
          <h2>Transactions</h2>
          <span className="count">
            {filtered.length}{filtered.length !== transactions.length ? `/${transactions.length}` : ""}
          </span>
        </div>

        <div className="tx-filters">
          <select className="fselect" value={viewMonth} onChange={(e) => setViewMonth(e.target.value)}>
            {last6months.map((mk) => {
              const [y, mo] = mk.split("-");
              const lbl = new Date(+y, +mo - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
              return <option key={mk} value={mk}>{lbl}</option>;
            })}
          </select>
          <select className="fselect" value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setFilterCat("all"); }}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Cash Purchase</option>
            <option value="card">CC Purchase</option>
          </select>
          <select className="fselect" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="all">All categories</option>
            {activeCats.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tx-scroll">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Sparkles size={28} strokeWidth={1.5} /></div>
            <div className="empty-title">{transactions.length === 0 ? "Nothing here yet" : "No matches"}</div>
            <div className="empty-sub">{transactions.length === 0 ? "Tap + to record your first entry" : "Try a different filter"}</div>
          </div>
        ) : (
          <div className="tx-list">
            {grouped.map(([date, items]) => {
              const dayTotal = items.reduce((s, t) => {
                if (t.type === "income") return s - +t.amount;
                if (t.type === "card-payment") return s;
                return s + +t.amount;
              }, 0);
              return (
                <div key={date} className="tx-group">
                  <div className="tx-date">
                    <span>{new Date(date).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    })}</span>
                    <span className="tx-date-total">{CURRENCY} {fmt(dayTotal)}</span>
                  </div>
                  <div className="tx-stack">
                    {items.map((t) => (
                      <TxRow key={t.id} tx={t} onDelete={onDelete}
                        cardName={t.cardId ? getCardName(t.cardId) : null}
                        allExpCats={allExpCats} allIncCats={allIncCats} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
