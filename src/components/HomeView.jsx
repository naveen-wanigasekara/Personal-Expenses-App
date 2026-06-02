import { useState, useEffect, useMemo, useContext } from "react";
import { Sparkles, Search, X } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmt, monthKey } from "../utils/format.js";
import { getCat } from "../constants/categories.js";
import TxRow from "./TxRow.jsx";

export default function HomeView({ stats, viewMonth, setViewMonth, transactions, onDelete, onEdit, cards, allExpCats, allIncCats, installmentPlans }) {
  const CURRENCY = useContext(CurrencyCtx);
  const [filterCat, setFilterCat] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => { setFilterCat("all"); setFilterType("all"); setSearch(""); }, [viewMonth]);

  const last12months = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(monthKey(d));
    }
    return out;
  }, []);

  // Resolve a transaction's effective category via getCat (same logic as TxRow)
  const effectiveCatId = (t) => {
    if (t.type === "card-payment") return "card-payment";
    if (t.type === "income") return getCat(t.category, "income", allExpCats, allIncCats).id;
    return getCat(t.category, "expense", allExpCats, allIncCats).id;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const typeMatch = filterType === "all"
        || (filterType === "card" && ["card-purchase", "card-payment", "card-interest"].includes(t.type))
        || (filterType === "income" && t.type === "income")
        || (filterType === "expense" && t.type === "expense");
      const catMatch = filterCat === "all" || effectiveCatId(t) === filterCat;
      if (!typeMatch || !catMatch) return false;
      if (!q) return true;
      const note = (t.note || "").toLowerCase();
      const amt = String(t.amount);
      const catLabel = getCat(t.category, t.type === "income" ? "income" : "expense", allExpCats, allIncCats).label.toLowerCase();
      return note.includes(q) || amt.includes(q) || catLabel.includes(q);
    });
  }, [transactions, filterCat, filterType, search, allExpCats, allIncCats]);

  const activeCats = useMemo(() => {
    // Build a map of effective category IDs → category objects (mirrors how TxRow resolves cats)
    const catMap = new Map();
    transactions.forEach((t) => {
      if (t.type === "card-payment") return;
      const cat = t.type === "income"
        ? getCat(t.category, "income", allExpCats, allIncCats)
        : getCat(t.category, "expense", allExpCats, allIncCats);
      if (!catMap.has(cat.id)) catMap.set(cat.id, cat);
    });
    const pool = filterType === "income"
      ? allIncCats
      : filterType === "expense" || filterType === "card"
        ? allExpCats
        : [...allIncCats, ...allExpCats];
    return pool.filter((c) => catMap.has(c.id));
  }, [transactions, filterType, allIncCats, allExpCats]);

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

        <div className="tx-search-bar">
          <Search size={14} className="tx-search-icon" />
          <input
            className="tx-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by note, amount, or category…"
          />
          {search && (
            <button className="tx-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="tx-filters">
          <select className="fselect" value={viewMonth} onChange={(e) => setViewMonth(e.target.value)}>
            {last12months.map((mk) => {
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
            <div className="empty-sub">{transactions.length === 0 ? "Tap + to record your first entry" : search ? "Try different search terms or clear the search" : "Try a different filter"}</div>
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
                      <TxRow key={t.id} tx={t} onDelete={onDelete} onEdit={onEdit}
                        cardName={t.cardId ? getCardName(t.cardId) : null}
                        allExpCats={allExpCats} allIncCats={allIncCats}
                        installmentPlan={t.installmentId ? (installmentPlans || []).find((p) => p.id === t.installmentId) : null} />
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
