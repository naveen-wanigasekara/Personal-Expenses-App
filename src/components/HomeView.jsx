import { useState, useEffect, useMemo, useContext } from "react";
import {
  Sparkles,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Menu,
} from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmt, monthKey, monthLabel, shiftMonth } from "../utils/format.js";
import { getCat } from "../constants/categories.js";
import TxRow from "./TxRow.jsx";

export default function HomeView({
  stats,
  viewMonth,
  setViewMonth,
  transactions,
  onDelete,
  onEdit,
  cards,
  allExpCats,
  allIncCats,
  installmentPlans,
  onOpenMenu,
  onOpenNotifications,
  notifCount,
}) {
  const CURRENCY = useContext(CurrencyCtx);
  const [filterCat, setFilterCat] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [mLbl, yLbl] = monthLabel(viewMonth).split(" ");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setFilterCat("all");
    setFilterType("all");
    setSearch("");
  }, [viewMonth]);

  // Not memoized with an empty dep array on purpose — needs to include the
  // current month even if this component stays mounted across a month
  // boundary in a long-lived PWA session. Cheap enough (12 iterations) to
  // just recompute each render. Only rendered at desktop widths (see
  // .tx-month-select below) — mobile/tablet use the .month-pill in the new
  // shared header instead.
  const last12months = (() => {
    const out = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push(monthKey(d));
    }
    return out;
  })();

  // Resolve a transaction's effective category via getCat (same logic as TxRow)
  const effectiveCatId = (t) => {
    if (t.type === "card-payment") return "card-payment";
    if (t.type === "income")
      return getCat(t.category, "income", allExpCats, allIncCats).id;
    return getCat(t.category, "expense", allExpCats, allIncCats).id;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const typeMatch =
        filterType === "all" ||
        (filterType === "card" &&
          ["card-purchase", "card-payment", "card-interest"].includes(
            t.type,
          )) ||
        (filterType === "income" && t.type === "income") ||
        (filterType === "expense" && t.type === "expense");
      const catMatch = filterCat === "all" || effectiveCatId(t) === filterCat;
      if (!typeMatch || !catMatch) return false;
      if (!q) return true;
      const note = (t.note || "").toLowerCase();
      const amt = String(t.amount);
      const catLabel = getCat(
        t.category,
        t.type === "income" ? "income" : "expense",
        allExpCats,
        allIncCats,
      ).label.toLowerCase();
      return note.includes(q) || amt.includes(q) || catLabel.includes(q);
    });
  }, [transactions, filterCat, filterType, search, allExpCats, allIncCats]);

  const activeCats = useMemo(() => {
    // Build a map of effective category IDs → category objects (mirrors how TxRow resolves cats)
    const catMap = new Map();
    transactions.forEach((t) => {
      if (t.type === "card-payment") return;
      const cat =
        t.type === "income"
          ? getCat(t.category, "income", allExpCats, allIncCats)
          : getCat(t.category, "expense", allExpCats, allIncCats);
      if (!catMap.has(cat.id)) catMap.set(cat.id, cat);
    });
    const pool =
      filterType === "income"
        ? allIncCats
        : filterType === "expense" || filterType === "card"
          ? allExpCats
          : [...allIncCats, ...allExpCats];
    return pool.filter((c) => catMap.has(c.id));
  }, [transactions, filterType, allIncCats, allExpCats]);

  const grouped = useMemo(() => {
    // Group by the raw "YYYY-MM-DD" string rather than parsing it into a
    // Date — new Date("YYYY-MM-DD") parses as UTC midnight, which shifts
    // to the previous local day for any timezone west of UTC.
    const g = {};
    filtered.forEach((t) => {
      const k = t.date;
      if (!g[k]) g[k] = [];
      g[k].push(t);
    });
    return Object.entries(g).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const cardNameById = useMemo(() => {
    const m = new Map();
    cards.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cards]);

  return (
    <div className="view view-home">
      <div className="dash-topbar">
        <div className="mheader-left">
          <button className="icon-btn" onClick={onOpenMenu} aria-label="Menu">
            <Menu size={16} />
          </button>
        </div>
        <div className="mheader-center">
          <div className="month-pill">
            <button
              onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {mLbl.slice(0, 3)} {yLbl}
            </span>
            <button
              onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
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
      <div className="home-header">
        <div className="section-hd">
          <h2>Transactions</h2>
          <span className="count">
            {filtered.length}
            {filtered.length !== transactions.length
              ? `/${transactions.length}`
              : ""}
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
            <button
              className="tx-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="tx-filters">
          <select
            className="fselect tx-month-select"
            value={viewMonth}
            onChange={(e) => setViewMonth(e.target.value)}
          >
            {last12months.map((mk) => {
              const [y, mo] = mk.split("-");
              const lbl = new Date(+y, +mo - 1, 1).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              });
              return (
                <option key={mk} value={mk}>
                  {lbl}
                </option>
              );
            })}
          </select>
          <select
            className="fselect"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setFilterCat("all");
            }}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Cash Purchase</option>
            <option value="card">CC Purchase</option>
          </select>
          <select
            className="fselect"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="all">All categories</option>
            {activeCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tx-scroll">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              <Sparkles size={28} strokeWidth={1.5} />
            </div>
            <div className="empty-title">
              {transactions.length === 0 ? "Nothing here yet" : "No matches"}
            </div>
            <div className="empty-sub">
              {transactions.length === 0
                ? "Tap + to record your first entry"
                : search
                  ? "Try different search terms or clear the search"
                  : "Try a different filter"}
            </div>
          </div>
        ) : (
          <div className="tx-list">
            {grouped.map(([date, items]) => {
              const dayTotal = items.reduce((s, t) => {
                if (t.type === "income") return s - +t.amount;
                if (t.type === "card-payment") return s;
                return s + +t.amount;
              }, 0);
              const [gy, gmo, gd] = date.split("-").map(Number);
              const dateLabel = new Date(gy, gmo - 1, gd).toLocaleDateString(
                "en-US",
                { weekday: "short", month: "short", day: "numeric" },
              );
              return (
                <div key={date} className="tx-group">
                  <div className="tx-date">
                    <span>{dateLabel}</span>
                    <span className="tx-date-total">
                      {CURRENCY} {fmt(dayTotal)}
                    </span>
                  </div>
                  <div className="tx-stack">
                    {items.map((t) => (
                      <TxRow
                        key={t.id}
                        tx={t}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        cardName={
                          t.cardId
                            ? cardNameById.get(t.cardId) || "Card"
                            : null
                        }
                        allExpCats={allExpCats}
                        allIncCats={allIncCats}
                        installmentPlan={
                          t.installmentId
                            ? (installmentPlans || []).find(
                                (p) => p.id === t.installmentId,
                              )
                            : null
                        }
                      />
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
