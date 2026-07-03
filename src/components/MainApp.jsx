import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  BarChart3,
  Wallet,
  CreditCard,
  Target,
  Bell,
  ChevronLeft,
  ChevronRight,
  LineChart,
  User,
} from "lucide-react";
import { CurrencyCtx } from "../context.js";
import {
  getCat,
  isSpendableExpense,
  getProtectedCategory,
} from "../constants/categories.js";
import {
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
  fetchCards,
  upsertCard,
  deleteCard,
  fetchBudgets,
  upsertBudget,
  fetchInstallmentPlans,
  insertInstallmentPlan,
  updateInstallmentPlan,
  fetchRecurringReminders,
  insertRecurringReminder,
  updateRecurringReminder,
  deleteRecurringReminder,
  fetchInvestments,
  insertInvestment,
  updateInvestment,
  deleteInvestment,
  fetchInvestmentValuations,
  insertInvestmentValuation,
  updateInvestmentValuation,
  deleteInvestmentValuation,
  deleteInvestmentValuationsFor,
} from "../lib/supabase.js";
import {
  loadUserCats,
  saveUserCats,
  loadUserCurrency,
  saveUserCurrency,
  loadCompletedNotifs,
  saveCompletedNotifs,
} from "../utils/storage.js";
import { monthKey, monthLabel, shiftMonth, emptyPlan } from "../utils/format.js";
import NavBtn from "./NavBtn.jsx";
import PWABanners from "./PWABanners.jsx";
import DashView from "./DashView.jsx";
import HomeView from "./HomeView.jsx";
import CardsView from "./CardsView.jsx";
import BudgetView from "./BudgetView.jsx";
import InvestmentsView from "./InvestmentsView.jsx";
import UserView from "./UserView.jsx";
import NavDrawer from "./NavDrawer.jsx";
import NotificationsPanel from "./NotificationsPanel.jsx";
import AddModal from "./AddModal.jsx";
import CardFormModal from "./CardFormModal.jsx";
import InvestmentFormModal from "./InvestmentFormModal.jsx";
import InvestmentValueModal from "./InvestmentValueModal.jsx";
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
  // Mobile/tablet-only: a full-height slide-in drawer (Budget + Investments)
  // opened from the hamburger control in each page's header; desktop keeps
  // its own unchanged sidebar with both as standalone links.
  const [showDrawer, setShowDrawer] = useState(false);
  const [userCats, setUserCats] = useState(() =>
    loadUserCats(user.id, user.created_at),
  );
  const [showCatsModal, setShowCatsModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [currency, setCurrency] = useState(() => loadUserCurrency(user.id));
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [recurringReminders, setRecurringReminders] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [investments, setInvestments] = useState([]);
  const [investmentValuations, setInvestmentValuations] = useState([]);
  const [showInvestmentForm, setShowInvestmentForm] = useState(null);
  const [recordingValueFor, setRecordingValueFor] = useState(null);
  const [editingValuation, setEditingValuation] = useState(null);

  const updateCurrency = useCallback(
    (sym) => {
      setCurrency(sym);
      saveUserCurrency(user.id, sym);
    },
    [user.id],
  );

  const allExpCats = userCats.expense;
  const allIncCats = userCats.income;

  const addCat = useCallback(
    (type, cat) => {
      setUserCats((prev) => {
        const next = { ...prev, [type]: [...prev[type], cat] };
        saveUserCats(user.id, next);
        return next;
      });
    },
    [user.id],
  );

  const editCat = useCallback(
    (type, id, updates) => {
      let safeUpdates = updates;
      const protectedCat = getProtectedCategory(type, id);
      if (
        protectedCat &&
        updates.label &&
        !protectedCat.labelOptions.includes(updates.label)
      ) {
        const { label: _droppedLabel, ...rest } = updates;
        safeUpdates = rest;
      }
      setUserCats((prev) => {
        const next = {
          ...prev,
          [type]: prev[type].map((c) =>
            c.id === id ? { ...c, ...safeUpdates } : c,
          ),
        };
        saveUserCats(user.id, next);
        return next;
      });
    },
    [user.id],
  );

  const deleteCat = useCallback(
    (type, id) => {
      if (getProtectedCategory(type, id)) return;
      setUserCats((prev) => {
        const next = { ...prev, [type]: prev[type].filter((c) => c.id !== id) };
        saveUserCats(user.id, next);
        return next;
      });
    },
    [user.id],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  useEffect(() => {
    (async () => {
      try {
        const [
          txRows,
          cardRows,
          budgetRows,
          planRows,
          reminderRows,
          investmentRows,
          valuationRows,
        ] = await Promise.all([
          fetchTransactions(user.id),
          fetchCards(user.id),
          fetchBudgets(user.id),
          fetchInstallmentPlans(user.id),
          fetchRecurringReminders(user.id),
          fetchInvestments(user.id),
          fetchInvestmentValuations(user.id),
        ]);

        setTransactions(
          txRows.map((r) => ({
            id: r.id,
            type: r.type,
            amount: +r.amount,
            category: r.category,
            cardId: r.card_id,
            note: r.note || "",
            date: r.date,
            installmentId: r.installment_id || null,
          })),
        );

        setCards(
          cardRows.map((r) => ({
            id: r.id,
            name: r.name,
            limit: +r.credit_limit,
            openingBalance: +r.opening_balance,
            colors: r.colors,
          })),
        );

        const plans = {};
        let fixed = emptyPlan();
        budgetRows.forEach((r) => {
          const plan = {
            income: {
              total: +r.income_total,
              categories: r.income_categories || {},
            },
            expense: {
              total: +r.expense_total,
              categories: r.expense_categories || {},
            },
          };
          if (r.month_key === "fixed") fixed = plan;
          else plans[r.month_key] = plan;
        });
        setMonthPlans(plans);
        setFixedPlan(fixed);

        setInstallmentPlans(
          planRows.map((r) => ({
            id: r.id,
            cardId: r.card_id,
            label: r.label,
            totalAmount: +r.total_amount,
            monthlyAmount: +r.monthly_amount,
            totalMonths: +r.total_months,
            startMonth: r.start_month,
            category: r.category,
            active: r.active,
          })),
        );

        setRecurringReminders(
          reminderRows.map((r) => ({
            id: r.id,
            label: r.label,
            amount: r.amount != null ? +r.amount : null,
            dayOfMonth: +r.day_of_month,
            category: r.category || null,
            active: r.active,
          })),
        );

        setInvestments(
          investmentRows.map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type || "",
            initialAmount: +r.initial_amount,
            currentValue: +r.current_value,
            startDate: r.start_date,
            notes: r.notes || "",
            interestRate: r.interest_rate != null ? +r.interest_rate : null,
            payoutFrequency: r.payout_frequency || null,
            tenureMonths: r.tenure_months != null ? +r.tenure_months : null,
          })),
        );

        setInvestmentValuations(
          valuationRows.map((r) => ({
            id: r.id,
            investmentId: r.investment_id,
            value: +r.value,
            recordedDate: r.recorded_date,
          })),
        );
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

  const addTx = useCallback(
    async (tx) => {
      const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const dbRow = {
        id,
        user_id: user.id,
        type: tx.type,
        amount: tx.amount,
        category: tx.category || null,
        card_id: tx.cardId || null,
        note: tx.note || "",
        date: tx.date,
      };
      setTransactions((p) => [{ ...tx, id }, ...p]);
      try {
        await insertTransaction(dbRow);
      } catch (e) {
        setTransactions((p) => p.filter((t) => t.id !== id));
        showError("Couldn't save transaction. Try again.");
      }
    },
    [user.id],
  );

  const deleteTx = useCallback(
    (id) => {
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
        try {
          await deleteTransaction(id);
        } catch {
          showError("Couldn't delete transaction.");
        }
      }, 5000);
      setPendingDelete({ tx, timer });
    },
    [transactions],
  );

  const undoDelete = useCallback(() => {
    setPendingDelete((prev) => {
      if (!prev) return null;
      clearTimeout(prev.timer);
      setTransactions((p) => [prev.tx, ...p]);
      return null;
    });
  }, []);

  const editTx = useCallback(
    async (id, updates) => {
      const prev = transactions;
      setTransactions((p) =>
        p.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );
      try {
        await updateTransaction(id, {
          type: updates.type,
          amount: updates.amount,
          category: updates.category || null,
          card_id: updates.cardId || null,
          note: updates.note || "",
          date: updates.date,
        });
      } catch (e) {
        setTransactions(prev);
        showError("Couldn't update transaction.");
      }
    },
    [transactions],
  );

  const saveCard = useCallback(
    async (card) => {
      const id = card.id || `card_${Date.now()}`;
      const dbRow = {
        id,
        user_id: user.id,
        name: card.name,
        credit_limit: +card.limit || 0,
        opening_balance: +card.openingBalance || 0,
        colors: card.colors,
      };
      try {
        await upsertCard(dbRow);
        setCards((prev) => {
          const exists = prev.find((c) => c.id === id);
          const next = {
            id,
            name: card.name,
            limit: +card.limit,
            openingBalance: +card.openingBalance || 0,
            colors: card.colors,
          };
          return exists
            ? prev.map((c) => (c.id === id ? next : c))
            : [...prev, next];
        });
      } catch (e) {
        showError("Couldn't save card.");
      }
    },
    [user.id],
  );

  const removeCard = useCallback(
    async (id) => {
      const prev = cards;
      setCards((p) => p.filter((c) => c.id !== id));
      try {
        await deleteCard(id);
      } catch (e) {
        setCards(prev);
        showError("Couldn't delete card.");
      }
    },
    [cards],
  );

  const saveInvestment = useCallback(
    async (investment) => {
      const id = investment.id || `inv_${Date.now()}`;
      const isNew = !investment.id;
      const dbRow = {
        id,
        user_id: user.id,
        name: investment.name,
        type: investment.type || "",
        initial_amount: investment.initialAmount,
        current_value: isNew ? investment.initialAmount : investment.currentValue,
        start_date: investment.startDate,
        notes: investment.notes || "",
        interest_rate: investment.interestRate,
        payout_frequency: investment.payoutFrequency,
        tenure_months: investment.tenureMonths,
      };
      try {
        if (isNew) await insertInvestment(dbRow);
        else await updateInvestment(id, dbRow);

        setInvestments((prev) => {
          const next = {
            id,
            name: investment.name,
            type: investment.type || "",
            initialAmount: +investment.initialAmount,
            currentValue: isNew ? +investment.initialAmount : +investment.currentValue,
            startDate: investment.startDate,
            notes: investment.notes || "",
            interestRate: investment.interestRate,
            payoutFrequency: investment.payoutFrequency,
            tenureMonths: investment.tenureMonths,
          };
          const exists = prev.find((i) => i.id === id);
          return exists
            ? prev.map((i) => (i.id === id ? next : i))
            : [...prev, next];
        });

        // Auto-create the starting valuation snapshot so the value-over-time
        // chart always has a clean first point.
        if (isNew) {
          const valuationId = `val_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const valuationRow = {
            id: valuationId,
            user_id: user.id,
            investment_id: id,
            value: investment.initialAmount,
            recorded_date: investment.startDate,
          };
          await insertInvestmentValuation(valuationRow);
          setInvestmentValuations((prev) => [
            ...prev,
            {
              id: valuationId,
              investmentId: id,
              value: +investment.initialAmount,
              recordedDate: investment.startDate,
            },
          ]);
        }
      } catch (e) {
        showError("Couldn't save investment.");
      }
    },
    [user.id],
  );

  const removeInvestment = useCallback(
    async (id) => {
      const prevInvestments = investments;
      const prevValuations = investmentValuations;
      setInvestments((p) => p.filter((i) => i.id !== id));
      setInvestmentValuations((p) => p.filter((v) => v.investmentId !== id));
      try {
        await Promise.all([
          deleteInvestment(id),
          deleteInvestmentValuationsFor(id),
        ]);
      } catch (e) {
        setInvestments(prevInvestments);
        setInvestmentValuations(prevValuations);
        showError("Couldn't delete investment.");
      }
    },
    [investments, investmentValuations],
  );

  // Single source of truth for what an investment's current_value should be:
  // the value of whichever remaining valuation has the latest recorded date.
  // Used after every add/edit/delete of a valuation so current_value never
  // drifts out of sync with the actual history.
  const latestValuationValue = (valuationsForInvestment) => {
    if (!valuationsForInvestment.length) return null;
    return valuationsForInvestment.reduce((latest, v) =>
      v.recordedDate >= latest.recordedDate ? v : latest,
    ).value;
  };

  const recordInvestmentValue = useCallback(
    async (investmentId, value, date, note) => {
      const valuationId = `val_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const prevInvestments = investments;
      const prevValuations = investmentValuations;

      const nextForInvestment = [
        ...investmentValuations.filter((v) => v.investmentId === investmentId),
        { id: valuationId, investmentId, value: +value, recordedDate: date },
      ];
      const newCurrentValue = latestValuationValue(nextForInvestment);

      setInvestmentValuations((p) => [
        ...p,
        { id: valuationId, investmentId, value: +value, recordedDate: date },
      ]);
      setInvestments((p) =>
        p.map((i) =>
          i.id === investmentId ? { ...i, currentValue: newCurrentValue } : i,
        ),
      );

      try {
        await insertInvestmentValuation({
          id: valuationId,
          user_id: user.id,
          investment_id: investmentId,
          value,
          recorded_date: date,
        });
        await updateInvestment(investmentId, { current_value: newCurrentValue });
      } catch (e) {
        setInvestments(prevInvestments);
        setInvestmentValuations(prevValuations);
        showError("Couldn't record value. Try again.");
      }
    },
    [investments, investmentValuations, user.id],
  );

  const updateInvestmentValueEntry = useCallback(
    async (investmentId, valuationId, value, date, note) => {
      const prevInvestments = investments;
      const prevValuations = investmentValuations;

      const nextForInvestment = investmentValuations
        .filter((v) => v.investmentId === investmentId)
        .map((v) =>
          v.id === valuationId
            ? { ...v, value: +value, recordedDate: date }
            : v,
        );
      const newCurrentValue = latestValuationValue(nextForInvestment);

      setInvestmentValuations((p) =>
        p.map((v) =>
          v.id === valuationId
            ? { ...v, value: +value, recordedDate: date }
            : v,
        ),
      );
      setInvestments((p) =>
        p.map((i) =>
          i.id === investmentId ? { ...i, currentValue: newCurrentValue } : i,
        ),
      );

      try {
        await updateInvestmentValuation(valuationId, {
          value,
          recorded_date: date,
        });
        await updateInvestment(investmentId, { current_value: newCurrentValue });
      } catch (e) {
        setInvestments(prevInvestments);
        setInvestmentValuations(prevValuations);
        showError("Couldn't update value. Try again.");
      }
    },
    [investments, investmentValuations],
  );

  const deleteInvestmentValueEntry = useCallback(
    async (investmentId, valuationId) => {
      const existingForInvestment = investmentValuations.filter(
        (v) => v.investmentId === investmentId,
      );
      if (existingForInvestment.length <= 1) {
        showError("Can't delete the only value on record — add a newer one first.");
        return;
      }

      const prevInvestments = investments;
      const prevValuations = investmentValuations;

      const nextForInvestment = existingForInvestment.filter(
        (v) => v.id !== valuationId,
      );
      const newCurrentValue = latestValuationValue(nextForInvestment);

      setInvestmentValuations((p) => p.filter((v) => v.id !== valuationId));
      setInvestments((p) =>
        p.map((i) =>
          i.id === investmentId ? { ...i, currentValue: newCurrentValue } : i,
        ),
      );

      try {
        await deleteInvestmentValuation(valuationId);
        await updateInvestment(investmentId, { current_value: newCurrentValue });
      } catch (e) {
        setInvestments(prevInvestments);
        setInvestmentValuations(prevValuations);
        showError("Couldn't delete value. Try again.");
      }
    },
    [investments, investmentValuations],
  );

  const setMonthPlan = useCallback(
    async (month, plan) => {
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
    },
    [user.id],
  );

  const saveFixedPlan = useCallback(
    async (plan) => {
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
    },
    [user.id],
  );

  const saveInstallmentPlan = useCallback(
    async (planData) => {
      const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newPlan = {
        id: planId,
        cardId: planData.cardId,
        label: planData.label,
        totalAmount: planData.monthlyAmount * planData.totalMonths,
        monthlyAmount: planData.monthlyAmount,
        totalMonths: planData.totalMonths,
        startMonth: planData.startMonth,
        category: planData.category,
        active: true,
      };
      const txs = [];
      for (let i = 0; i < planData.totalMonths; i++) {
        const [y, m] = planData.startMonth.split("-").map(Number);
        const d = new Date(y, m - 1 + i, 1);
        const txDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        txs.push({
          id: `ptx_${planId}_${i}`,
          type: "card-purchase",
          amount: planData.monthlyAmount,
          category: planData.category,
          cardId: planData.cardId,
          note: planData.label,
          date: txDate,
          installmentId: planId,
        });
      }
      setInstallmentPlans((prev) => [...prev, newPlan]);
      setTransactions((prev) => [...txs, ...prev]);

      const rollbackLocal = () => {
        setInstallmentPlans((prev) => prev.filter((p) => p.id !== planId));
        setTransactions((prev) =>
          prev.filter((t) => t.installmentId !== planId),
        );
      };

      try {
        await insertInstallmentPlan({
          id: planId,
          user_id: user.id,
          card_id: planData.cardId,
          label: planData.label,
          total_amount: newPlan.totalAmount,
          monthly_amount: planData.monthlyAmount,
          total_months: planData.totalMonths,
          start_month: planData.startMonth,
          category: planData.category,
        });
      } catch (e) {
        rollbackLocal();
        showError("Couldn't save installment plan. Try again.");
        return;
      }

      // Use allSettled (not all) so a partial failure tells us exactly which
      // transaction rows actually made it to the DB — otherwise a failure
      // partway through would roll back local state while leaving the
      // already-inserted rows (and the plan itself) orphaned server-side,
      // only to silently reappear on the next reload.
      const results = await Promise.allSettled(
        txs.map((t) =>
          insertTransaction({
            id: t.id,
            user_id: user.id,
            type: t.type,
            amount: t.amount,
            category: t.category,
            card_id: t.cardId,
            note: t.note,
            date: t.date,
            installment_id: planId,
          }),
        ),
      );

      if (results.some((r) => r.status === "rejected")) {
        rollbackLocal();
        const succeededIds = txs
          .filter((_, i) => results[i].status === "fulfilled")
          .map((t) => t.id);
        await Promise.allSettled(
          succeededIds.map((id) => deleteTransaction(id)),
        );
        // Plans are never hard-deleted elsewhere in the app (see
        // cancelInstallmentPlan) — mark inactive as best-effort cleanup.
        await updateInstallmentPlan(planId, { active: false }).catch(
          () => {},
        );
        showError("Couldn't save installment plan. Try again.");
      }
    },
    [user.id],
  );

  const cancelInstallmentPlan = useCallback(
    async (planId) => {
      const now = new Date();
      const currentMk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const removedTxs = transactions.filter(
        (t) => t.installmentId === planId && monthKey(t.date) > currentMk,
      );
      const futureTxIds = removedTxs.map((t) => t.id);
      const prevPlans = installmentPlans;
      setTransactions((prev) =>
        prev.filter((t) => !futureTxIds.includes(t.id)),
      );
      setInstallmentPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, active: false } : p)),
      );
      try {
        await Promise.all(futureTxIds.map((id) => deleteTransaction(id)));
        await updateInstallmentPlan(planId, { active: false });
      } catch (e) {
        setTransactions((prev) => [...removedTxs, ...prev]);
        setInstallmentPlans(prevPlans);
        showError("Couldn't cancel plan. Try again.");
      }
    },
    [transactions, installmentPlans],
  );

  const saveRecurringReminder = useCallback(
    async (reminder) => {
      if (reminder.id) {
        const prev = recurringReminders;
        setRecurringReminders((p) =>
          p.map((r) => (r.id === reminder.id ? reminder : r)),
        );
        try {
          await updateRecurringReminder(reminder.id, {
            label: reminder.label,
            amount: reminder.amount,
            day_of_month: reminder.dayOfMonth,
            category: reminder.category,
            active: reminder.active,
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
            id,
            user_id: user.id,
            label: reminder.label,
            amount: reminder.amount,
            day_of_month: reminder.dayOfMonth,
            category: reminder.category,
            active: true,
          });
        } catch (e) {
          setRecurringReminders((p) => p.filter((r) => r.id !== id));
          showError("Couldn't save reminder.");
        }
      }
    },
    [recurringReminders, user.id],
  );

  const removeRecurringReminder = useCallback(
    async (id) => {
      const prev = recurringReminders;
      setRecurringReminders((p) => p.filter((r) => r.id !== id));
      try {
        await deleteRecurringReminder(id);
      } catch (e) {
        setRecurringReminders(prev);
        showError("Couldn't delete reminder.");
      }
    },
    [recurringReminders],
  );

  const cardsWithBalance = useMemo(() => {
    return cards.map((card) => {
      let balance = card.openingBalance || 0;
      transactions.forEach((t) => {
        if (t.cardId !== card.id) return;
        if (t.type === "card-purchase" || t.type === "card-interest")
          balance += +t.amount;
        else if (t.type === "card-payment") balance -= +t.amount;
      });
      return { ...card, currentBalance: balance };
    });
  }, [cards, transactions]);

  // Notifications live here (not in DashView) so the bell in the shared
  // desktop topbar can open the same panel from any tab. Not memoized with
  // an empty dep array on purpose — must reflect "now" on every render, or
  // a long-lived PWA session that crosses a month boundary would keep
  // evaluating due dates against a stale month.
  const currentMk = monthKey(new Date());

  // Notifications are computed live, not stored rows, so "Completed" just
  // dismisses a specific occurrence for the current month — keyed by month
  // so it reappears next month if the underlying plan/reminder is still
  // active, matching how recurring reminders already auto-dismiss.
  const [completedNotifIds, setCompletedNotifIds] = useState(() =>
    loadCompletedNotifs(user.id, currentMk),
  );
  useEffect(() => {
    setCompletedNotifIds(loadCompletedNotifs(user.id, currentMk));
  }, [user.id, currentMk]);

  const markNotifCompleted = useCallback(
    (id) => {
      setCompletedNotifIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        saveCompletedNotifs(user.id, currentMk, next);
        return next;
      });
    },
    [user.id, currentMk],
  );

  const installmentNotifs = useMemo(() => {
    return (installmentPlans || []).filter((plan) => {
      if (!plan.active) return false;
      if (completedNotifIds.includes(`inst:${plan.id}`)) return false;
      const [sy, sm] = plan.startMonth.split("-").map(Number);
      const d = new Date(sy, sm - 1 + plan.totalMonths - 1, 1);
      const endMk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return currentMk >= plan.startMonth && currentMk <= endMk;
    });
  }, [installmentPlans, currentMk, completedNotifIds]);

  const recurringNotifs = useMemo(() => {
    const currentMonthTxs = transactions.filter(
      (t) => monthKey(t.date) === currentMk,
    );
    return (recurringReminders || []).filter((reminder) => {
      if (!reminder.active) return false;
      if (completedNotifIds.includes(`rec:${reminder.id}`)) return false;
      if (!reminder.category) return true;
      const dismissed = currentMonthTxs.some((t) => {
        const catId =
          t.type === "income"
            ? getCat(t.category, "income", allExpCats, allIncCats).id
            : getCat(t.category, "expense", allExpCats, allIncCats).id;
        return catId === reminder.category;
      });
      return !dismissed;
    });
  }, [
    recurringReminders,
    transactions,
    currentMk,
    allExpCats,
    allIncCats,
    completedNotifIds,
  ]);

  const notifCount = installmentNotifs.length + recurringNotifs.length;

  const getEffectivePlan = useCallback(
    (mKey) => {
      const specific = monthPlans[mKey];
      const hasSpecific =
        specific &&
        (specific.income?.total > 0 ||
          Object.keys(specific.income?.categories || {}).length ||
          specific.expense?.total > 0 ||
          Object.keys(specific.expense?.categories || {}).length);
      if (hasSpecific) return { ...specific, source: "custom" };

      const hasFixed =
        fixedPlan.income?.total > 0 ||
        Object.keys(fixedPlan.income?.categories || {}).length ||
        fixedPlan.expense?.total > 0 ||
        Object.keys(fixedPlan.expense?.categories || {}).length;
      if (hasFixed) return { ...fixedPlan, source: "fixed" };

      return null;
    },
    [monthPlans, fixedPlan],
  );

  const monthStats = useMemo(() => {
    const inMonth = transactions.filter((t) => monthKey(t.date) === viewMonth);
    const income = inMonth
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + +t.amount, 0);
    const expenses = inMonth
      .filter((t) => isSpendableExpense(t, allExpCats, allIncCats))
      .reduce((s, t) => s + +t.amount, 0);
    const byExpCat = {};
    const byIncCat = {};
    inMonth.forEach((t) => {
      if (t.type === "income")
        byIncCat[t.category] = (byIncCat[t.category] || 0) + +t.amount;
      else if (isSpendableExpense(t, allExpCats, allIncCats)) {
        byExpCat[t.category] = (byExpCat[t.category] || 0) + +t.amount;
      }
    });
    return {
      income,
      expenses,
      net: income - expenses,
      byExpCat,
      byIncCat,
      list: inMonth,
    };
  }, [transactions, viewMonth, allExpCats, allIncCats]);

  if (!loaded) {
    return (
      <div className="app">
        <div className="app-glow" />
        <main className="content">
          <div className="view view-dashboard">
            <div className="dash-topbar">
              <div className="skel skel-pill" style={{ width: 110, height: 34 }} />
            </div>
            <div className="hero">
              <div className="skel skel-text" style={{ width: 90, height: 12 }} />
              <div
                className="skel skel-text"
                style={{ width: 160, height: 30, marginTop: 8 }}
              />
              <div
                className="skel skel-text"
                style={{ width: 110, height: 10, marginTop: 16 }}
              />
              <div
                className="skel skel-text"
                style={{ width: 220, height: 48, marginTop: 10 }}
              />
            </div>
            <div className="dash-sections">
              <div className="inout inout-section">
                <div className="skel skel-card" style={{ height: 60, flex: 1 }} />
                <div className="skel skel-card" style={{ height: 60, flex: 1 }} />
              </div>
              <div className="skel skel-card" style={{ height: 48 }} />
              <div className="skel skel-card" style={{ height: 220 }} />
              <div className="skel skel-card" style={{ height: 160 }} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const navVisible =
    !showAdd &&
    !editingTx &&
    !showCardForm &&
    !showSettings &&
    !showHelp &&
    !showCatsModal &&
    !showReminders &&
    !showNotifs &&
    !showInvestmentForm &&
    !recordingValueFor &&
    !editingValuation &&
    !showDrawer &&
    !childModalOpen;

  const [mLbl, yLbl] = monthLabel(viewMonth).split(" ");
  const userInitial = (user.email || "?")[0].toUpperCase();

  return (
    <CurrencyCtx.Provider value={currency}>
      <div className="app">
        <div className="app-glow" />

        <PWABanners />

        {errorBanner && <div className="error-banner">{errorBanner}</div>}

        {/* Desktop/laptop only (see app.css) — month selector, notifications,
            and account, shared across all four tabs and pinned while the
            tab content scrolls underneath. Deliberately excludes the
            Insights "Customize sections" control, which stays specific to
            the Dashboard tab. */}
        <div className="app-topbar">
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
          <button
            className="bell-btn"
            onClick={() => setShowNotifs(true)}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
          </button>
          <button
            className="avatar-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Account"
          >
            {userInitial}
          </button>
        </div>

        <main className="content">
          {tab === "home" && (
            <HomeView
              stats={monthStats}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              transactions={monthStats.list}
              onDelete={deleteTx}
              onEdit={setEditingTx}
              cards={cardsWithBalance}
              allExpCats={allExpCats}
              allIncCats={allIncCats}
              installmentPlans={installmentPlans}
              onOpenMenu={() => setShowDrawer(true)}
              onOpenNotifications={() => setShowNotifs(true)}
              notifCount={notifCount}
            />
          )}
          {tab === "dashboard" && (
            <DashView
              transactions={transactions}
              getEffectivePlan={getEffectivePlan}
              cards={cardsWithBalance}
              investments={investments}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              user={user}
              onOpenMenu={() => setShowDrawer(true)}
              allExpCats={allExpCats}
              allIncCats={allIncCats}
              onModalChange={setChildModalOpen}
              notifCount={notifCount}
              onOpenNotifications={() => setShowNotifs(true)}
            />
          )}
          {tab === "cards" && (
            <CardsView
              cards={cardsWithBalance}
              transactions={transactions}
              onEdit={(c) => setShowCardForm(c)}
              onNew={() => setShowCardForm("new")}
              onDelete={removeCard}
              onDeleteTx={deleteTx}
              onEditTx={setEditingTx}
              installmentPlans={installmentPlans}
              onCancelPlan={cancelInstallmentPlan}
              allExpCats={allExpCats}
              allIncCats={allIncCats}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              onOpenMenu={() => setShowDrawer(true)}
              onOpenNotifications={() => setShowNotifs(true)}
              notifCount={notifCount}
            />
          )}
          {tab === "investments" && (
            <InvestmentsView
              investments={investments}
              valuations={investmentValuations}
              onNew={() => setShowInvestmentForm("new")}
              onEdit={(inv) => setShowInvestmentForm(inv)}
              onDelete={removeInvestment}
              onRecordValue={(inv) => setRecordingValueFor(inv)}
              onEditValue={(inv, valuation) =>
                setEditingValuation({ investment: inv, valuation })
              }
              onDeleteValue={(inv, valuation) =>
                deleteInvestmentValueEntry(inv.id, valuation.id)
              }
              onOpenMenu={() => setShowDrawer(true)}
              onOpenNotifications={() => setShowNotifs(true)}
              notifCount={notifCount}
            />
          )}
          {tab === "budget" && (
            <BudgetView
              monthPlans={monthPlans}
              setMonthPlan={setMonthPlan}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              stats={monthStats}
              fixedPlan={fixedPlan}
              setFixedPlan={saveFixedPlan}
              allExpCats={allExpCats}
              allIncCats={allIncCats}
              onOpenMenu={() => setShowDrawer(true)}
              onOpenNotifications={() => setShowNotifs(true)}
              notifCount={notifCount}
            />
          )}
          {tab === "user" && (
            <UserView
              user={user}
              currency={currency}
              onChangeCurrency={updateCurrency}
              onOpenMenu={() => setShowDrawer(true)}
              onOpenNotifications={() => setShowNotifs(true)}
              notifCount={notifCount}
              onOpenCategories={() => setShowCatsModal(true)}
              onOpenHelp={() => setShowHelp(true)}
              onOpenReminders={() => setShowReminders(true)}
            />
          )}
        </main>

        {navVisible && (
          <nav className="nav">
            <div className="nav-group">
              <NavBtn
                icon={BarChart3}
                label="Insights"
                active={tab === "dashboard"}
                onClick={() => setTab("dashboard")}
              />
              <NavBtn
                icon={Wallet}
                label="Ledger"
                active={tab === "home"}
                onClick={() => setTab("home")}
              />
            </div>
            <button
              className="nav-add"
              onClick={() => setShowAdd(true)}
              aria-label="New entry"
            >
              <Plus size={22} strokeWidth={2.5} />
              <span>New</span>
            </button>
            <div className="nav-group">
              <NavBtn
                icon={CreditCard}
                label="Cards"
                active={tab === "cards"}
                onClick={() => setTab("cards")}
              />
              <NavBtn
                icon={User}
                label="Profile"
                active={tab === "user"}
                onClick={() => setTab("user")}
              />
            </div>
          </nav>
        )}

        {/* Desktop-only sidebar rail (≥1024px) — same tab state/handlers as
            the bottom nav above, shown/hidden via CSS media query so mobile
            and tablet are unaffected. */}
        {navVisible && (
          <nav className="nav-rail">
            <button
              className="rail-add"
              onClick={() => setShowAdd(true)}
              aria-label="New entry"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>New</span>
            </button>
            <div className="rail-links">
              <NavBtn
                icon={BarChart3}
                label="Insights"
                active={tab === "dashboard"}
                onClick={() => setTab("dashboard")}
              />
              <NavBtn
                icon={Wallet}
                label="Ledger"
                active={tab === "home"}
                onClick={() => setTab("home")}
              />
              <NavBtn
                icon={CreditCard}
                label="Cards"
                active={tab === "cards"}
                onClick={() => setTab("cards")}
              />
              <NavBtn
                icon={LineChart}
                label="Investments"
                active={tab === "investments"}
                onClick={() => setTab("investments")}
              />
              <NavBtn
                icon={Target}
                label="Budget"
                active={tab === "budget"}
                onClick={() => setTab("budget")}
              />
            </div>
          </nav>
        )}

        {pendingDelete && (
          <div className="undo-snackbar">
            <span>Transaction deleted</span>
            <button className="undo-btn" onClick={undoDelete}>
              Undo
            </button>
          </div>
        )}

        {showAdd && (
          <AddModal
            cards={cardsWithBalance}
            onClose={() => setShowAdd(false)}
            onSave={(tx) => {
              addTx(tx);
              setShowAdd(false);
            }}
            onSaveInstallment={(plan) => {
              saveInstallmentPlan(plan);
              setShowAdd(false);
            }}
            allExpCats={allExpCats}
            allIncCats={allIncCats}
            onAddCat={addCat}
            userId={user.id}
            installmentPlans={installmentPlans}
          />
        )}

        {editingTx && (
          <AddModal
            editing={editingTx}
            cards={cardsWithBalance}
            onClose={() => setEditingTx(null)}
            onSave={(tx) => {
              editTx(editingTx.id, tx);
              setEditingTx(null);
            }}
            allExpCats={allExpCats}
            allIncCats={allIncCats}
            onAddCat={addCat}
            userId={user.id}
            installmentPlans={installmentPlans}
          />
        )}

        {showCardForm && (
          <CardFormModal
            card={showCardForm === "new" ? null : showCardForm}
            onClose={() => setShowCardForm(null)}
            onSave={(c) => {
              saveCard(c);
              setShowCardForm(null);
            }}
          />
        )}

        {showInvestmentForm && (
          <InvestmentFormModal
            investment={
              showInvestmentForm === "new" ? null : showInvestmentForm
            }
            onClose={() => setShowInvestmentForm(null)}
            onSave={(inv) => {
              saveInvestment(inv);
              setShowInvestmentForm(null);
            }}
          />
        )}

        {recordingValueFor && (
          <InvestmentValueModal
            investment={recordingValueFor}
            onClose={() => setRecordingValueFor(null)}
            onSave={(value, date, note) => {
              recordInvestmentValue(recordingValueFor.id, value, date, note);
              setRecordingValueFor(null);
            }}
          />
        )}

        {editingValuation && (
          <InvestmentValueModal
            investment={editingValuation.investment}
            valuation={editingValuation.valuation}
            onClose={() => setEditingValuation(null)}
            onSave={(value, date, note) => {
              updateInvestmentValueEntry(
                editingValuation.investment.id,
                editingValuation.valuation.id,
                value,
                date,
                note,
              );
              setEditingValuation(null);
            }}
          />
        )}

        {showSettings && (
          <SettingsModal
            user={user}
            onClose={() => setShowSettings(false)}
            onOpenCategories={() => {
              setShowSettings(false);
              setShowCatsModal(true);
            }}
            onOpenHelp={() => {
              setShowSettings(false);
              setShowHelp(true);
            }}
            onOpenReminders={() => {
              setShowSettings(false);
              setShowReminders(true);
            }}
            currency={currency}
            onChangeCurrency={updateCurrency}
          />
        )}

        {showDrawer && (
          <NavDrawer
            onClose={() => setShowDrawer(false)}
            onNavigate={(destination) => {
              setTab(destination);
              setShowDrawer(false);
            }}
          />
        )}

        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

        {showNotifs && (
          <NotificationsPanel
            installmentNotifs={installmentNotifs}
            recurringNotifs={recurringNotifs}
            cards={cardsWithBalance}
            currentMk={currentMk}
            onClose={() => setShowNotifs(false)}
            onCompleteInstallment={(planId) =>
              markNotifCompleted(`inst:${planId}`)
            }
            onCompleteRecurring={(reminderId) =>
              markNotifCompleted(`rec:${reminderId}`)
            }
          />
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
