import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, BarChart3, Wallet, CreditCard, Target } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import {
  fetchTransactions, insertTransaction, updateTransaction, deleteTransaction,
  fetchCards, upsertCard, deleteCard,
  fetchBudgets, upsertBudget,
  fetchInstallmentPlans, insertInstallmentPlan, updateInstallmentPlan,
  fetchRecurringReminders, insertRecurringReminder, updateRecurringReminder, deleteRecurringReminder,
} from "../lib/supabase.js";
import { loadUserCats, saveUserCats, loadUserCurrency, saveUserCurrency } from "../utils/storage.js";
import { monthKey, emptyPlan } from "../utils/format.js";
import NavBtn from "./NavBtn.jsx";
import PWABanners from "./PWABanners.jsx";
import DashView from "./DashView.jsx";
import HomeView from "./HomeView.jsx";
import CardsView from "./CardsView.jsx";
import BudgetView from "./BudgetView.jsx";
import AddModal from "./AddModal.jsx";
import CardFormModal from "./CardFormModal.jsx";
import SettingsModal from "./SettingsModal.jsx";
import HelpModal from "./HelpModal.jsx";
import CategoriesModal from "./CategoriesModal.jsx";
import RecurringRemindersModal from "./RecurringRemindersModal.jsx";

export default function MainApp({ user }) {
  const [tab, setTab] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [monthPlans, setMonthPlans] = useState({});
  const [fixedPlan, setFixedPlan] = useState(emptyPlan());
  const [showAdd, setShowAdd] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [showCardForm, setShowCardForm] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMonth, setViewMonth] = useState(monthKey(new Date()));
  const [errorBanner, setErrorBanner] = useState(null);
  const [userCats, setUserCats] = useState(() => loadUserCats(user.id));
  const [showCatsModal, setShowCatsModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [currency, setCurrency] = useState(() => loadUserCurrency(user.id));
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [recurringReminders, setRecurringReminders] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);

  const updateCurrency = useCallback((sym) => {
    setCurrency(sym);
    saveUserCurrency(user.id, sym);
  }, [user.id]);

  const allExpCats = userCats.expense;
  const allIncCats = userCats.income;

  const addCat = useCallback((type, cat) => {
    setUserCats((prev) => {
      const next = { ...prev, [type]: [...prev[type], cat] };
      saveUserCats(user.id, next);
      return next;
    });
  }, [user.id]);

  const editCat = useCallback((type, id, updates) => {
    setUserCats((prev) => {
      const next = { ...prev, [type]: prev[type].map((c) => c.id === id ? { ...c, ...updates } : c) };
      saveUserCats(user.id, next);
      return next;
    });
  }, [user.id]);

  const deleteCat = useCallback((type, id) => {
    setUserCats((prev) => {
      const next = { ...prev, [type]: prev[type].filter((c) => c.id !== id) };
      saveUserCats(user.id, next);
      return next;
    });
  }, [user.id]);

  useEffect(() => { window.scrollTo(0, 0); }, [tab]);

  useEffect(() => {
    (async () => {
      try {
        const [txRows, cardRows, budgetRows, planRows, reminderRows] = await Promise.all([
          fetchTransactions(user.id),
          fetchCards(user.id),
          fetchBudgets(user.id),
          fetchInstallmentPlans(user.id),
          fetchRecurringReminders(user.id),
        ]);

        setTransactions(txRows.map((r) => ({
          id: r.id, type: r.type, amount: +r.amount, category: r.category,
          cardId: r.card_id, note: r.note || "", date: r.date,
          installmentId: r.installment_id || null,
        })));

        setCards(cardRows.map((r) => ({
          id: r.id, name: r.name, limit: +r.credit_limit,
          openingBalance: +r.opening_balance, colors: r.colors,
        })));

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

        setInstallmentPlans(planRows.map((r) => ({
          id: r.id, cardId: r.card_id, label: r.label,
          totalAmount: +r.total_amount, monthlyAmount: +r.monthly_amount,
          totalMonths: +r.total_months, startMonth: r.start_month,
          category: r.category, active: r.active,
        })));

        setRecurringReminders(reminderRows.map((r) => ({
          id: r.id, label: r.label,
          amount: r.amount != null ? +r.amount : null,
          dayOfMonth: +r.day_of_month, category: r.category || null,
          active: r.active,
        })));
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
    setTransactions((p) => [{ ...tx, id }, ...p]);
    try {
      await insertTransaction(dbRow);
    } catch (e) {
      setTransactions((p) => p.filter((t) => t.id !== id));
      showError("Couldn't save transaction. Try again.");
    }
  }, [user.id]);

  const deleteTx = useCallback((id) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    // Flush any previous pending delete immediately
    setPendingDelete((prev) => {
      if (prev) {
        clearTimeout(prev.timer);
        deleteTransaction(prev.tx.id).catch(() => {});
      }
      return null;
    });
    setTransactions((p) => p.filter((t) => t.id !== id));
    const timer = setTimeout(async () => {
      setPendingDelete(null);
      try { await deleteTransaction(id); }
      catch { showError("Couldn't delete transaction."); }
    }, 5000);
    setPendingDelete({ tx, timer });
  }, [transactions]);

  const undoDelete = useCallback(() => {
    setPendingDelete((prev) => {
      if (!prev) return null;
      clearTimeout(prev.timer);
      setTransactions((p) => [prev.tx, ...p]);
      return null;
    });
  }, []);

  const editTx = useCallback(async (id, updates) => {
    const prev = transactions;
    setTransactions((p) => p.map((t) => t.id === id ? { ...t, ...updates } : t));
    try {
      await updateTransaction(id, {
        type: updates.type, amount: updates.amount,
        category: updates.category || null, card_id: updates.cardId || null,
        note: updates.note || "", date: updates.date,
      });
    } catch (e) {
      setTransactions(prev);
      showError("Couldn't update transaction.");
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

  const saveInstallmentPlan = useCallback(async (planData) => {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newPlan = {
      id: planId, cardId: planData.cardId, label: planData.label,
      totalAmount: planData.monthlyAmount * planData.totalMonths,
      monthlyAmount: planData.monthlyAmount, totalMonths: planData.totalMonths,
      startMonth: planData.startMonth, category: planData.category, active: true,
    };
    const txs = [];
    for (let i = 0; i < planData.totalMonths; i++) {
      const [y, m] = planData.startMonth.split("-").map(Number);
      const d = new Date(y, m - 1 + i, 1);
      const txDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      txs.push({
        id: `ptx_${planId}_${i}`,
        type: "card-purchase", amount: planData.monthlyAmount,
        category: planData.category, cardId: planData.cardId,
        note: planData.label, date: txDate, installmentId: planId,
      });
    }
    setInstallmentPlans((prev) => [...prev, newPlan]);
    setTransactions((prev) => [...txs, ...prev]);
    try {
      await insertInstallmentPlan({
        id: planId, user_id: user.id, card_id: planData.cardId,
        label: planData.label, total_amount: newPlan.totalAmount,
        monthly_amount: planData.monthlyAmount, total_months: planData.totalMonths,
        start_month: planData.startMonth, category: planData.category,
      });
      await Promise.all(txs.map((t) => insertTransaction({
        id: t.id, user_id: user.id, type: t.type, amount: t.amount,
        category: t.category, card_id: t.cardId, note: t.note,
        date: t.date, installment_id: planId,
      })));
    } catch (e) {
      setInstallmentPlans((prev) => prev.filter((p) => p.id !== planId));
      setTransactions((prev) => prev.filter((t) => t.installmentId !== planId));
      showError("Couldn't save installment plan. Try again.");
    }
  }, [user.id]);

  const cancelInstallmentPlan = useCallback(async (planId) => {
    const now = new Date();
    const currentMk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const futureTxIds = transactions
      .filter((t) => t.installmentId === planId && monthKey(t.date) > currentMk)
      .map((t) => t.id);
    setTransactions((prev) => prev.filter((t) => !futureTxIds.includes(t.id)));
    setInstallmentPlans((prev) => prev.map((p) => p.id === planId ? { ...p, active: false } : p));
    try {
      await Promise.all(futureTxIds.map((id) => deleteTransaction(id)));
      await updateInstallmentPlan(planId, { active: false });
    } catch (e) {
      showError("Couldn't cancel plan.");
    }
  }, [transactions]);

  const saveRecurringReminder = useCallback(async (reminder) => {
    if (reminder.id) {
      const prev = recurringReminders;
      setRecurringReminders((p) => p.map((r) => r.id === reminder.id ? reminder : r));
      try {
        await updateRecurringReminder(reminder.id, {
          label: reminder.label, amount: reminder.amount,
          day_of_month: reminder.dayOfMonth, category: reminder.category, active: reminder.active,
        });
      } catch (e) {
        setRecurringReminders(prev);
        showError("Couldn't update reminder.");
      }
    } else {
      const id = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newR = { ...reminder, id, active: true };
      setRecurringReminders((p) => [...p, newR]);
      try {
        await insertRecurringReminder({
          id, user_id: user.id, label: reminder.label,
          amount: reminder.amount, day_of_month: reminder.dayOfMonth,
          category: reminder.category, active: true,
        });
      } catch (e) {
        setRecurringReminders((p) => p.filter((r) => r.id !== id));
        showError("Couldn't save reminder.");
      }
    }
  }, [recurringReminders, user.id]);

  const removeRecurringReminder = useCallback(async (id) => {
    const prev = recurringReminders;
    setRecurringReminders((p) => p.filter((r) => r.id !== id));
    try {
      await deleteRecurringReminder(id);
    } catch (e) {
      setRecurringReminders(prev);
      showError("Couldn't delete reminder.");
    }
  }, [recurringReminders]);

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
    <CurrencyCtx.Provider value={currency}>
      <div className="app">
        <div className="app-glow" />

        <PWABanners />

        {errorBanner && (
          <div className="error-banner">{errorBanner}</div>
        )}

        <main className="content">
          {tab === "home" && (
            <HomeView
              stats={monthStats}
              viewMonth={viewMonth} setViewMonth={setViewMonth}
              transactions={monthStats.list} onDelete={deleteTx} onEdit={setEditingTx}
              cards={cardsWithBalance}
              allExpCats={allExpCats} allIncCats={allIncCats}
              installmentPlans={installmentPlans}
            />
          )}
          {tab === "dashboard" && (
            <DashView
              transactions={transactions}
              getEffectivePlan={getEffectivePlan}
              cards={cardsWithBalance}
              viewMonth={viewMonth} setViewMonth={setViewMonth}
              user={user}
              onOpenSettings={() => setShowSettings(true)}
              allExpCats={allExpCats} allIncCats={allIncCats}
              onModalChange={setChildModalOpen}
              installmentPlans={installmentPlans}
              recurringReminders={recurringReminders}
              allTransactions={transactions}
            />
          )}
          {tab === "cards" && (
            <CardsView
              cards={cardsWithBalance} transactions={transactions}
              onEdit={(c) => setShowCardForm(c)}
              onNew={() => setShowCardForm("new")}
              onDelete={removeCard}
              onDeleteTx={deleteTx}
              onEditTx={setEditingTx}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              installmentPlans={installmentPlans}
              onCancelPlan={cancelInstallmentPlan}
            />
          )}
          {tab === "budget" && (
            <BudgetView
              monthPlans={monthPlans} setMonthPlan={setMonthPlan}
              viewMonth={viewMonth} setViewMonth={setViewMonth}
              stats={monthStats}
              fixedPlan={fixedPlan} setFixedPlan={saveFixedPlan}
              allExpCats={allExpCats} allIncCats={allIncCats}
            />
          )}
        </main>

        {!showAdd && !editingTx && !showCardForm && !showSettings && !showHelp && !showCatsModal && !showReminders && !childModalOpen && (
          <nav className="nav">
            <NavBtn icon={BarChart3} label="Insights" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
            <NavBtn icon={Wallet} label="Ledger" active={tab === "home"} onClick={() => setTab("home")} />
            <button className="nav-add" onClick={() => setShowAdd(true)} aria-label="New entry">
              <Plus size={22} strokeWidth={2.5} />
              <span>New</span>
            </button>
            <NavBtn icon={CreditCard} label="Cards" active={tab === "cards"} onClick={() => setTab("cards")} />
            <NavBtn icon={Target} label="Budget" active={tab === "budget"} onClick={() => setTab("budget")} />
          </nav>
        )}

        {pendingDelete && (
          <div className="undo-snackbar">
            <span>Transaction deleted</span>
            <button className="undo-btn" onClick={undoDelete}>Undo</button>
          </div>
        )}

        {showAdd && (
          <AddModal
            cards={cardsWithBalance} onClose={() => setShowAdd(false)}
            onSave={(tx) => { addTx(tx); setShowAdd(false); }}
            onSaveInstallment={(plan) => { saveInstallmentPlan(plan); setShowAdd(false); }}
            allExpCats={allExpCats} allIncCats={allIncCats}
            onAddCat={addCat}
            userId={user.id}
            installmentPlans={installmentPlans}
          />
        )}

        {editingTx && (
          <AddModal
            editing={editingTx}
            cards={cardsWithBalance} onClose={() => setEditingTx(null)}
            onSave={(tx) => { editTx(editingTx.id, tx); setEditingTx(null); }}
            allExpCats={allExpCats} allIncCats={allIncCats}
            onAddCat={addCat}
            userId={user.id}
            installmentPlans={installmentPlans}
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
          <SettingsModal user={user} onClose={() => setShowSettings(false)}
            onOpenCategories={() => { setShowSettings(false); setShowCatsModal(true); }}
            onOpenHelp={() => { setShowSettings(false); setShowHelp(true); }}
            onOpenReminders={() => { setShowSettings(false); setShowReminders(true); }}
            currency={currency} onChangeCurrency={updateCurrency}
          />
        )}

        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}

        {showReminders && (
          <RecurringRemindersModal
            reminders={recurringReminders}
            onClose={() => setShowReminders(false)}
            onSave={saveRecurringReminder}
            onDelete={removeRecurringReminder}
            allExpCats={allExpCats}
          />
        )}

        {showCatsModal && (
          <CategoriesModal
            userCats={userCats}
            onClose={() => setShowCatsModal(false)}
            onAdd={addCat}
            onEdit={editCat}
            onDelete={deleteCat}
          />
        )}
      </div>
    </CurrencyCtx.Provider>
  );
}
