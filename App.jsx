import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, X, Trash2, ChevronLeft, ChevronRight, Check,
  Landmark, Home as HomeIcon, Zap, ShoppingCart, Heart, Car,
  ShoppingBag, Film, ShieldAlert, PiggyBank, MoreHorizontal,
  Briefcase, Repeat, Gift, TrendingDown, TrendingUp,
  Wallet, BarChart3, Target, ArrowUp, ArrowDown, Sparkles,
  Lock, Unlock, Copy, CreditCard, Percent, AlertTriangle,
  Edit2, LogOut, Mail, KeyRound, UserPlus, Loader2,
} from "lucide-react";
import {
  supabase, signUp, signIn, signOut, getUser,
  fetchTransactions, insertTransaction, deleteTransaction,
  fetchCards, upsertCard, deleteCard,
  fetchBudgets, upsertBudget,
} from "./supabase.js";

/* ─── CATEGORIES ──────────────────────────────────────────── */
const EXPENSE_CATEGORIES = [
  { id: "loan", label: "Loan Repayment", icon: Landmark, color: "#e0654a" },
  { id: "rent", label: "House Rent", icon: HomeIcon, color: "#c98a5a" },
  { id: "utilities", label: "Utilities", icon: Zap, color: "#e3a847" },
  { id: "groceries", label: "Groceries", icon: ShoppingCart, color: "#7ba05b" },
  { id: "healthcare", label: "Healthcare", icon: Heart, color: "#d96477" },
  { id: "transport", label: "Transport & Vehicle", icon: Car, color: "#8a7555" },
  { id: "shopping-household", label: "Shopping & Household", icon: ShoppingBag, color: "#9878c0" },
  { id: "entertainment", label: "Entertainment & Dining", icon: Film, color: "#e08a5f" },
  { id: "insurance", label: "Insurance & Premiums", icon: ShieldAlert, color: "#5a8ba3" },
  { id: "card-interest", label: "Card Interest & Fees", icon: Percent, color: "#c64a6f" },
  { id: "savings-investments", label: "Savings & Investments", icon: PiggyBank, color: "#4a9b7a" },
  { id: "other", label: "Other Expenses", icon: MoreHorizontal, color: "#8a8075" },
];

const INCOME_CATEGORIES = [
  { id: "fixed", label: "Fixed Income", icon: Briefcase, color: "#4a9b7a" },
  { id: "emergency", label: "Emergency Funds", icon: ShieldAlert, color: "#e3a847" },
  { id: "passive", label: "Passive Income", icon: Repeat, color: "#7ba05b" },
  { id: "bonus", label: "Bonus & Rewards", icon: Gift, color: "#d96477" },
  { id: "refund", label: "Refunds & Reimbursements", icon: TrendingDown, color: "#5a8ba3" },
  { id: "other-income", label: "Other Income", icon: MoreHorizontal, color: "#8a8075" },
];

const getCat = (id, type) => {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.id === id) || list[list.length - 1];
};

const CURRENCY = "Rs.";

const CARD_COLORS = [
  ["#5b21b6", "#7c3aed"], ["#065f46", "#059669"],
  ["#1e3a8a", "#3b82f6"], ["#9a1a1a", "#dc2626"],
  ["#78350f", "#d97706"], ["#831843", "#db2777"],
  ["#134e4a", "#0d9488"], ["#1f2937", "#4b5563"],
];

const fmt = (n) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n || 0);

const fmtCompact = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (abs >= 100_000) return (n / 1_000).toFixed(0) + "K";
  if (abs >= 10_000) return (n / 1_000).toFixed(1) + "K";
  return fmt(n);
};

const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });
};

const emptyPlan = () => ({
  income: { total: 0, categories: {} },
  expense: { total: 0, categories: {} },
});

/* ─── ROOT APP (auth gate) ────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="loading"><div className="loading-ring" /></div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <style>{CSS}</style>
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <MainApp user={session.user} />
    </>
  );
}

/* ─── AUTH SCREEN ─────────────────────────────────────────── */
function AuthScreen() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true); setErr(null); setMsg(null);

    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMsg("Check your email for a confirmation link to complete signup.");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="app-glow" />
      <div className="auth-box">
        <div className="auth-brand">
          <div className="auth-logo">
            <Wallet size={20} strokeWidth={2} />
          </div>
          <div className="auth-brand-text">Ledger</div>
        </div>

        <h1 className="auth-title">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="auth-sub">
          {mode === "signup"
            ? "Start tracking income, expenses, and budgets."
            : "Sign in to your account to continue."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-lbl">Email</label>
          <div className="auth-input">
            <Mail size={15} />
            <input
              type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required
            />
          </div>

          <label className="field-lbl">Password</label>
          <div className="auth-input">
            <KeyRound size={15} />
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6}
            />
          </div>

          {err && <div className="auth-err">{err}</div>}
          {msg && <div className="auth-msg">{msg}</div>}

          <button type="submit" className="save-btn" disabled={busy || !email || !password}>
            {busy ? <><Loader2 size={16} className="spin" /> Please wait...</> : (mode === "signup" ? "Create account" : "Sign in")}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("signin"); setErr(null); setMsg(null); }}>Sign in</button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button onClick={() => { setMode("signup"); setErr(null); setMsg(null); }}>Sign up</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP (authenticated) ────────────────────────────── */
function MainApp({ user }) {
  const [tab, setTab] = useState("home");
  const [loaded, setLoaded] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [monthPlans, setMonthPlans] = useState({});
  const [fixedPlan, setFixedPlan] = useState(emptyPlan());
  const [showAdd, setShowAdd] = useState(false);
  const [showCardForm, setShowCardForm] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMonth, setViewMonth] = useState(monthKey(new Date()));
  const [errorBanner, setErrorBanner] = useState(null);

  /* Initial data load from Supabase */
  useEffect(() => {
    (async () => {
      try {
        const [txRows, cardRows, budgetRows] = await Promise.all([
          fetchTransactions(user.id),
          fetchCards(user.id),
          fetchBudgets(user.id),
        ]);

        // Map DB rows to app shape
        setTransactions(txRows.map((r) => ({
          id: r.id, type: r.type, amount: +r.amount, category: r.category,
          cardId: r.card_id, note: r.note || "", date: r.date,
        })));

        setCards(cardRows.map((r) => ({
          id: r.id, name: r.name, limit: +r.credit_limit,
          openingBalance: +r.opening_balance, colors: r.colors,
        })));

        // Split budgets into fixed + per-month
        const plans = {};
        let fixed = emptyPlan();
        budgetRows.forEach((r) => {
          const plan = {
            income: { total: +r.income_total, categories: r.income_categories || {} },
            expense: { total: +r.expense_total, categories: r.expense_categories || {} },
          };
          if (r.month_key === "fixed") fixed = plan;
          else plans[r.month_key] = plan;
        });
        setMonthPlans(plans);
        setFixedPlan(fixed);
      } catch (e) {
        console.error(e);
        setErrorBanner("Couldn't load your data. Please refresh.");
      } finally {
        setLoaded(true);
      }
    })();
  }, [user.id]);

  const showError = (msg) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(null), 4000);
  };

  const addTx = useCallback(async (tx) => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const dbRow = {
      id, user_id: user.id, type: tx.type, amount: tx.amount,
      category: tx.category || null, card_id: tx.cardId || null,
      note: tx.note || "", date: tx.date,
    };
    // optimistic update
    setTransactions((p) => [{ ...tx, id }, ...p]);
    try {
      await insertTransaction(dbRow);
    } catch (e) {
      setTransactions((p) => p.filter((t) => t.id !== id));
      showError("Couldn't save transaction. Try again.");
    }
  }, [user.id]);

  const deleteTx = useCallback(async (id) => {
    const prev = transactions;
    setTransactions((p) => p.filter((t) => t.id !== id));
    try {
      await deleteTransaction(id);
    } catch (e) {
      setTransactions(prev);
      showError("Couldn't delete transaction.");
    }
  }, [transactions]);

  const saveCard = useCallback(async (card) => {
    const id = card.id || `card_${Date.now()}`;
    const dbRow = {
      id, user_id: user.id, name: card.name,
      credit_limit: +card.limit || 0,
      opening_balance: +card.openingBalance || 0,
      colors: card.colors,
    };
    try {
      await upsertCard(dbRow);
      setCards((prev) => {
        const exists = prev.find((c) => c.id === id);
        const next = { id, name: card.name, limit: +card.limit, openingBalance: +card.openingBalance || 0, colors: card.colors };
        return exists ? prev.map((c) => (c.id === id ? next : c)) : [...prev, next];
      });
    } catch (e) {
      showError("Couldn't save card.");
    }
  }, [user.id]);

  const removeCard = useCallback(async (id) => {
    const prev = cards;
    setCards((p) => p.filter((c) => c.id !== id));
    try {
      await deleteCard(id);
    } catch (e) {
      setCards(prev);
      showError("Couldn't delete card.");
    }
  }, [cards]);

  const setMonthPlan = useCallback(async (month, plan) => {
    setMonthPlans((p) => ({ ...p, [month]: plan }));
    try {
      await upsertBudget({
        user_id: user.id,
        month_key: month,
        income_total: plan.income?.total || 0,
        income_categories: plan.income?.categories || {},
        expense_total: plan.expense?.total || 0,
        expense_categories: plan.expense?.categories || {},
      });
    } catch (e) {
      showError("Couldn't save budget.");
    }
  }, [user.id]);

  const saveFixedPlan = useCallback(async (plan) => {
    setFixedPlan(plan);
    try {
      await upsertBudget({
        user_id: user.id,
        month_key: "fixed",
        income_total: plan.income?.total || 0,
        income_categories: plan.income?.categories || {},
        expense_total: plan.expense?.total || 0,
        expense_categories: plan.expense?.categories || {},
      });
    } catch (e) {
      showError("Couldn't save fixed plan.");
    }
  }, [user.id]);

  const cardsWithBalance = useMemo(() => {
    return cards.map((card) => {
      let balance = card.openingBalance || 0;
      transactions.forEach((t) => {
        if (t.cardId !== card.id) return;
        if (t.type === "card-purchase" || t.type === "card-interest") balance += +t.amount;
        else if (t.type === "card-payment") balance -= +t.amount;
      });
      return { ...card, currentBalance: balance };
    });
  }, [cards, transactions]);

  const getEffectivePlan = useCallback((mKey) => {
    const specific = monthPlans[mKey];
    const hasSpecific = specific && (
      specific.income?.total > 0 ||
      Object.keys(specific.income?.categories || {}).length ||
      specific.expense?.total > 0 ||
      Object.keys(specific.expense?.categories || {}).length
    );
    if (hasSpecific) return { ...specific, source: "custom" };

    const hasFixed =
      fixedPlan.income?.total > 0 ||
      Object.keys(fixedPlan.income?.categories || {}).length ||
      fixedPlan.expense?.total > 0 ||
      Object.keys(fixedPlan.expense?.categories || {}).length;
    if (hasFixed) return { ...fixedPlan, source: "fixed" };

    return null;
  }, [monthPlans, fixedPlan]);

  const monthStats = useMemo(() => {
    const inMonth = transactions.filter((t) => monthKey(t.date) === viewMonth);
    const income = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + +t.amount, 0);
    const expenses = inMonth
      .filter((t) => t.type === "expense" || t.type === "card-purchase" || t.type === "card-interest")
      .reduce((s, t) => s + +t.amount, 0);
    const byExpCat = {};
    const byIncCat = {};
    inMonth.forEach((t) => {
      if (t.type === "income") byIncCat[t.category] = (byIncCat[t.category] || 0) + +t.amount;
      else if (t.type === "expense" || t.type === "card-purchase" || t.type === "card-interest") {
        byExpCat[t.category] = (byExpCat[t.category] || 0) + +t.amount;
      }
    });
    return { income, expenses, net: income - expenses, byExpCat, byIncCat, list: inMonth };
  }, [transactions, viewMonth]);

  if (!loaded) {
    return <div className="loading"><div className="loading-ring" /></div>;
  }

  return (
    <div className="app">
      <div className="app-glow" />

      {errorBanner && (
        <div className="error-banner">{errorBanner}</div>
      )}

      <main className="content">
        {tab === "home" && (
          <HomeView
            stats={monthStats}
            viewMonth={viewMonth} setViewMonth={setViewMonth}
            transactions={monthStats.list} onDelete={deleteTx}
            plan={getEffectivePlan(viewMonth)}
            cards={cardsWithBalance}
            user={user}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
        {tab === "dashboard" && (
          <DashView
            transactions={transactions}
            getEffectivePlan={getEffectivePlan}
            cards={cardsWithBalance}
          />
        )}
        {tab === "cards" && (
          <CardsView
            cards={cardsWithBalance} transactions={transactions}
            onEdit={(c) => setShowCardForm(c)}
            onNew={() => setShowCardForm("new")}
            onDelete={removeCard}
            onDeleteTx={deleteTx}
          />
        )}
        {tab === "budget" && (
          <BudgetView
            monthPlans={monthPlans} setMonthPlan={setMonthPlan}
            viewMonth={viewMonth} setViewMonth={setViewMonth}
            stats={monthStats}
            fixedPlan={fixedPlan} setFixedPlan={saveFixedPlan}
          />
        )}
      </main>

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add transaction">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <nav className="nav">
        <NavBtn icon={Wallet} label="Ledger" active={tab === "home"} onClick={() => setTab("home")} />
        <NavBtn icon={BarChart3} label="Insights" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
        <NavBtn icon={CreditCard} label="Cards" active={tab === "cards"} onClick={() => setTab("cards")} />
        <NavBtn icon={Target} label="Budget" active={tab === "budget"} onClick={() => setTab("budget")} />
      </nav>

      {showAdd && (
        <AddModal
          cards={cardsWithBalance} onClose={() => setShowAdd(false)}
          onSave={(tx) => { addTx(tx); setShowAdd(false); }}
        />
      )}

      {showCardForm && (
        <CardFormModal
          card={showCardForm === "new" ? null : showCardForm}
          onClose={() => setShowCardForm(null)}
          onSave={(c) => { saveCard(c); setShowCardForm(null); }}
        />
      )}

      {showSettings && (
        <SettingsModal user={user} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button className={`nav-btn ${active ? "active" : ""}`} onClick={onClick}>
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      <span>{label}</span>
    </button>
  );
}

/* ─── SETTINGS MODAL ──────────────────────────────────────── */
function SettingsModal({ user, onClose }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>Account</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="account-info">
          <div className="account-avatar">
            {(user.email || "?")[0].toUpperCase()}
          </div>
          <div className="account-meta">
            <div className="account-email">{user.email}</div>
            <div className="account-since">
              Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
          </div>
        </div>

        <button className="save-btn danger-btn" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />}
          Sign out
        </button>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

/* ─── HOME / LEDGER ───────────────────────────────────────── */
function HomeView({ stats, viewMonth, setViewMonth, transactions, onDelete, plan, cards, user, onOpenSettings }) {
  const changeMonth = (dir) => {
    const [y, m] = viewMonth.split("-").map(Number);
    setViewMonth(monthKey(new Date(y, m - 1 + dir, 1)));
  };

  const incomeTarget = plan?.income?.total || 0;
  const expenseBudget = plan?.expense?.total || 0;
  const incomeProgress = incomeTarget ? (stats.income / incomeTarget) * 100 : 0;
  const budgetUsed = expenseBudget ? (stats.expenses / expenseBudget) * 100 : 0;

  const totalCardDebt = cards.reduce((s, c) => s + (c.currentBalance || 0), 0);
  const totalLimit = cards.reduce((s, c) => s + (+c.limit || 0), 0);
  const utilization = totalLimit ? (totalCardDebt / totalLimit) * 100 : 0;

  const grouped = useMemo(() => {
    const g = {};
    transactions.forEach((t) => {
      const k = new Date(t.date).toDateString();
      if (!g[k]) g[k] = [];
      g[k].push(t);
    });
    return Object.entries(g).sort(([a], [b]) => new Date(b) - new Date(a));
  }, [transactions]);

  const getCardName = (id) => cards.find((c) => c.id === id)?.name || "Card";

  const greeting = getTimeOfDay();
  const isCurrentMonth = viewMonth === monthKey(new Date());
  const [mLbl, yLbl] = monthLabel(viewMonth).split(" ");

  const initial = (user.email || "?")[0].toUpperCase();

  return (
    <div className="view">
      <div className="hero">
        <div className="hero-top">
          <div>
            <div className="hero-meta">{isCurrentMonth ? `Good ${greeting}` : "Viewing"}</div>
            <h1 className="hero-title">Your money.</h1>
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
            <button className="avatar-btn" onClick={onOpenSettings} aria-label="Account">
              {initial}
            </button>
          </div>
        </div>

        <div className="balance">
          <div className="balance-label">Net {isCurrentMonth ? "this month" : ""}</div>
          <div className={`balance-amt ${stats.net < 0 ? "neg" : ""}`}>
            <span className="balance-sign">{stats.net < 0 ? "−" : ""}</span>
            <span className="balance-cur">{CURRENCY}</span>
            <span className="balance-num">{fmt(Math.abs(stats.net))}</span>
          </div>

          <div className="inout">
            <div className="io-cell">
              <div className="io-dot io-in"><ArrowUp size={12} strokeWidth={3} /></div>
              <div className="io-text">
                <div className="io-label">In</div>
                <div className="io-val">{CURRENCY} {fmtCompact(stats.income)}</div>
              </div>
            </div>
            <div className="io-cell">
              <div className="io-dot io-out"><ArrowDown size={12} strokeWidth={3} /></div>
              <div className="io-text">
                <div className="io-label">Out</div>
                <div className="io-val">{CURRENCY} {fmtCompact(stats.expenses)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {cards.length > 0 && totalCardDebt !== 0 && (
        <div className="debt-banner">
          <div className="db-left">
            <CreditCard size={16} />
            <div>
              <div className="db-label">Card debt</div>
              <div className="db-val">{CURRENCY} {fmt(totalCardDebt)}</div>
            </div>
          </div>
          <div className="db-right">
            <div className={`db-util ${utilization > 70 ? "warn" : ""} ${utilization > 90 ? "over" : ""}`}>
              {utilization.toFixed(0)}% used
            </div>
            <div className="db-limit">of {CURRENCY} {fmtCompact(totalLimit)}</div>
          </div>
        </div>
      )}

      {(incomeTarget > 0 || expenseBudget > 0) && (
        <div className="pulse-pair">
          {incomeTarget > 0 && (
            <div className="pulse-item">
              <div className="pi-top">
                <span className="pi-label">
                  <span className="pi-tag pi-in">Income</span>
                  Target
                  {plan?.source === "fixed" && <Lock size={10} />}
                </span>
                <span className={`pi-pct ${incomeProgress >= 100 ? "good" : ""}`}>
                  {incomeProgress.toFixed(0)}%
                </span>
              </div>
              <div className="pi-track">
                <div className="pi-fill in" style={{ width: `${Math.min(incomeProgress, 100)}%` }} />
              </div>
              <div className="pi-foot">
                <span>{CURRENCY} {fmtCompact(stats.income)} / {CURRENCY} {fmtCompact(incomeTarget)}</span>
              </div>
            </div>
          )}

          {expenseBudget > 0 && (
            <div className="pulse-item">
              <div className="pi-top">
                <span className="pi-label">
                  <span className="pi-tag pi-out">Budget</span>
                  {plan?.source === "fixed" && <Lock size={10} />}
                </span>
                <span className={`pi-pct ${budgetUsed > 100 ? "over" : budgetUsed > 80 ? "warn" : ""}`}>
                  {budgetUsed.toFixed(0)}%
                </span>
              </div>
              <div className="pi-track">
                <div
                  className={`pi-fill out ${budgetUsed > 100 ? "over" : budgetUsed > 80 ? "warn" : ""}`}
                  style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                />
              </div>
              <div className="pi-foot">
                <span>{CURRENCY} {fmtCompact(stats.expenses)} / {CURRENCY} {fmtCompact(expenseBudget)}</span>
                <span className={budgetUsed > 100 ? "pi-over" : "pi-left"}>
                  {budgetUsed > 100 ? "over" : `${CURRENCY} ${fmtCompact(Math.abs(expenseBudget - stats.expenses))} left`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="section-hd">
        <h2>Transactions</h2>
        <span className="count">{transactions.length}</span>
      </div>

      {transactions.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Sparkles size={28} strokeWidth={1.5} /></div>
          <div className="empty-title">Nothing here yet</div>
          <div className="empty-sub">Tap + to record your first entry</div>
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
                      cardName={t.cardId ? getCardName(t.cardId) : null} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TxRow({ tx, onDelete, cardName }) {
  const [open, setOpen] = useState(false);

  let cat, sign, color;
  if (tx.type === "income") {
    cat = getCat(tx.category, "income"); sign = "+"; color = "income";
  } else if (tx.type === "card-payment") {
    cat = { label: "Card Payment", icon: CreditCard, color: "#a594f9" };
    sign = "↔"; color = "neutral";
  } else if (tx.type === "card-interest") {
    cat = getCat("card-interest", "expense"); sign = "−"; color = "expense";
  } else if (tx.type === "card-purchase") {
    cat = getCat(tx.category, "expense"); sign = "−"; color = "expense";
  } else {
    cat = getCat(tx.category, "expense"); sign = "−"; color = "expense";
  }
  const Icon = cat.icon;

  return (
    <div className={`tx ${open ? "tx-open" : ""}`}>
      <button className="tx-main" onClick={() => setOpen(!open)}>
        <div className="tx-icon" style={{ background: `${cat.color}1a`, color: cat.color }}>
          <Icon size={17} strokeWidth={2} />
        </div>
        <div className="tx-body">
          <div className="tx-title">
            {tx.note || cat.label}
            {cardName && tx.type !== "card-payment" && (
              <span className="tx-card-chip"><CreditCard size={9} /> {cardName}</span>
            )}
          </div>
          <div className="tx-sub">
            {tx.type === "card-payment" ? `Payment → ${cardName}` :
              tx.type === "card-interest" ? `Interest/fees · ${cardName}` : cat.label}
          </div>
        </div>
        <div className={`tx-amt ${color}`}>
          <span className="tx-amt-sign">{sign}</span>{CURRENCY} {fmt(tx.amount)}
        </div>
      </button>
      {open && (
        <div className="tx-expand">
          <button className="tx-del" onClick={() => onDelete(tx.id)}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── DASHBOARD ───────────────────────────────────────────── */
function DashView({ transactions, getEffectivePlan, cards }) {
  const last6 = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
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
  }, [transactions, getEffectivePlan]);

  const maxBar = Math.max(...last6.flatMap((m) => [m.income, m.expenses, m.incomeTarget, m.expenseBudget]), 1);
  const thisMonth = monthKey(new Date());
  const thisStats = last6[last6.length - 1];
  const prevStats = last6[last6.length - 2];
  const currentPlan = getEffectivePlan(thisMonth);

  const expCatSpend = useMemo(() => {
    const inMonth = transactions.filter(
      (t) => monthKey(t.date) === thisMonth &&
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
          cat: getCat(id, "expense"),
        };
      })
      .sort((a, b) => {
        const aOver = a.budgetPct != null && a.budgetPct > 100 ? 1 : 0;
        const bOver = b.budgetPct != null && b.budgetPct > 100 ? 1 : 0;
        if (aOver !== bOver) return bOver - aOver;
        if (a.val !== b.val) return b.val - a.val;
        return (b.budgeted || 0) - (a.budgeted || 0);
      });
  }, [transactions, thisMonth, currentPlan]);

  const incCatEarn = useMemo(() => {
    const inMonth = transactions.filter((t) => monthKey(t.date) === thisMonth && t.type === "income");
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
          cat: getCat(id, "income"),
        };
      })
      .sort((a, b) => b.val - a.val);
  }, [transactions, thisMonth, currentPlan]);

  const avgSpend = last6.length ? last6.reduce((s, m) => s + m.expenses, 0) / last6.length : 0;
  const spendChange = prevStats?.expenses ? ((thisStats.expenses - prevStats.expenses) / prevStats.expenses) * 100 : 0;
  const budgetProgress = currentPlan?.expense?.total ? (thisStats.expenses / currentPlan.expense.total) * 100 : 0;
  const incomeProgress = currentPlan?.income?.total ? (thisStats.income / currentPlan.income.total) * 100 : 0;
  const hasPlan = currentPlan?.income?.total > 0 || currentPlan?.expense?.total > 0;

  const totalCardDebt = cards.reduce((s, c) => s + (c.currentBalance || 0), 0);
  const totalLimit = cards.reduce((s, c) => s + (+c.limit || 0), 0);
  const totalUtil = totalLimit ? (totalCardDebt / totalLimit) * 100 : 0;

  return (
    <div className="view">
      <div className="page-hd">
        <div className="page-eyebrow">Overview</div>
        <h1 className="page-title">Insights.</h1>
      </div>

      {cards.length > 0 && (
        <div className="card debt-card">
          <div className="card-hd">
            <h3>Credit health</h3>
            <span className="card-sub">{cards.length} card{cards.length > 1 ? "s" : ""}</span>
          </div>
          <div className="debt-grid">
            <div className="debt-stat">
              <div className="debt-label">Outstanding</div>
              <div className="debt-val">{CURRENCY} {fmtCompact(totalCardDebt)}</div>
            </div>
            <div className="debt-stat">
              <div className="debt-label">Available</div>
              <div className="debt-val in-color">{CURRENCY} {fmtCompact(totalLimit - totalCardDebt)}</div>
            </div>
          </div>
          <div className="ct-util-top" style={{ marginTop: 4 }}>
            <span>Overall utilization</span>
            <span className={totalUtil > 90 ? "over" : totalUtil > 70 ? "warn" : ""}>
              {totalUtil.toFixed(0)}%
            </span>
          </div>
          <div className="ct-util-bar">
            <div className={`ct-util-fill ${totalUtil > 90 ? "over" : totalUtil > 70 ? "warn" : ""}`}
              style={{ width: `${Math.min(totalUtil, 100)}%` }} />
          </div>
        </div>
      )}

      {hasPlan && (
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
      )}

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

      {incCatEarn.length > 0 && (
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
      )}

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

      <div className="metric-grid metric-single">
        <div className="metric">
          <div className="metric-top">
            <span className="metric-label">Avg. spend</span>
            <span className="metric-chip">6mo</span>
          </div>
          <div className="metric-val">{CURRENCY} {fmtCompact(avgSpend)}</div>
          {spendChange !== 0 && (
            <div className={`metric-delta ${spendChange > 0 ? "up" : "down"}`}>
              {spendChange > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(spendChange).toFixed(0)}% vs last
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── CARDS VIEW ──────────────────────────────────────────── */
function CardsView({ cards, transactions, onEdit, onNew, onDelete, onDeleteTx }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const totalDebt = cards.reduce((s, c) => s + (c.currentBalance || 0), 0);
  const totalLimit = cards.reduce((s, c) => s + (+c.limit || 0), 0);
  const totalAvailable = totalLimit - totalDebt;
  const totalUtil = totalLimit ? (totalDebt / totalLimit) * 100 : 0;

  // Re-derive selected card from latest cards array so balance stays current
  const currentSelected = selectedCard ? cards.find((c) => c.id === selectedCard.id) : null;

  if (currentSelected) {
    return (
      <CardDetailView card={currentSelected}
        transactions={transactions.filter((t) => t.cardId === currentSelected.id)}
        onBack={() => setSelectedCard(null)}
        onEdit={() => onEdit(currentSelected)}
        onDelete={() => { onDelete(currentSelected.id); setSelectedCard(null); }}
        onDeleteTx={onDeleteTx} />
    );
  }

  return (
    <div className="view">
      <div className="page-hd">
        <div className="page-eyebrow">Credit</div>
        <h1 className="page-title">Cards.</h1>
      </div>

      {cards.length > 0 && (
        <div className="summary-card">
          <div className="summary-row">
            <div className="summary-col">
              <div className="summary-label">Total debt</div>
              <div className="summary-val out-color">{CURRENCY} {fmtCompact(totalDebt)}</div>
            </div>
            <div className="summary-divider" />
            <div className="summary-col">
              <div className="summary-label">Available</div>
              <div className="summary-val in-color">{CURRENCY} {fmtCompact(totalAvailable)}</div>
            </div>
          </div>
          <div className="summary-savings">
            <span>Utilization</span>
            <strong className={totalUtil > 70 ? "neg" : "pos"}>
              {totalUtil.toFixed(0)}% of {CURRENCY} {fmtCompact(totalLimit)}
            </strong>
          </div>
        </div>
      )}

      <button className="add-card-btn" onClick={onNew}>
        <Plus size={16} /> Add a card
      </button>

      {cards.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><CreditCard size={26} strokeWidth={1.5} /></div>
          <div className="empty-title">No cards yet</div>
          <div className="empty-sub">Add a card to start tracking</div>
        </div>
      ) : (
        <div className="cards-stack">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} onClick={() => setSelectedCard(card)} />
          ))}
        </div>
      )}
      <div style={{ height: "80px" }} />
    </div>
  );
}

function CardTile({ card, onClick }) {
  const util = card.limit ? (card.currentBalance / card.limit) * 100 : 0;
  const [from, to] = card.colors || CARD_COLORS[0];
  const available = (+card.limit || 0) - card.currentBalance;

  return (
    <button className="card-tile" onClick={onClick}>
      <div className="ct-visual" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
        <div className="ct-vis-top">
          <span className="ct-bank">{card.name}</span>
          <CreditCard size={18} strokeWidth={1.5} />
        </div>
        <div className="ct-vis-mid">
          <div className="ct-vis-label">Balance</div>
          <div className="ct-vis-val">{CURRENCY} {fmt(card.currentBalance)}</div>
        </div>
        <div className="ct-vis-bot">
          <div>
            <div className="ct-vis-label-sm">Available</div>
            <div className="ct-vis-val-sm">{CURRENCY} {fmtCompact(available)}</div>
          </div>
          <div className="ct-vis-right">
            <div className="ct-vis-label-sm">Limit</div>
            <div className="ct-vis-val-sm">{CURRENCY} {fmtCompact(+card.limit || 0)}</div>
          </div>
        </div>
      </div>
      <div className="ct-util">
        <div className="ct-util-top">
          <span>Utilization</span>
          <span className={util > 90 ? "over" : util > 70 ? "warn" : ""}>{util.toFixed(0)}%</span>
        </div>
        <div className="ct-util-bar">
          <div className={`ct-util-fill ${util > 90 ? "over" : util > 70 ? "warn" : ""}`}
            style={{ width: `${Math.min(util, 100)}%` }} />
        </div>
      </div>
    </button>
  );
}

function CardDetailView({ card, transactions, onBack, onEdit, onDelete, onDeleteTx }) {
  const [from, to] = card.colors || CARD_COLORS[0];
  const util = card.limit ? (card.currentBalance / card.limit) * 100 : 0;
  const available = (+card.limit || 0) - card.currentBalance;
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const thisMonthTx = transactions.filter((t) => monthKey(t.date) === monthKey(new Date()));
  const thisMonthPurchases = thisMonthTx.filter((t) => t.type === "card-purchase").reduce((s, t) => s + +t.amount, 0);
  const thisMonthPayments = thisMonthTx.filter((t) => t.type === "card-payment").reduce((s, t) => s + +t.amount, 0);
  const thisMonthInterest = thisMonthTx.filter((t) => t.type === "card-interest").reduce((s, t) => s + +t.amount, 0);

  return (
    <div className="view">
      <div className="detail-head">
        <button className="back-btn" onClick={onBack}><ChevronLeft size={18} /></button>
        <div className="detail-actions">
          <button className="icon-btn" onClick={onEdit}><Edit2 size={14} /></button>
          <button className="icon-btn danger"
            onClick={() => { if (confirm(`Delete ${card.name}? This won't delete linked transactions.`)) onDelete(); }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="ct-visual big" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
        <div className="ct-vis-top">
          <span className="ct-bank">{card.name}</span>
          <CreditCard size={20} strokeWidth={1.5} />
        </div>
        <div className="ct-vis-mid">
          <div className="ct-vis-label">Balance</div>
          <div className="ct-vis-val big">{CURRENCY} {fmt(card.currentBalance)}</div>
        </div>
        <div className="ct-vis-bot">
          <div>
            <div className="ct-vis-label-sm">Available</div>
            <div className="ct-vis-val-sm">{CURRENCY} {fmt(available)}</div>
          </div>
          <div className="ct-vis-right">
            <div className="ct-vis-label-sm">Limit</div>
            <div className="ct-vis-val-sm">{CURRENCY} {fmt(+card.limit || 0)}</div>
          </div>
        </div>
      </div>

      <div className="ct-util card-detail-util">
        <div className="ct-util-top">
          <span>Utilization</span>
          <span className={util > 90 ? "over" : util > 70 ? "warn" : ""}>{util.toFixed(0)}%</span>
        </div>
        <div className="ct-util-bar">
          <div className={`ct-util-fill ${util > 90 ? "over" : util > 70 ? "warn" : ""}`}
            style={{ width: `${Math.min(util, 100)}%` }} />
        </div>
        {util > 70 && (
          <div className="util-warning">
            <AlertTriangle size={11} />
            <span>High utilization hurts credit score. Aim for under 30%.</span>
          </div>
        )}
      </div>

      <div className="detail-stats">
        <div className="ds-stat">
          <div className="ds-label">Purchases</div>
          <div className="ds-val out-color">+{CURRENCY} {fmtCompact(thisMonthPurchases)}</div>
          <div className="ds-sub">This month</div>
        </div>
        <div className="ds-stat">
          <div className="ds-label">Payments</div>
          <div className="ds-val in-color">−{CURRENCY} {fmtCompact(thisMonthPayments)}</div>
          <div className="ds-sub">This month</div>
        </div>
        <div className="ds-stat">
          <div className="ds-label">Interest</div>
          <div className="ds-val warn-color">+{CURRENCY} {fmtCompact(thisMonthInterest)}</div>
          <div className="ds-sub">This month</div>
        </div>
      </div>

      <div className="section-hd">
        <h2>Activity</h2>
        <span className="count">{sorted.length}</span>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-sm">No activity on this card yet</div>
      ) : (
        <div className="tx-stack">
          {sorted.map((t) => <TxRow key={t.id} tx={t} onDelete={onDeleteTx} cardName={card.name} />)}
        </div>
      )}
      <div style={{ height: "80px" }} />
    </div>
  );
}

/* ─── BUDGET ──────────────────────────────────────────────── */
function BudgetView({ monthPlans, setMonthPlan, viewMonth, setViewMonth, stats, fixedPlan, setFixedPlan }) {
  const [mode, setMode] = useState("fixed");
  const [side, setSide] = useState("expense");
  const [fixedEdit, setFixedEdit] = useState(fixedPlan);
  const [monthEdit, setMonthEdit] = useState(monthPlans[viewMonth] || emptyPlan());
  const [saved, setSaved] = useState(false);

  useEffect(() => { setFixedEdit(fixedPlan); }, [fixedPlan]);
  useEffect(() => { setMonthEdit(monthPlans[viewMonth] || emptyPlan()); }, [viewMonth, monthPlans]);

  const changeMonth = (dir) => {
    const [y, m] = viewMonth.split("-").map(Number);
    setViewMonth(monthKey(new Date(y, m - 1 + dir, 1)));
  };

  const handleSave = async () => {
    if (mode === "fixed") await setFixedPlan(fixedEdit);
    else await setMonthPlan(viewMonth, monthEdit);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const copyFromFixed = () => setMonthEdit(JSON.parse(JSON.stringify(fixedPlan)));

  const isFixed = mode === "fixed";
  const plan = isFixed ? fixedEdit : monthEdit;
  const setPlan = isFixed ? setFixedEdit : setMonthEdit;
  const sidePlan = plan[side] || { total: 0, categories: {} };
  const total = sidePlan.total || "";
  const cats = sidePlan.categories || {};

  const updateTotal = (v) => setPlan({ ...plan, [side]: { ...sidePlan, total: +v || 0 } });
  const updateCat = (id, v) => setPlan({ ...plan, [side]: { ...sidePlan, categories: { ...cats, [id]: v } } });

  const allocated = Object.values(cats).reduce((s, v) => s + (+v || 0), 0);
  const remaining = +total - allocated;
  const catList = side === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const actuals = side === "income" ? stats.byIncCat : stats.byExpCat;

  const incomeTotal = plan.income?.total || 0;
  const expenseTotal = plan.expense?.total || 0;
  const plannedSavings = incomeTotal - expenseTotal;

  return (
    <div className="view">
      <div className="page-hd">
        <div className="page-eyebrow">Plan</div>
        <h1 className="page-title">Budget.</h1>
      </div>

      <div className="mode-toggle">
        <div className={`mode-slider ${mode}`} />
        <button className={isFixed ? "active" : ""} onClick={() => setMode("fixed")}>
          <Lock size={13} strokeWidth={2.5} /> Fixed plan
        </button>
        <button className={!isFixed ? "active" : ""} onClick={() => setMode("month")}>
          <Unlock size={13} strokeWidth={2.5} /> This month
        </button>
      </div>

      {isFixed ? (
        <div className="mode-desc">Your default recurring plan. Applied every month unless overridden.</div>
      ) : (
        <>
          <div className="month-pill month-pill-full">
            <button onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button>
            <span>{monthLabel(viewMonth)}</span>
            <button onClick={() => changeMonth(1)}><ChevronRight size={16} /></button>
          </div>
          {(fixedPlan.income?.total > 0 || fixedPlan.expense?.total > 0) && (
            <button className="copy-btn" onClick={copyFromFixed}>
              <Copy size={12} /> Copy from fixed plan
            </button>
          )}
        </>
      )}

      {(incomeTotal > 0 || expenseTotal > 0) && (
        <div className="summary-card">
          <div className="summary-row">
            <div className="summary-col">
              <div className="summary-label">Income target</div>
              <div className="summary-val in-color">{CURRENCY} {fmtCompact(incomeTotal)}</div>
            </div>
            <div className="summary-divider" />
            <div className="summary-col">
              <div className="summary-label">Expense budget</div>
              <div className="summary-val out-color">{CURRENCY} {fmtCompact(expenseTotal)}</div>
            </div>
          </div>
          {incomeTotal > 0 && expenseTotal > 0 && (
            <div className="summary-savings">
              <span>Planned savings</span>
              <strong className={plannedSavings >= 0 ? "pos" : "neg"}>
                {CURRENCY} {fmt(plannedSavings)} · {((plannedSavings / incomeTotal) * 100).toFixed(0)}%
              </strong>
            </div>
          )}
        </div>
      )}

      <div className="side-toggle">
        <div className={`side-slider ${side}`} />
        <button className={side === "income" ? "active" : ""} onClick={() => setSide("income")}>
          <ArrowUp size={13} strokeWidth={2.5} /> Income
        </button>
        <button className={side === "expense" ? "active" : ""} onClick={() => setSide("expense")}>
          <ArrowDown size={13} strokeWidth={2.5} /> Expenses
        </button>
      </div>

      <div className="card">
        <label className="field-lbl">
          {side === "income"
            ? (isFixed ? "Fixed monthly income target" : "This month's income target")
            : (isFixed ? "Fixed monthly expense budget" : "This month's expense budget")}
        </label>
        <div className={`big-input ${side === "income" ? "in-accent" : ""}`}>
          <span className="big-cur">{CURRENCY}</span>
          <input type="number" value={total}
            onChange={(e) => updateTotal(e.target.value)}
            placeholder="0.00" inputMode="decimal" />
        </div>
        <div className="hint">
          {side === "income" ? "The total you expect to earn across all sources"
            : "The total you plan to spend across all categories"}
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>By category</h3>
          {+total > 0 && (
            <span className={`alloc ${remaining < 0 ? "neg" : ""}`}>
              {CURRENCY} {fmtCompact(Math.abs(remaining))} {remaining < 0 ? "over" : "unallocated"}
            </span>
          )}
        </div>
        <div className="cat-budgets">
          {catList.map((c) => {
            const Icon = c.icon;
            const actual = isFixed ? 0 : (actuals[c.id] || 0);
            const limit = +cats[c.id] || 0;
            const pct = limit && !isFixed ? (actual / limit) * 100 : 0;
            return (
              <div key={c.id} className="cat-budget">
                <div className="cb-top">
                  <div className="cb-left">
                    <div className="cb-icon" style={{ background: `${c.color}1a`, color: c.color }}>
                      <Icon size={14} strokeWidth={2} />
                    </div>
                    <span className="cb-name">{c.label}</span>
                  </div>
                  <div className="cb-input">
                    <span>{CURRENCY}</span>
                    <input type="number" value={cats[c.id] || ""}
                      onChange={(e) => updateCat(c.id, e.target.value)}
                      placeholder="0" inputMode="decimal" />
                  </div>
                </div>
                {limit > 0 && !isFixed && (
                  <>
                    <div className="cb-bar">
                      <div className={`cb-fill ${side === "expense" ? (pct > 100 ? "over" : pct > 80 ? "warn" : "") : ""}`}
                        style={{ width: `${Math.min(pct, 100)}%`,
                          background: side === "expense" ? (pct > 100 ? undefined : c.color) : c.color }} />
                    </div>
                    <div className="cb-foot">
                      {CURRENCY} {fmt(actual)} / {CURRENCY} {fmt(limit)} · {pct.toFixed(0)}%
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button className={`save-btn ${saved ? "saved" : ""}`} onClick={handleSave}>
        {saved ? <><Check size={17} strokeWidth={2.5} /> Saved</> : (isFixed ? "Save fixed plan" : "Save for this month")}
      </button>
      <div style={{ height: "80px" }} />
    </div>
  );
}

/* ─── ADD MODAL ───────────────────────────────────────────── */
function AddModal({ cards, onClose, onSave }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("loan");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cardId, setCardId] = useState(cards[0]?.id || "");

  const isCardType = type === "card-purchase" || type === "card-payment" || type === "card-interest";

  const cats = type === "income" ? INCOME_CATEGORIES
    : type === "card-interest" ? [getCat("card-interest", "expense")]
      : type === "card-payment" ? [] : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (type === "income") setCategory("fixed");
    else if (type === "card-interest") setCategory("card-interest");
    else if (type === "card-payment") setCategory("");
    else setCategory("loan");
  }, [type]);

  useEffect(() => {
    if (isCardType && cards.length > 0 && !cardId) setCardId(cards[0].id);
  }, [type, cards, cardId, isCardType]);

  const handleSave = () => {
    if (!amount || +amount <= 0) return;
    if (isCardType && !cardId) return;
    const tx = { type, amount: +amount, note, date };
    if (type === "income") tx.category = category;
    else if (type === "expense") tx.category = category;
    else if (type === "card-purchase") { tx.category = category; tx.cardId = cardId; }
    else if (type === "card-interest") { tx.category = "card-interest"; tx.cardId = cardId; }
    else if (type === "card-payment") { tx.cardId = cardId; }
    onSave(tx);
  };

  const valid = amount && +amount > 0 && (!isCardType || cardId);

  const typeOptions = [
    { id: "expense", label: "Expense", icon: ArrowDown },
    { id: "income", label: "Income", icon: ArrowUp },
    { id: "card-purchase", label: "Card Purchase", icon: CreditCard, needCard: true },
    { id: "card-payment", label: "Card Payment", icon: CreditCard, needCard: true },
    { id: "card-interest", label: "Card Interest", icon: Percent, needCard: true },
  ];
  const availableTypes = typeOptions.filter((t) => !t.needCard || cards.length > 0);

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>New entry</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="type-chips">
          {availableTypes.map((t) => {
            const Ic = t.icon;
            return (
              <button key={t.id}
                className={`type-chip ${type === t.id ? "active" : ""} ${t.id.startsWith("card") ? "card" : ""}`}
                onClick={() => setType(t.id)}>
                <Ic size={12} strokeWidth={2.5} />{t.label}
              </button>
            );
          })}
        </div>

        {cards.length === 0 && (
          <div className="hint" style={{ marginBottom: 12 }}>
            Add a card in the Cards tab to record card transactions.
          </div>
        )}

        <div className="amount-input">
          <span className="amt-cur">{CURRENCY}</span>
          <input type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" autoFocus inputMode="decimal" />
        </div>

        {type === "card-payment" && (
          <div className="hint" style={{ marginTop: 8 }}>
            This reduces your card balance — it's not a new expense (the purchases were already recorded).
          </div>
        )}

        {isCardType && cards.length > 0 && (
          <>
            <label className="field-lbl">Card</label>
            <div className="card-picker">
              {cards.map((c) => {
                const [from, to] = c.colors || CARD_COLORS[0];
                return (
                  <button key={c.id}
                    className={`cp-btn ${cardId === c.id ? "active" : ""}`}
                    onClick={() => setCardId(c.id)}
                    style={{ borderColor: cardId === c.id ? to : "transparent" }}>
                    <div className="cp-swatch" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
                    <div className="cp-info">
                      <div className="cp-name">{c.name}</div>
                      <div className="cp-bal">{CURRENCY} {fmtCompact(c.currentBalance)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {cats.length > 1 && type !== "card-interest" && type !== "card-payment" && (
          <>
            <label className="field-lbl">Category</label>
            <div className="cat-grid">
              {cats.map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button key={c.id} className={`cat-btn ${active ? "active" : ""}`}
                    onClick={() => setCategory(c.id)}
                    style={active ? { borderColor: c.color, background: `${c.color}14` } : {}}>
                    <div className="cb-btn-icon" style={{ background: `${c.color}26`, color: c.color }}>
                      <Icon size={14} strokeWidth={2} />
                    </div>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <label className="field-lbl">Note</label>
        <input type="text" className="text-input" value={note}
          onChange={(e) => setNote(e.target.value)} placeholder="Optional description" />

        <label className="field-lbl">Date</label>
        <input type="date" className="text-input" value={date}
          onChange={(e) => setDate(e.target.value)} />

        <button className={`save-btn ${!valid ? "disabled" : ""}`} onClick={handleSave} disabled={!valid}>
          Record
        </button>
      </div>
    </div>
  );
}

/* ─── CARD FORM MODAL ─────────────────────────────────────── */
function CardFormModal({ card, onClose, onSave }) {
  const [name, setName] = useState(card?.name || "");
  const [limit, setLimit] = useState(card?.limit || "");
  const [openingBalance, setOpeningBalance] = useState(card?.openingBalance || "");
  const [colorIdx, setColorIdx] = useState(
    card?.colors ? CARD_COLORS.findIndex((c) => c[0] === card.colors[0])
      : Math.floor(Math.random() * CARD_COLORS.length)
  );

  const handleSave = () => {
    if (!name.trim() || !limit || +limit <= 0) return;
    onSave({
      id: card?.id, name: name.trim(),
      limit: +limit, openingBalance: +openingBalance || 0,
      colors: CARD_COLORS[colorIdx],
    });
  };

  const valid = name.trim() && limit && +limit > 0;
  const [from, to] = CARD_COLORS[colorIdx];

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>{card ? "Edit card" : "New card"}</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ct-visual preview" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
          <div className="ct-vis-top">
            <span className="ct-bank">{name || "Card Name"}</span>
            <CreditCard size={18} strokeWidth={1.5} />
          </div>
          <div className="ct-vis-mid">
            <div className="ct-vis-label">Limit</div>
            <div className="ct-vis-val">{CURRENCY} {fmt(+limit || 0)}</div>
          </div>
        </div>

        <label className="field-lbl">Card name</label>
        <input type="text" className="text-input" value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. HSBC Visa, Sampath Platinum" autoFocus />

        <label className="field-lbl">Credit limit</label>
        <div className="big-input">
          <span className="big-cur">{CURRENCY}</span>
          <input type="number" value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="0.00" inputMode="decimal" />
        </div>

        <label className="field-lbl">Current outstanding balance {card ? "" : "(optional)"}</label>
        <div className="big-input">
          <span className="big-cur">{CURRENCY}</span>
          <input type="number" value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="0.00" inputMode="decimal" />
        </div>
        <div className="hint">
          {card ? "Editing this adjusts the card's starting balance. Transactions still count on top."
            : "If you already owe money on this card, enter it here. Leave 0 if starting fresh."}
        </div>

        <label className="field-lbl">Color</label>
        <div className="color-grid">
          {CARD_COLORS.map((c, i) => (
            <button key={i} className={`color-swatch ${colorIdx === i ? "active" : ""}`}
              style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }}
              onClick={() => setColorIdx(i)} aria-label={`Color ${i + 1}`}>
              {colorIdx === i && <Check size={14} strokeWidth={3} color="white" />}
            </button>
          ))}
        </div>

        <button className={`save-btn ${!valid ? "disabled" : ""}`} onClick={handleSave} disabled={!valid}>
          {card ? "Update card" : "Add card"}
        </button>
      </div>
    </div>
  );
}

/* ─── HELPERS ─────────────────────────────────────────────── */
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 5) return "evening";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/* ─── STYLES (appended from bundle) ──────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg: #0d1117;
  --bg-2: #151a23;
  --surface: #1b2130;
  --surface-2: #232a3b;
  --border: rgba(255, 255, 255, 0.06);
  --border-2: rgba(255, 255, 255, 0.11);
  --ink: #f0f2f6;
  --ink-soft: #a3acbd;
  --ink-faint: #6a7388;
  --accent: #7dd3c0;
  --accent-soft: rgba(125, 211, 192, 0.12);
  --in: #6ee7a8;
  --in-soft: rgba(110, 231, 168, 0.14);
  --out: #ff9478;
  --out-soft: rgba(255, 148, 120, 0.14);
  --bud: #a594f9;
  --warn: #f5c265;
  --danger: #ff6b6b;
  --danger-soft: rgba(255, 107, 107, 0.14);
  --neutral: #a594f9;
  --neutral-soft: rgba(165, 148, 249, 0.14);
  --radius: 18px;
  --radius-sm: 12px;
  --radius-lg: 24px;
  --serif: 'PT Serif', Cambria, 'Georgia', 'Times New Roman', serif;
  --sans: 'Source Sans 3', -apple-system, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--ink); font-family: var(--sans); -webkit-font-smoothing: antialiased; letter-spacing: 0; }

.loading { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; }
.loading-ring { width: 28px; height: 28px; border: 2px solid var(--border-2); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

.app { max-width: 440px; margin: 0 auto; min-height: 100vh; background: var(--bg); position: relative; overflow-x: hidden; padding-bottom: 110px; }
.app-glow { position: fixed; top: -180px; left: 50%; transform: translateX(-50%); width: 560px; height: 420px; background: radial-gradient(circle, rgba(125, 211, 192, 0.08), transparent 60%); pointer-events: none; z-index: 0; }
.content { position: relative; z-index: 1; }
.view { padding: 20px 18px 24px; animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ── AUTH ── */
.auth-page { min-height: 100vh; background: var(--bg); position: relative; display: flex; align-items: center; justify-content: center; padding: 20px; }
.auth-box { width: 100%; max-width: 380px; position: relative; z-index: 1; }
.auth-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
.auth-logo { width: 36px; height: 36px; border-radius: 10px; background: var(--accent); color: var(--bg); display: flex; align-items: center; justify-content: center; }
.auth-brand-text { font-family: var(--serif); font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
.auth-title { font-family: var(--serif); font-size: 28px; font-weight: 700; letter-spacing: -0.015em; margin-bottom: 6px; }
.auth-sub { font-size: 13px; color: var(--ink-soft); margin-bottom: 24px; line-height: 1.5; }
.auth-form { display: flex; flex-direction: column; }
.auth-input { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 12px; transition: border-color 0.15s; color: var(--ink-faint); }
.auth-input:focus-within { border-color: var(--accent); color: var(--ink); }
.auth-input input { flex: 1; border: none; background: none; outline: none; color: var(--ink); font-family: inherit; font-size: 14px; min-width: 0; }
.auth-input input::placeholder { color: var(--ink-faint); }
.auth-err { background: var(--danger-soft); color: var(--danger); padding: 10px 12px; border-radius: 10px; font-size: 12px; margin: 4px 0 12px; }
.auth-msg { background: var(--in-soft); color: var(--in); padding: 10px 12px; border-radius: 10px; font-size: 12px; margin: 4px 0 12px; line-height: 1.4; }
.auth-switch { text-align: center; margin-top: 20px; font-size: 13px; color: var(--ink-soft); }
.auth-switch button { background: none; border: none; color: var(--accent); font-weight: 600; font-family: inherit; font-size: 13px; cursor: pointer; padding: 0; }
.auth-switch button:hover { text-decoration: underline; }

/* ── ERROR BANNER ── */
.error-banner { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); background: var(--danger-soft); color: var(--danger); padding: 10px 18px; border-radius: 100px; font-size: 13px; font-weight: 500; z-index: 200; box-shadow: 0 4px 20px rgba(0,0,0,0.4); animation: slideDownBanner 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes slideDownBanner { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

/* ── HERO ── */
.hero { padding: 14px 4px 0; margin-bottom: 22px; }
.hero-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; gap: 12px; }
.hero-right { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
.hero-meta { font-size: 12px; color: var(--ink-faint); margin-bottom: 4px; font-weight: 500; }
.hero-title { font-family: var(--serif); font-size: 32px; font-weight: 700; letter-spacing: -0.015em; line-height: 1.05; }
.avatar-btn { width: 34px; height: 34px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); color: var(--ink); font-family: var(--serif); font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
.avatar-btn:hover { background: var(--surface-2); border-color: var(--accent); }

.month-pill { display: flex; align-items: center; gap: 4px; background: var(--surface); border: 1px solid var(--border); border-radius: 100px; padding: 4px; flex-shrink: 0; }
.month-pill button { background: none; border: none; color: var(--ink-soft); width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
.month-pill button:hover { background: var(--surface-2); color: var(--ink); }
.month-pill span { font-size: 12px; font-weight: 500; padding: 0 4px; white-space: nowrap; }
.month-pill-full { justify-content: space-between; padding: 6px; margin-bottom: 12px; }
.month-pill-full span { font-size: 13px; flex: 1; text-align: center; }

.balance-label { font-family: var(--mono); font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 10px; }
.balance-amt { font-family: var(--serif); font-size: 56px; font-weight: 700; letter-spacing: -0.025em; line-height: 1; margin-bottom: 22px; display: flex; align-items: baseline; gap: 4px; color: var(--ink); }
.balance-amt.neg { color: var(--out); }
.balance-sign { font-size: 36px; color: var(--out); }
.balance-cur { font-size: 18px; color: var(--ink-faint); font-family: var(--sans); font-weight: 500; margin-right: 4px; }
.balance-num { font-variant-numeric: tabular-nums; }

.inout { display: flex; gap: 10px; }
.io-cell { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; display: flex; align-items: center; gap: 10px; }
.io-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.io-in { background: var(--in-soft); color: var(--in); }
.io-out { background: var(--out-soft); color: var(--out); }
.io-text { flex: 1; min-width: 0; }
.io-label { font-size: 11px; color: var(--ink-faint); margin-bottom: 1px; }
.io-val { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }

/* ── DEBT BANNER ── */
.debt-banner { background: linear-gradient(135deg, rgba(255, 148, 120, 0.08), rgba(165, 148, 249, 0.08)); border: 1px solid var(--border-2); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
.db-left { display: flex; align-items: center; gap: 10px; color: var(--out); }
.db-label { font-size: 11px; color: var(--ink-faint); }
.db-val { font-family: var(--serif); font-weight: 700; font-size: 18px; color: var(--ink); font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.db-right { text-align: right; }
.db-util { font-family: var(--mono); font-size: 11px; font-weight: 600; color: var(--in); }
.db-util.warn { color: var(--warn); } .db-util.over { color: var(--danger); }
.db-limit { font-size: 10px; color: var(--ink-faint); margin-top: 1px; }

/* ── PULSE PAIR ── */
.pulse-pair { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
.pulse-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; }
.pi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.pi-label { font-size: 12px; font-weight: 500; color: var(--ink-soft); display: flex; align-items: center; gap: 8px; }
.pi-tag { font-family: var(--mono); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 7px; border-radius: 100px; }
.pi-tag.pi-in { background: var(--in-soft); color: var(--in); }
.pi-tag.pi-out { background: var(--out-soft); color: var(--out); }
.pi-pct { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--ink); }
.pi-pct.good { color: var(--in); } .pi-pct.warn { color: var(--warn); } .pi-pct.over { color: var(--danger); }
.pi-track { height: 6px; background: var(--bg-2); border-radius: 100px; overflow: hidden; }
.pi-fill { height: 100%; border-radius: 100px; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
.pi-fill.in { background: var(--in); } .pi-fill.out { background: var(--out); }
.pi-fill.warn { background: var(--warn); } .pi-fill.over { background: var(--danger); }
.pi-foot { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-faint); margin-top: 8px; font-variant-numeric: tabular-nums; }
.pi-left { color: var(--in); } .pi-over { color: var(--danger); }

/* ── SECTION HEADER ── */
.section-hd { display: flex; align-items: center; justify-content: space-between; margin: 8px 4px 12px; }
.section-hd h2 { font-family: var(--serif); font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
.count { font-family: var(--mono); font-size: 11px; color: var(--ink-faint); background: var(--surface); padding: 2px 8px; border-radius: 100px; border: 1px solid var(--border); }

/* ── EMPTY ── */
.empty { text-align: center; padding: 50px 20px; background: var(--surface); border: 1px dashed var(--border-2); border-radius: var(--radius); }
.empty-icon { width: 48px; height: 48px; margin: 0 auto 14px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; }
.empty-title { font-family: var(--serif); font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.empty-sub { font-size: 13px; color: var(--ink-faint); }
.empty-sm { padding: 24px; text-align: center; color: var(--ink-faint); font-size: 13px; }

/* ── TX LIST ── */
.tx-list { display: flex; flex-direction: column; gap: 18px; }
.tx-date { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-faint); padding: 0 4px 8px; }
.tx-date-total { font-variant-numeric: tabular-nums; }
.tx-stack { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.tx { border-bottom: 1px solid var(--border); transition: background 0.15s; }
.tx:last-child { border-bottom: none; }
.tx-open { background: var(--surface-2); }
.tx-main { width: 100%; background: none; border: none; padding: 13px 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; text-align: left; font-family: inherit; color: var(--ink); }
.tx-main:hover { background: var(--surface-2); }
.tx-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tx-body { flex: 1; min-width: 0; }
.tx-title { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; display: flex; align-items: center; gap: 6px; }
.tx-card-chip { font-family: var(--mono); font-size: 9px; font-weight: 500; background: var(--neutral-soft); color: var(--neutral); padding: 1px 6px; border-radius: 100px; display: inline-flex; align-items: center; gap: 3px; letter-spacing: 0.03em; flex-shrink: 0; }
.tx-sub { font-size: 11px; color: var(--ink-faint); }
.tx-amt { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; flex-shrink: 0; }
.tx-amt.income { color: var(--in); } .tx-amt.expense { color: var(--ink); } .tx-amt.neutral { color: var(--neutral); }
.tx-amt-sign { margin-right: 1px; opacity: 0.6; }
.tx-expand { padding: 0 14px 12px; display: flex; justify-content: flex-end; animation: slideDown 0.2s ease; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
.tx-del { background: var(--danger-soft); color: var(--danger); border: 1px solid transparent; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 6px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
.tx-del:hover { background: var(--danger); color: white; }

/* ── FAB / NAV ── */
.fab { position: fixed; right: max(calc(50% - 220px + 20px), 20px); bottom: 90px; width: 52px; height: 52px; border-radius: 50%; background: var(--accent); color: #0d1117; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 20px rgba(125, 211, 192, 0.28); z-index: 50; transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
.fab:hover { transform: scale(1.08); }
.fab:active { transform: scale(0.95); }
.nav { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); width: calc(100% - 24px); max-width: 416px; background: rgba(27, 33, 48, 0.82); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border-2); border-radius: 100px; padding: 5px; display: flex; z-index: 40; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4); }
.nav-btn { flex: 1; background: none; border: none; color: var(--ink-faint); padding: 8px 4px; border-radius: 100px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; font-family: inherit; font-size: 9px; font-weight: 500; transition: all 0.2s; }
.nav-btn.active { background: var(--ink); color: var(--bg); }

/* ── PAGE HEADER ── */
.page-hd { padding: 14px 4px 18px; }
.page-eyebrow { font-family: var(--mono); font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 6px; }
.page-title { font-family: var(--serif); font-size: 36px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }

/* ── CARDS VIEW ── */
.add-card-btn { background: var(--surface); border: 1px dashed var(--border-2); color: var(--ink-soft); padding: 14px; border-radius: var(--radius); font-family: inherit; font-size: 13px; font-weight: 500; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; margin-bottom: 14px; transition: all 0.15s; }
.add-card-btn:hover { background: var(--surface-2); color: var(--ink); border-color: var(--accent); }
.cards-stack { display: flex; flex-direction: column; gap: 14px; }
.card-tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 0; overflow: hidden; cursor: pointer; transition: all 0.2s; text-align: left; font-family: inherit; color: inherit; display: flex; flex-direction: column; }
.card-tile:hover { transform: translateY(-2px); border-color: var(--border-2); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }

.ct-visual { padding: 18px; color: white; display: flex; flex-direction: column; min-height: 160px; gap: 12px; position: relative; }
.ct-visual.big { min-height: 180px; border-radius: var(--radius); margin-bottom: 14px; }
.ct-visual.preview { min-height: 130px; border-radius: var(--radius); margin-bottom: 14px; }
.ct-vis-top { display: flex; justify-content: space-between; align-items: center; }
.ct-bank { font-family: var(--serif); font-size: 18px; font-weight: 700; letter-spacing: -0.01em; }
.ct-vis-mid { margin-top: auto; }
.ct-vis-label { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.7; margin-bottom: 4px; }
.ct-vis-val { font-family: var(--serif); font-size: 26px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.ct-vis-val.big { font-size: 34px; }
.ct-vis-bot { display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 10px; }
.ct-vis-right { text-align: right; }
.ct-vis-label-sm { font-family: var(--mono); font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; margin-bottom: 2px; }
.ct-vis-val-sm { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }

.ct-util { padding: 12px 16px 14px; }
.card-detail-util { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 14px; }
.ct-util-top { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-soft); margin-bottom: 6px; font-family: var(--mono); letter-spacing: 0.03em; }
.ct-util-top span:last-child { font-weight: 600; color: var(--ink); }
.ct-util-top span.warn { color: var(--warn); } .ct-util-top span.over { color: var(--danger); }
.ct-util-bar { height: 5px; background: var(--bg-2); border-radius: 100px; overflow: hidden; }
.ct-util-fill { height: 100%; background: var(--in); border-radius: 100px; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
.ct-util-fill.warn { background: var(--warn); } .ct-util-fill.over { background: var(--danger); }
.util-warning { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--warn); margin-top: 10px; padding: 8px 10px; background: rgba(245, 194, 101, 0.08); border-radius: 8px; font-family: var(--serif); }

/* Card detail */
.detail-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-top: 4px; }
.back-btn, .icon-btn { background: var(--surface); border: 1px solid var(--border); color: var(--ink-soft); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
.back-btn:hover, .icon-btn:hover { background: var(--surface-2); color: var(--ink); }
.icon-btn.danger:hover { background: var(--danger-soft); color: var(--danger); border-color: var(--danger-soft); }
.detail-actions { display: flex; gap: 8px; }
.detail-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
.ds-stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; }
.ds-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 6px; }
.ds-val { font-family: var(--serif); font-size: 16px; font-weight: 700; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
.ds-val.in-color { color: var(--in); } .ds-val.out-color { color: var(--out); } .ds-val.warn-color { color: var(--warn); }
.ds-sub { font-size: 9px; color: var(--ink-faint); margin-top: 2px; }

/* ── PLAN vs ACTUAL ── */
.plan-card { padding: 20px; }
.plan-row { padding: 14px 0; border-bottom: 1px solid var(--border); }
.plan-row:first-of-type { padding-top: 0; }
.plan-row:last-of-type { border-bottom: none; padding-bottom: 0; }
.plan-info { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; gap: 12px; }
.plan-label { font-size: 13px; font-weight: 500; color: var(--ink-soft); display: flex; align-items: center; gap: 8px; }
.plan-nums { text-align: right; font-variant-numeric: tabular-nums; }
.plan-actual { font-family: var(--serif); font-size: 20px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); display: block; line-height: 1.1; }
.plan-vs { font-size: 11px; color: var(--ink-faint); }
.plan-bar { height: 7px; background: var(--bg-2); border-radius: 100px; overflow: hidden; margin-bottom: 8px; }
.plan-fill { height: 100%; border-radius: 100px; transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
.plan-fill.in { background: var(--in); } .plan-fill.out { background: var(--out); }
.plan-fill.warn { background: var(--warn); } .plan-fill.over { background: var(--danger); }
.plan-pct { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-faint); font-variant-numeric: tabular-nums; }
.plan-pct .good { color: var(--in); } .plan-pct .warn-t { color: var(--warn); } .plan-pct .bad { color: var(--danger); }
.plan-gap { color: var(--ink-soft); } .plan-gap.good { color: var(--in); } .plan-gap.bad { color: var(--danger); }
.plan-summary { margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--border-2); }
.plan-sum-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; color: var(--ink-soft); }
.plan-sum-row strong { font-family: var(--mono); font-variant-numeric: tabular-nums; font-weight: 600; font-size: 13px; }
.plan-sum-row strong.pos { color: var(--in); } .plan-sum-row strong.neg { color: var(--danger); }

/* ── DEBT CARD ── */
.debt-card { padding: 18px; }
.debt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.debt-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 6px; }
.debt-val { font-family: var(--serif); font-size: 22px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.debt-val.in-color { color: var(--in); }

/* ── METRICS ── */
.metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
.metric-grid.metric-single { grid-template-columns: 1fr; }
.metric { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
.metric-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.metric-label { font-size: 11px; color: var(--ink-faint); font-weight: 500; }
.metric-chip { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint); background: var(--bg-2); padding: 2px 6px; border-radius: 100px; }
.metric-val { font-family: var(--serif); font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; margin-bottom: 6px; font-variant-numeric: tabular-nums; }
.metric-val.neg { color: var(--danger); }
.metric-delta { font-size: 11px; color: var(--ink-faint); display: flex; align-items: center; gap: 4px; }
.metric-delta.up { color: var(--out); } .metric-delta.down { color: var(--in); }

/* ── CARDS ── */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; margin-bottom: 16px; }
.card-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; gap: 12px; }
.card-hd h3 { font-family: var(--serif); font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
.card-sub { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint); }

.legend { display: flex; gap: 10px; font-size: 10px; color: var(--ink-soft); font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.08em; }
.legend span { display: flex; align-items: center; gap: 4px; }
.dot { width: 7px; height: 7px; border-radius: 2px; }
.dot.in { background: var(--in); } .dot.out { background: var(--out); } .dot.bud { background: var(--bud); }

/* ── CHART ── */
.chart { display: flex; align-items: flex-end; gap: 10px; height: 150px; position: relative; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; position: relative; }
.bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 3px; position: relative; }
.bar { flex: 1; max-width: 12px; border-radius: 3px 3px 0 0; transition: height 0.7s cubic-bezier(0.22, 1, 0.36, 1); min-height: 2px; }
.bar.in { background: var(--in); } .bar.out { background: var(--out); }
.plan-line { position: absolute; height: 2px; border-radius: 2px; box-shadow: 0 0 0 1px rgba(13, 17, 23, 0.8); transition: bottom 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
.plan-line.in-line { background: var(--in); opacity: 0.75; } .plan-line.out-line { background: var(--out); opacity: 0.75; }
.bar-lbl { margin-top: 10px; font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-faint); }

/* ── CAT LIST V2 ── */
.cat-list-v2 { display: flex; flex-direction: column; gap: 16px; }
.catv2 { padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.catv2:last-child { border-bottom: none; padding-bottom: 0; }
.catv2.unused { opacity: 0.62; }
.catv2.unused:hover { opacity: 1; }
.catv2-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
.catv2-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.cat-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.catv2-name { font-size: 13px; font-weight: 600; color: var(--ink); line-height: 1.2; }
.catv2-sub { font-family: var(--mono); font-size: 10px; color: var(--ink-faint); margin-top: 2px; font-variant-numeric: tabular-nums; letter-spacing: 0.01em; }
.catv2-sub .sep { color: var(--ink-faint); opacity: 0.5; }
.catv2-right { text-align: right; flex-shrink: 0; }
.catv2-remaining { font-family: var(--serif); font-size: 17px; font-weight: 700; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; color: var(--in); line-height: 1; }
.catv2-remaining.warn { color: var(--warn); } .catv2-remaining.over { color: var(--danger); } .catv2-remaining.good { color: var(--in); }
.catv2-remaining-lbl { font-family: var(--mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-faint); margin-top: 3px; }
.catv2-val { font-family: var(--serif); font-size: 16px; font-weight: 700; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; color: var(--ink); }
.catv2-bar { height: 5px; background: var(--bg-2); border-radius: 100px; overflow: hidden; }
.catv2-fill { height: 100%; border-radius: 100px; transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
.catv2-fill.warn { background: var(--warn) !important; } .catv2-fill.over { background: var(--danger) !important; }
.catv2-foot { display: flex; justify-content: space-between; margin-top: 6px; font-family: var(--mono); font-size: 10px; color: var(--ink-faint); letter-spacing: 0.03em; }
.catv2-foot .good { color: var(--in); font-weight: 600; }
.catv2-foot .warn-t { color: var(--warn); font-weight: 600; }
.catv2-foot .over { color: var(--danger); font-weight: 600; }

/* ── FIELDS ── */
.field-lbl { display: block; font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-faint); margin-bottom: 10px; margin-top: 16px; font-weight: 500; }
.field-lbl:first-child { margin-top: 0; }
.big-input { display: flex; align-items: baseline; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 18px; gap: 8px; margin-bottom: 8px; transition: border-color 0.15s; }
.big-input:focus-within { border-color: var(--accent); }
.big-input.in-accent:focus-within { border-color: var(--in); }
.big-cur { font-size: 14px; color: var(--ink-faint); font-weight: 500; }
.big-input input { flex: 1; border: none; background: none; outline: none; font-family: var(--serif); font-size: 28px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); width: 100%; min-width: 0; font-variant-numeric: tabular-nums; }
.big-input input::placeholder { color: var(--ink-faint); font-weight: 400; }
.hint { font-size: 13px; color: var(--ink-faint); padding: 2px 2px; font-family: var(--serif); line-height: 1.4; }
.alloc { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-soft); }
.alloc.neg { color: var(--danger); }

/* ── TOGGLES ── */
.mode-toggle, .side-toggle { position: relative; display: flex; background: var(--surface); border: 1px solid var(--border); padding: 4px; border-radius: 12px; margin-bottom: 12px; }
.mode-slider, .side-slider { position: absolute; top: 4px; bottom: 4px; width: calc(50% - 4px); border-radius: 9px; transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
.mode-slider { background: var(--accent); }
.mode-slider.fixed { transform: translateX(0); } .mode-slider.month { transform: translateX(100%); }
.side-slider { background: var(--ink); }
.side-slider.income { transform: translateX(0); } .side-slider.expense { transform: translateX(100%); }
.mode-toggle button, .side-toggle button { flex: 1; position: relative; z-index: 1; background: none; border: none; padding: 10px; border-radius: 9px; font-family: inherit; font-size: 13px; font-weight: 500; color: var(--ink-soft); cursor: pointer; transition: color 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; }
.mode-toggle button.active, .side-toggle button.active { color: var(--bg); }
.side-toggle { margin-top: 16px; margin-bottom: 14px; }
.mode-desc { font-family: var(--serif); font-size: 14px; color: var(--ink-soft); padding: 2px 8px 14px; line-height: 1.4; }
.copy-btn { background: var(--surface); border: 1px solid var(--border); color: var(--ink-soft); padding: 8px 12px; border-radius: 100px; font-family: inherit; font-size: 11px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; margin: 0 0 12px auto; transition: all 0.15s; }
.copy-btn:hover { background: var(--surface-2); color: var(--ink); }

/* ── SUMMARY CARD ── */
.summary-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 12px; }
.summary-row { display: flex; align-items: center; }
.summary-col { flex: 1; }
.summary-label { font-family: var(--mono); font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint); margin-bottom: 6px; }
.summary-val { font-family: var(--serif); font-size: 22px; font-weight: 700; letter-spacing: -0.01em; line-height: 1; font-variant-numeric: tabular-nums; }
.summary-val.in-color { color: var(--in); } .summary-val.out-color { color: var(--out); }
.summary-divider { width: 1px; height: 32px; background: var(--border-2); margin: 0 12px; }
.summary-savings { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; margin-top: 12px; border-top: 1px dashed var(--border-2); font-size: 12px; color: var(--ink-soft); }
.summary-savings strong { font-family: var(--mono); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
.summary-savings strong.pos { color: var(--in); } .summary-savings strong.neg { color: var(--danger); }

/* ── CAT BUDGETS ── */
.cat-budgets { display: flex; flex-direction: column; gap: 14px; }
.cat-budget { padding-bottom: 14px; border-bottom: 1px solid var(--border); }
.cat-budget:last-child { border-bottom: none; padding-bottom: 0; }
.cb-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.cb-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.cb-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cb-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cb-input { display: flex; align-items: center; background: var(--bg-2); border: 1px solid var(--border); border-radius: 10px; padding: 6px 10px; gap: 4px; width: 110px; flex-shrink: 0; transition: border-color 0.15s; }
.cb-input:focus-within { border-color: var(--accent); }
.cb-input span { font-size: 11px; color: var(--ink-faint); }
.cb-input input { border: none; background: none; outline: none; width: 100%; font-family: inherit; font-size: 13px; font-weight: 500; text-align: right; color: var(--ink); min-width: 0; font-variant-numeric: tabular-nums; }
.cb-input input::placeholder { color: var(--ink-faint); }
.cb-bar { height: 4px; background: var(--bg-2); border-radius: 100px; overflow: hidden; margin-top: 4px; }
.cb-fill { height: 100%; border-radius: 100px; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
.cb-fill.warn { background: var(--warn) !important; } .cb-fill.over { background: var(--danger) !important; }
.cb-foot { font-size: 11px; color: var(--ink-faint); margin-top: 6px; font-variant-numeric: tabular-nums; font-family: var(--mono); }

/* ── SAVE / DANGER BUTTONS ── */
.save-btn { width: 100%; background: var(--accent); color: #0d1117; border: none; padding: 16px; border-radius: var(--radius-sm); font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; letter-spacing: 0.01em; }
.save-btn:hover:not(.disabled):not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(125, 211, 192, 0.3); }
.save-btn:active { transform: translateY(0); }
.save-btn.saved { background: var(--in); }
.save-btn.disabled, .save-btn:disabled { background: var(--surface-2); color: var(--ink-faint); cursor: not-allowed; }
.save-btn.danger-btn { background: var(--danger-soft); color: var(--danger); }
.save-btn.danger-btn:hover:not(:disabled) { background: var(--danger); color: white; box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3); }

/* ── MODAL ── */
.backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: flex-end; animation: fadeBk 0.2s ease; }
@keyframes fadeBk { from { opacity: 0; } to { opacity: 1; } }
.sheet { width: 100%; max-width: 440px; margin: 0 auto; background: var(--bg-2); border: 1px solid var(--border-2); border-bottom: none; border-radius: var(--radius-lg) var(--radius-lg) 0 0; padding: 12px 18px 24px; max-height: 92vh; overflow-y: auto; animation: slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.sheet-handle { width: 36px; height: 4px; background: var(--border-2); border-radius: 100px; margin: 0 auto 16px; }
.sheet-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.sheet-hd h2 { font-family: var(--serif); font-weight: 700; font-size: 26px; letter-spacing: -0.01em; }
.close-btn { background: var(--surface); border: 1px solid var(--border); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink-soft); transition: all 0.15s; }
.close-btn:hover { background: var(--surface-2); color: var(--ink); }

.account-info { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--surface); border-radius: var(--radius); margin-bottom: 16px; }
.account-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--accent); color: var(--bg); font-family: var(--serif); font-weight: 700; font-size: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.account-email { font-size: 14px; font-weight: 600; color: var(--ink); word-break: break-all; }
.account-since { font-size: 11px; color: var(--ink-faint); margin-top: 2px; }

.type-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.type-chip { background: var(--surface); border: 1px solid var(--border); color: var(--ink-soft); padding: 7px 11px; border-radius: 100px; font-family: inherit; font-size: 11px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.15s; }
.type-chip:hover { background: var(--surface-2); color: var(--ink); }
.type-chip.active { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.type-chip.card.active { background: var(--neutral); color: var(--bg); border-color: var(--neutral); }

.amount-input { display: flex; align-items: baseline; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 18px; gap: 8px; margin-bottom: 4px; transition: border-color 0.15s; }
.amount-input:focus-within { border-color: var(--accent); }
.amt-cur { font-size: 16px; color: var(--ink-faint); font-weight: 500; }
.amount-input input { flex: 1; border: none; background: none; outline: none; font-family: var(--serif); font-size: 32px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); min-width: 0; width: 100%; font-variant-numeric: tabular-nums; }
.amount-input input::placeholder { color: var(--ink-faint); font-weight: 400; }

.card-picker { display: flex; flex-direction: column; gap: 6px; }
.cp-btn { background: var(--surface); border: 1.5px solid transparent; border-radius: 12px; padding: 10px; display: flex; align-items: center; gap: 12px; cursor: pointer; font-family: inherit; color: var(--ink); text-align: left; transition: all 0.15s; }
.cp-btn:hover { background: var(--surface-2); } .cp-btn.active { background: var(--surface-2); }
.cp-swatch { width: 36px; height: 24px; border-radius: 4px; flex-shrink: 0; }
.cp-info { flex: 1; }
.cp-name { font-size: 13px; font-weight: 500; }
.cp-bal { font-size: 11px; color: var(--ink-faint); margin-top: 1px; font-variant-numeric: tabular-nums; font-family: var(--mono); }

.cat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.cat-btn { background: var(--surface); border: 1.5px solid transparent; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; font-family: inherit; font-size: 12px; color: var(--ink); transition: all 0.15s; text-align: left; }
.cat-btn:hover { background: var(--surface-2); }
.cb-btn-icon { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cat-btn span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.text-input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 13px 14px; font-family: inherit; font-size: 14px; color: var(--ink); outline: none; transition: border-color 0.15s; }
.text-input:focus { border-color: var(--accent); }
.text-input::placeholder { color: var(--ink-faint); }
.text-input::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }

.color-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.color-swatch { height: 40px; border-radius: 10px; border: 2px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.color-swatch:hover { transform: scale(1.04); }
.color-swatch.active { border-color: var(--ink); box-shadow: 0 0 0 1px var(--bg), 0 0 0 3px var(--ink); }

.sheet::-webkit-scrollbar { width: 4px; }
.sheet::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 100px; }

@media (max-width: 380px) {
  .view { padding: 16px 14px 24px; }
  .hero-title { font-size: 28px; }
  .balance-amt { font-size: 48px; }
  .page-title { font-size: 32px; }
  .summary-val { font-size: 18px; }
  .nav-btn { font-size: 8px; }
}
`;
