import { latestValuationValue } from '../utils/investmentValues.js';
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Calculator,
  Building2,
  User,
} from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { usePWA } from "../hooks/usePWA.js";
import {
  getCat,
  INCOME_CATEGORIES,
  isSpendableExpense,
  getProtectedCategory,
  getDefaultUserCats,
  normalizeUserCats,
} from "../constants/categories.js";
import {
  commitFinanceChanges,
  fetchMoneyWorkspace,
  commitMoneyChanges,
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
  fetchRecurringReminders,
  insertRecurringReminder,
  updateRecurringReminder,
  deleteRecurringReminder,
  fetchInvestments,
  fetchInvestmentValuations,
  fetchUserSettings,
  upsertUserSettings,
} from "../lib/supabase.js";
import { buildPaymentNotifications } from "../utils/paymentNotifications.js";
import { loadCompletedNotifs, saveCompletedNotifs } from "../utils/storage.js";
import { monthKey, monthLabel, shiftMonth, emptyPlan } from "../utils/format.js";
import NavBtn from "./NavBtn.jsx";
import PWABanners from "./PWABanners.jsx";
import DashView from "./DashView.jsx";
import HomeView from "./HomeView.jsx";
import CardsView from "./CardsView.jsx";
import BudgetView from "./BudgetView.jsx";
import InvestmentsView from "./InvestmentsView.jsx";
import LoanCalculatorView from "./LoanCalculatorView.jsx";
import BankDetailsView from "./BankDetailsView.jsx";
import UserView from "./UserView.jsx";
import NavDrawer from "./NavDrawer.jsx";
import NotificationsPanel from "./NotificationsPanel.jsx";
import AddModal from "./AddModal.jsx";
import NewEntryChooser from "./NewEntryChooser.jsx";
import CardFormModal from "./CardFormModal.jsx";
import InvestmentFormModal from "./InvestmentFormModal.jsx";
import InvestmentValueModal from "./InvestmentValueModal.jsx";
import SettingsModal from "./SettingsModal.jsx";
import HelpModal from "./HelpModal.jsx";
import CategoriesModal from "./CategoriesModal.jsx";
import RecurringRemindersModal from "./RecurringRemindersModal.jsx";
import InstallmentPlanFormModal from "./InstallmentPlanFormModal.jsx";

import MoneyForm from "./MoneyForm.jsx";
import MoneyLentView from "./MoneyLentView.jsx";
import { bindLoanBorrower, saveBorrowerProfile, mergeBorrowerProfiles } from "../utils/borrowers.js";
import { moneyTransactions, loanSummary, todayLocal, validateMoneyRecords, validateSavingsChange } from "../utils/money.js";

const VALID_TABS = ["money-lent","dashboard", "home", "cards", "investments", "budget", "user", "loan-calculator", "bank-details"];
const LAST_TAB_KEY = "quick_refresh_last_tab";

import {validDate} from "../utils/dateInput.js";
import {elapsedInstallments, validInstallmentMonths, installmentMetadataTargets, installmentStart, installmentDate, revisedInstallments} from "../utils/installments.js";

export default function MainApp({ user }) {
  // Quick Refresh (installed-PWA header button) does a real page reload —
  // sessionStorage is what lets the app land back on the same tab instead
  // of resetting to Insights, since navigation is in-memory state, not a
  // URL route.
  const [tab, setTab] = useState(() => {
    const saved = sessionStorage.getItem(LAST_TAB_KEY);
    return VALID_TABS.includes(saved) ? saved : "dashboard";
  });
  const moneyRevision = useRef(null);
  const moneyWriteLock = useRef(false);
  const [moneyRecords,setMoneyRecords]=useState([]);
  const [moneyEnabled,setMoneyEnabled]=useState(false);
  const [moneyForm,setMoneyForm]=useState(null);
  const [pendingDelete,setPendingDelete]=useState(null);
  const deleteTimer=useRef(null);
  useEffect(()=>()=>clearTimeout(deleteTimer.current),[]);
  const [loadFailed,setLoadFailed]=useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mustReload, setMustReload] = useState(false);
  const commitBatch = useCallback(async (changes) => {
    try {
      if(moneyRevision.current !== null) {
        moneyRevision.current=await commitMoneyChanges(changes,moneyRevision.current);
        return;
      }
      return await commitFinanceChanges(changes);
    }
    catch (error) { setMustReload(true); throw error; }
  }, []);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [monthPlans, setMonthPlans] = useState({});
  const [fixedPlan, setFixedPlan] = useState(emptyPlan());
  const [showAdd, setShowAdd] = useState(false);
  const [entryTask,setEntryTask]=useState(null);
  const [entryGroup,setEntryGroup]=useState(null);
  const [entryContext,setEntryContext]=useState({});
  useEffect(()=>{if(!showAdd) {setEntryTask(null);setEntryGroup(null);setEntryContext({});}},[showAdd]);
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
  // Categories/currency/insights-layout/custom-charts are database-only —
  // the user_settings table is the single source of truth, never
  // localStorage. These initial values are pure in-memory placeholders for
  // the brief window before the fetch effect below resolves; the `!loaded`
  // gate further down means the user never actually sees them — they're
  // replaced by the real fetched values before the app renders anything.
  const [userCats, setUserCats] = useState(() =>
    getDefaultUserCats(user.created_at),
  );
  const [showCatsModal, setShowCatsModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [currency, setCurrency] = useState("Rs.");
  // Lifted up from DashView (which used to load/save these itself) so the
  // settings-fetch effect below can update them regardless of whether
  // Insights happens to be the mounted tab — DashView unmounts/remounts on
  // every tab switch, so state living only there would go stale the moment
  // the fetch resolves after the user has navigated away.
  const [insightsLayout, setInsightsLayout] = useState(null);
  const [customCharts, setCustomCharts] = useState([]);
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [recurringReminders, setRecurringReminders] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [investments, setInvestments] = useState([]);
  const [investmentValuations, setInvestmentValuations] = useState([]);
  const [showInvestmentForm, setShowInvestmentForm] = useState(null);
  const [recordingValueFor, setRecordingValueFor] = useState(null);
  const [editingValuation, setEditingValuation] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const { isStandalone, updateApp } = usePWA();

  const handleQuickRefresh = useCallback(() => {
    sessionStorage.setItem(LAST_TAB_KEY, tab);
    void updateApp();
  }, [tab, updateApp]);

  // Categories/currency/insights-layout/custom-charts are database-only —
  // every change here is optimistic (updates local state immediately for a
  // snappy UI) but rolls back and surfaces an error if the write to
  // user_settings fails, exactly like addTx/saveCard/etc. below. There is no
  // local fallback to quietly keep working from anymore, so a failed save
  // has to be visible rather than silently swallowed.
  const updateCurrency = useCallback(
    async (sym) => {
      const prev = currency;
      setCurrency(sym);
      try {
        await upsertUserSettings(user.id, { currency: sym });
      } catch (e) {
        setCurrency(prev);
        showError("Couldn't save currency. Try again.");
      }
    },
    [user.id, currency],
  );

  const updateInsightsLayout = useCallback(
    async (next) => {
      const prev = insightsLayout;
      setInsightsLayout(next);
      try {
        await upsertUserSettings(user.id, { insights_layout: next });
      } catch (e) {
        setInsightsLayout(prev);
        showError("Couldn't save your dashboard layout. Try again.");
      }
    },
    [user.id, insightsLayout],
  );

  const updateCustomCharts = useCallback(
    async (next) => {
      const prev = customCharts;
      setCustomCharts(next);
      try {
        await upsertUserSettings(user.id, { custom_charts: next });
      } catch (e) {
        setCustomCharts(prev);
        showError("Couldn't save your chart. Try again.");
      }
    },
    [user.id, customCharts],
  );

  const allExpCats = userCats.expense;
  const allIncCats = useMemo(()=>userCats.income.some(c=>c.id==="loan-interest") ? userCats.income : [...userCats.income,INCOME_CATEGORIES.find(c=>c.id==="loan-interest")],[userCats.income]);

  const addCat = useCallback(
    async (type, cat) => {
      const prevCats = userCats;
      const nextCats = { ...prevCats, [type]: [...prevCats[type], cat] };
      setUserCats(nextCats);
      try {
        await upsertUserSettings(user.id, { categories: nextCats });
      } catch (e) {
        setUserCats(prevCats);
        showError("Couldn't save category. Try again.");
      }
    },
    [user.id, userCats],
  );

  const editCat = useCallback(
    async (type, id, updates) => {
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
      const prevCats = userCats;
      const nextCats = { ...prevCats, [type]: prevCats[type].map(c => c.id === id ? { ...c, ...safeUpdates } : c) };
      setUserCats(nextCats);
      try {
        await upsertUserSettings(user.id, { categories: nextCats });
      } catch (e) {
        setUserCats(prevCats);
        showError("Couldn't save category. Try again.");
      }
    },
    [user.id, userCats],
  );

  const deleteCat = useCallback(
    async (type, id) => {
      if (getProtectedCategory(type, id)) return;
      const prevCats = userCats;
      const nextCats = { ...prevCats, [type]: prevCats[type].filter(c => c.id !== id) };
      setUserCats(nextCats);
      try {
        await upsertUserSettings(user.id, { categories: nextCats });
      } catch (e) {
        setUserCats(prevCats);
        showError("Couldn't delete category. Try again.");
      }
    },
    [user.id, userCats],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  useEffect(() => {
    (async () => {
      try {
        let workspace=null;
        try { workspace=await fetchMoneyWorkspace(); } catch(error) {
          if(!["PGRST202","42883"].includes(error.code)) throw error;
        }
        if(workspace) {setMoneyRecords(workspace.records);moneyRevision.current=workspace.revision;setMoneyEnabled(true);}
        const [
          txRows,
          cardRows,
          budgetRows,
          planRows,
          reminderRows,
          investmentRows,
          valuationRows,
          settingsRow,
        ] = await Promise.all([
          workspace ? Promise.resolve(workspace.transactions) : fetchTransactions(user.id),
          workspace ? Promise.resolve(workspace.cards) : fetchCards(user.id),
          fetchBudgets(user.id),
          fetchInstallmentPlans(user.id),
          fetchRecurringReminders(user.id),
          fetchInvestments(user.id),
          fetchInvestmentValuations(user.id),
          fetchUserSettings(user.id),
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
            account:r.account || "cash",
          })),
        );

        setCards(
          cardRows.map((r) => ({
            id: r.id,
            name: r.name,
            limit: +r.credit_limit,
            openingBalance: +r.opening_balance,
            paymentDueDate:r.payment_due_date||"",
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
            ...installmentStart(r.start_month),
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
            createdAt: r.created_at || "",
            note: r.note || "",
          })),
        );

        // user_settings is the only source for categories/currency/insights
        // layout/custom charts — no localStorage fallback. A brand-new
        // account (settingsRow is null) just gets pure in-memory defaults;
        // nothing is written until the user actually changes something, so
        // two never-customized devices can't disagree (getDefaultUserCats is
        // a deterministic function of created_at, not device state).
        setUserCats(
          settingsRow?.categories
            ? normalizeUserCats(settingsRow.categories).cats
            : getDefaultUserCats(user.created_at),
        );
        setCurrency(settingsRow?.currency || "Rs.");
        setInsightsLayout(settingsRow?.insights_layout ?? null);
        setCustomCharts(settingsRow?.custom_charts ?? []);
      } catch (e) {
        console.error(e);
        setLoadFailed(true);
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

  const projectedMoney = useMemo(()=>moneyTransactions(moneyRecords),[moneyRecords]);
  const allTransactions = useMemo(()=>[...transactions,...projectedMoney].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)),[transactions,projectedMoney]);
  const openMoneyForm=(kind,loanId=null,borrowerId=null)=>{
    const group=['repayment','withdrawal'].includes(kind)?'income':'expense';
    setEntryGroup(group);setEntryTask(kind);setEntryContext({loanId,borrowerId});setShowAdd(true);
  };
  const chooseEntryGroup=group=>{setEntryGroup(group);setEntryTask(group==='income'?'income':'expense');setEntryContext({});};
  const chooseEntryTask=task=>{setEntryTask(task);setEntryContext({});};
  const editEntry=(tx)=>{
    if(tx.moneyRecordId) {const record=moneyRecords.find(r=>r.id===tx.moneyRecordId);if(record) setMoneyForm({kind:record.kind,editing:record});}
    else setEditingTx(tx);
  };
  const writeTracked = async (changes) => {
    if(moneyWriteLock.current) throw new Error('A save is already in progress. Please wait.');
    moneyWriteLock.current=true;
    try {await commitBatch(changes);} finally {moneyWriteLock.current=false;}
  };
  const newBorrowerId=()=>`borrower_${crypto.randomUUID()}`;
  const persistMoneySet=async(next)=>{
    validateMoneyRecords(next,transactions,cards,moneyRecords);
    const old=new Map(moneyRecords.map(record=>[record.id,record]));
    const changes=next.filter(record=>JSON.stringify(old.get(record.id))!==JSON.stringify(record)).map(record=>({table:'money_records',op:old.has(record.id)?'update':'insert',id:record.id,data:{data:record}}));
    if(changes.length) await writeTracked(changes);
    setMoneyRecords(next);
  };
  const saveMoneyRecord=async(draft)=>{
    const id=draft.id||`money_${crypto.randomUUID()}`;
    let next=moneyRecords;
    let identity={};
    if(draft.kind==='loan') {
      const bound=bindLoanBorrower(next,draft,newBorrowerId);
      next=bound.records;identity={borrower:bound.borrower,borrowerId:bound.borrowerId};
    }
    const record={...moneyRecords.find(r=>r.id===id),id,kind:draft.kind,date:draft.date,note:(draft.note||'').trim(),
      ...(draft.kind==='loan'?{...identity,amount:draft.amount,account:draft.account,cardId:draft.account==='card'?draft.cardId:null,rate:draft.rate,ratePeriod:draft.ratePeriod,interestBasis:draft.interestBasis,arrangement:draft.arrangement,installmentMonths:draft.installmentMonths,dueDate:draft.dueDate}:
      draft.kind==='repayment'?{loanId:draft.loanId,principal:draft.principal,interest:draft.interest,account:draft.account}:
      {from:draft.from,to:draft.to,amount:draft.amount})};
    next=next.some(r=>r.id===id)?next.map(r=>r.id===id?record:r):[...next,record];
    await persistMoneySet(next);setMoneyForm(null);setShowAdd(false);
  };
  const saveBorrower=async(draft)=>{
    const result=saveBorrowerProfile(moneyRecords,draft,newBorrowerId);
    await persistMoneySet(result.records);return result.profile.id;
  };
  const mergeBorrowers=async(source,target)=>{
    const result=mergeBorrowerProfiles(moneyRecords,source,target,newBorrowerId);
    await persistMoneySet(result.records);return result.targetId;
  };
  const setLoanArchived=async(loan,archived)=>{
    const summary=loanSummary(loan,moneyRecords);
    if(archived&&(summary.outstanding>0||summary.interestDue>0)&&!window.confirm('Archive this inactive loan? Any unpaid principal and interest will still count as money owed to you.')) return;
    await persistMoneySet(moneyRecords.map(record=>record.id===loan.id?{...record,archived,archivedAt:archived?todayLocal():null}:record));
  };
  const deleteMoneyRecord=async(record)=>{
    try {
      const next=moneyRecords.filter(r=>r.id!==record.id);
      validateMoneyRecords(next,transactions,cards,moneyRecords);
      if(!window.confirm(`Delete this ${record.kind}? Its balance effects will be reversed.`)) return;
      await writeTracked([{table:'money_records',op:'delete',id:record.id}]);setMoneyRecords(next);
    } catch(error) {showError(error.message);}
  };
  const transactionRow=tx=>({type:tx.type,amount:tx.amount,category:tx.category||null,card_id:tx.cardId||null,note:tx.note||'',date:tx.date,...(moneyEnabled?{account:tx.account||'cash'}:{})});
  const addTx = async(tx)=>{
    const id=`tx_${crypto.randomUUID()}`;
    validateSavingsChange(allTransactions,[...allTransactions,{...tx,id}]);
    if(moneyEnabled) await writeTracked([{table:'transactions',op:'insert',id,data:transactionRow(tx)}]);
    else await insertTransaction({id,user_id:user.id,...transactionRow(tx)});
    setTransactions(p=>[{...tx,id},...p]);
  };
  const editTx = async(id,updates)=>{
    const next=transactions.map(t=>t.id===id?{...t,...updates}:t);
    validateSavingsChange(allTransactions,[...next,...projectedMoney]);
    if(moneyEnabled) await writeTracked([{table:'transactions',op:'update',id,data:transactionRow(updates)}]);
    else await updateTransaction(id,transactionRow(updates));
    setTransactions(next);
  };
  const finalizeDelete=async(tx)=>{
    try {
      if(moneyEnabled) await writeTracked([{table:'transactions',op:'delete',id:tx.id}]);
      else await deleteTransaction(tx.id);
    } catch(error) {
      setTransactions(rows=>rows.some(t=>t.id===tx.id)?rows:[tx,...rows]);
      showError(error.message||'Could not delete transaction.');
      throw error;
    }
  };
  const undoDelete=()=>{
    clearTimeout(deleteTimer.current);
    if(pendingDelete) setTransactions(rows=>[pendingDelete.tx,...rows]);
    setPendingDelete(null);
  };
  const deleteTx = async(id)=>{
    const virtual=allTransactions.find(t=>t.id===id&&t.moneyRecordId);
    if(virtual) return deleteMoneyRecord(moneyRecords.find(r=>r.id===virtual.moneyRecordId));
    try {
      const next=transactions.filter(t=>t.id!==id);
      validateSavingsChange(allTransactions,[...next,...projectedMoney]);
      if(pendingDelete) {clearTimeout(deleteTimer.current);setPendingDelete(null);await finalizeDelete(pendingDelete.tx);}
      const tx=transactions.find(t=>t.id===id);if(!tx) return;
      setTransactions(next);setPendingDelete({tx});
      deleteTimer.current=setTimeout(()=>{setPendingDelete(null);void finalizeDelete(tx).catch(()=>{});},5000);
    } catch(error) {showError(error.message||'Could not delete transaction.');}
  };

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
        ...(moneyEnabled ? {payment_due_date:card.paymentDueDate || null} : {}),
      };
      try {
        if(moneyEnabled) {const {id: _id,user_id: _user,...data}=dbRow;await commitBatch([{table:"cards",op:cards.some(c=>c.id===id)?"update":"insert",id,data}]);}
        else await upsertCard(dbRow);
        setCards((prev) => {
          const exists = prev.find((c) => c.id === id);
          const next = {
            id,
            name: card.name,
            limit: +card.limit,
            openingBalance: +card.openingBalance || 0,
            colors: card.colors,
            paymentDueDate:card.paymentDueDate||"",
          };
          return exists
            ? prev.map((c) => (c.id === id ? next : c))
            : [...prev, next];
        });
      } catch (e) {
        showError("Couldn't save card.");
        throw new Error("Couldn't save card.");
      }
    },
    [user.id, moneyEnabled, cards, commitBatch],
  );

  const removeCard = useCallback(
    async (id) => {
      if(moneyRecords.some(r=>r.kind==="loan"&&r.account==="card"&&r.cardId===id)) {showError("This card funds a recorded loan. Keep it to preserve the debt history.");return;}
      const prev = cards;
      setCards((p) => p.filter((c) => c.id !== id));
      try {
        if(moneyEnabled) await commitBatch([{table:"cards",op:"delete",id}]);
        else await deleteCard(id);
      } catch (e) {
        setCards(prev);
        showError("Couldn't delete card.");
      }
    },
    [cards, moneyRecords, moneyEnabled, commitBatch],
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
      const valuationId = isNew ? crypto.randomUUID() : null;
      const valuationRow = isNew ? { id: valuationId, user_id: user.id, investment_id: id,
        value: investment.initialAmount, recorded_date: investment.startDate } : null;
      try {
        const { id: _id, user_id: _userId, ...updates } = dbRow;
        await commitBatch(isNew ? [
          { table: 'investments', op: 'insert', id, data: dbRow },
          { table: 'investment_valuations', op: 'insert', id: valuationId, data: valuationRow },
        ] : [{ table: 'investments', op: 'update', id, data: updates }]);

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
          setInvestmentValuations((prev) => [
            ...prev,
            {
              id: valuationId,
              investmentId: id,
              value: +investment.initialAmount,
              recordedDate: investment.startDate,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (e) {
        showError("Couldn't save investment.");
        throw new Error("Couldn't save investment.");
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
        await commitBatch([
          ...investmentValuations.filter((v) => v.investmentId === id).map((v) => ({ table: 'investment_valuations', op: 'delete', id: v.id })),
          { table: 'investments', op: 'delete', id },
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


  const recordInvestmentValue = useCallback(
    async (investmentId, value, date, note) => {
      const valuationId = `val_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const prevInvestments = investments;
      const prevValuations = investmentValuations;

      const nextForInvestment = [
        ...investmentValuations.filter((v) => v.investmentId === investmentId),
        { id: valuationId, investmentId, value: +value, recordedDate: date, createdAt: new Date().toISOString(), note: note || "" },
      ];
      const newCurrentValue = latestValuationValue(nextForInvestment);

      setInvestmentValuations((p) => [
        ...p,
        { id: valuationId, investmentId, value: +value, recordedDate: date, createdAt: new Date().toISOString(), note: note || "" },
      ]);
      setInvestments((p) =>
        p.map((i) =>
          i.id === investmentId ? { ...i, currentValue: newCurrentValue } : i,
        ),
      );

      try {
        await commitBatch([
          { table: 'investment_valuations', op: 'insert', id: valuationId, data: {
            id: valuationId, user_id: user.id, investment_id: investmentId, value, recorded_date: date, note: note || '' } },
          { table: 'investments', op: 'update', id: investmentId, data: { current_value: newCurrentValue } },
        ]);
      } catch (e) {
        setInvestments(prevInvestments);
        setInvestmentValuations(prevValuations);
        showError("Couldn't record value. Try again.");
        throw new Error("Couldn't record value. Try again.");
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
            ? { ...v, value: +value, recordedDate: date, note: note || "" }
            : v,
        );
      const newCurrentValue = latestValuationValue(nextForInvestment);

      setInvestmentValuations((p) =>
        p.map((v) =>
          v.id === valuationId
            ? { ...v, value: +value, recordedDate: date, note: note || "" }
            : v,
        ),
      );
      setInvestments((p) =>
        p.map((i) =>
          i.id === investmentId ? { ...i, currentValue: newCurrentValue } : i,
        ),
      );

      try {
        await commitBatch([
          { table: 'investment_valuations', op: 'update', id: valuationId, data: { value, recorded_date: date, note: note || '' } },
          { table: 'investments', op: 'update', id: investmentId, data: { current_value: newCurrentValue } },
        ]);
      } catch (e) {
        setInvestments(prevInvestments);
        setInvestmentValuations(prevValuations);
        showError("Couldn't update value. Try again.");
        throw new Error("Couldn't update value. Try again.");
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
        await commitBatch([
          { table: 'investment_valuations', op: 'delete', id: valuationId },
          { table: 'investments', op: 'update', id: investmentId, data: { current_value: newCurrentValue } },
        ]);
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
      try {
        await upsertBudget({
          user_id: user.id,
          month_key: month,
          income_total: plan.income?.total || 0,
          income_categories: plan.income?.categories || {},
          expense_total: plan.expense?.total || 0,
          expense_categories: plan.expense?.categories || {},
        });
        setMonthPlans((p) => ({ ...p, [month]: plan }));
        return true;
      } catch (e) {
        showError("Couldn't save budget.");
        return false;
      }
    },
    [user.id],
  );

  const saveFixedPlan = useCallback(
    async (plan) => {
      try {
        await upsertBudget({
          user_id: user.id,
          month_key: "fixed",
          income_total: plan.income?.total || 0,
          income_categories: plan.income?.categories || {},
          expense_total: plan.expense?.total || 0,
          expense_categories: plan.expense?.categories || {},
        });
        setFixedPlan(plan);
        return true;
      } catch (e) {
        showError("Couldn't save fixed plan.");
        return false;
      }
    },
    [user.id],
  );

  const saveInstallmentPlan = useCallback(
    async (planData) => {
      if (!validInstallmentMonths(+planData.totalMonths) || !validDate(planData.startDate) || !Number.isFinite(+planData.monthlyAmount) || +planData.monthlyAmount <= 0) {
        showError("Enter a valid installment amount and a period from 2 to 120 months.");
        return;
      }
      const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newPlan = {
        id: planId,
        cardId: planData.cardId,
        label: planData.label,
        totalAmount: planData.monthlyAmount * planData.totalMonths,
        monthlyAmount: planData.monthlyAmount,
        totalMonths: planData.totalMonths,
        startMonth: planData.startDate.slice(0, 7),
        startDate: planData.startDate,
        category: planData.category,
        active: true,
      };
      const txs = [];
      for (let i = 0; i < planData.totalMonths; i++) {
        const txDate = installmentDate(newPlan, i);
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
        await commitBatch([
          { table: 'installment_plans', op: 'insert', id: planId, data: {
            id: planId, user_id: user.id, card_id: planData.cardId, label: planData.label,
            total_amount: newPlan.totalAmount, monthly_amount: planData.monthlyAmount,
            total_months: planData.totalMonths, start_month: planData.startDate, category: planData.category,
          } },
          ...txs.map((t) => ({ table: 'transactions', op: 'insert', id: t.id, data: {
            id: t.id, user_id: user.id, type: t.type, amount: t.amount, category: t.category,
            card_id: t.cardId, note: t.note, date: t.date, installment_id: planId,
          } })),
        ]);
      } catch {
        rollbackLocal();
        showError("Couldn't confirm the installment save. Refresh your records.");
        throw new Error("Couldn't confirm the installment save. Refresh your records.");
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
        await commitBatch([
          ...futureTxIds.map((id) => ({ table: 'transactions', op: 'delete', id })),
          { table: 'installment_plans', op: 'update', id: planId, data: { active: false } },
        ]);
      } catch (e) {
        setTransactions((prev) => [...removedTxs, ...prev]);
        setInstallmentPlans(prevPlans);
        showError("Couldn't cancel plan. Try again.");
      }
    },
    [transactions, installmentPlans],
  );

  // Edits an existing plan's label/amount/duration/category/card. Months
  // already billed (this month included) are financial history and stay
  // untouched — matching cancelInstallmentPlan's "past installments are
  // kept" rule — except for label/category, which are purely descriptive
  // and get applied retroactively so Activity/reports never show a plan's
  // old name or category for its already-billed months. Amount/card/
  // duration changes only reshape the not-yet-billed future transactions.
  const updateInstallmentPlanDetails = useCallback(
    async (planId, updates) => {
      const plan = installmentPlans.find((p) => p.id === planId);
      if (!plan) return;

      const currentMk = monthKey(new Date());
      const paid = elapsedInstallments(plan, currentMk);
      if (!validInstallmentMonths(+updates.totalMonths, paid, plan.totalMonths) || !Number.isFinite(+updates.monthlyAmount) || +updates.monthlyAmount <= 0) {
        showError("Enter a valid installment amount and duration.");
        return;
      }
      const newTotalMonths = +updates.totalMonths;

      const scheduleChanged =
        +updates.monthlyAmount !== plan.monthlyAmount ||
        updates.cardId !== plan.cardId ||
        newTotalMonths !== plan.totalMonths;
      const metaChanged =
        updates.category !== plan.category || updates.label !== plan.label;

      const prevTransactions = transactions;
      const prevPlans = installmentPlans;

      const planTxs = transactions.filter((t) => t.installmentId === planId);
      const oldFutureTxs = planTxs.filter((t) => monthKey(t.date) > currentMk);

      const revised = revisedInstallments(plan, updates, transactions, currentMk);
      const newFutureTxs = scheduleChanged ? revised.future : [];

      const updatedPlan = {
        ...plan,
        label: updates.label,
        category: updates.category,
        monthlyAmount: +updates.monthlyAmount,
        totalMonths: newTotalMonths,
        totalAmount: scheduleChanged ? revised.total : (planTxs.length ? planTxs.reduce((sum, row) => sum + Number(row.amount), 0) : plan.totalAmount),
        cardId: updates.cardId,
      };

      setInstallmentPlans((prev) =>
        prev.map((p) => (p.id === planId ? updatedPlan : p)),
      );
      setTransactions((prev) => {
        const base = scheduleChanged
          ? prev.filter(
              (t) => t.installmentId !== planId || monthKey(t.date) <= currentMk,
            )
          : prev;
        return [
          ...base.map((t) =>
            t.installmentId === planId && metaChanged
              ? { ...t, category: updates.category, note: updates.label }
              : t,
          ),
          ...newFutureTxs,
        ];
      });

      try {
        const changes = [{ table: 'installment_plans', op: 'update', id: planId, data: {
          label: updatedPlan.label, category: updatedPlan.category, monthly_amount: updatedPlan.monthlyAmount,
          total_months: updatedPlan.totalMonths, total_amount: updatedPlan.totalAmount, card_id: updatedPlan.cardId,
        } }];
        if (metaChanged) changes.push(...installmentMetadataTargets(planTxs, currentMk, scheduleChanged).map((t) => ({
          table: 'transactions', op: 'update', id: t.id, data: { category: updates.category, note: updates.label },
        })));
        if (scheduleChanged) changes.push(
          ...oldFutureTxs.map((t) => ({ table: 'transactions', op: 'delete', id: t.id })),
          ...newFutureTxs.map((t) => ({ table: 'transactions', op: 'insert', id: t.id, data: {
            id: t.id, user_id: user.id, type: t.type, amount: t.amount, category: t.category,
            card_id: t.cardId, note: t.note, date: t.date, installment_id: planId,
          } })),
        );
        await commitBatch(changes);
      } catch (e) {
        setTransactions(prevTransactions);
        setInstallmentPlans(prevPlans);
        showError("Couldn't update installment plan. Try again.");
        throw new Error("Couldn't update installment plan. Try again.");
      }
    },
    [transactions, installmentPlans, user.id],
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

  // Notifications live here (not in DashView) so the bell in the shared
  // desktop topbar can open the same panel from any tab. Not memoized with
  // an empty dep array on purpose — must reflect "now" on every render, or
  // a long-lived PWA session that crosses a month boundary would keep
  // evaluating due dates against a stale month.
  const currentMk = monthKey(new Date());

  // Outstanding Balance only reflects what's actually been billed — i.e.
  // installment purchases dated this month or earlier. Installment
  // transactions are inserted for every future month up front (see
  // saveInstallmentPlan above), so without this split, taking out a plan
  // would inflate Outstanding Balance by months of charges that haven't
  // come due yet. Those are surfaced separately via futureInstallmentTotal
  // instead (see CardTile's "in active plans" note).
  const cardsWithBalance = useMemo(() => {
    return cards.map((card) => {
      let balance = card.openingBalance || 0;
      let futureInstallmentTotal = 0;
      allTransactions.forEach((t) => {
        if (t.cardId !== card.id) return;
        const isFutureInstallment =
          t.installmentId && monthKey(t.date) > currentMk;
        if (t.type === "card-purchase" || t.type === "card-interest") {
          if (isFutureInstallment) futureInstallmentTotal += +t.amount;
          else balance += +t.amount;
        } else if (t.type === "card-payment") balance -= +t.amount;
      });
      return { ...card, currentBalance: balance, futureInstallmentTotal };
    });
  }, [cards, allTransactions, currentMk]);

  // Notifications are computed live, not stored rows, so "Completed" just
  // dismisses a specific occurrence in its billing month. Existing inst:/rec:
  // keys are retained, and future months are dismissed independently.
  const [completedNotifIds, setCompletedNotifIds] = useState(() =>
    loadCompletedNotifs(user.id, currentMk),
  );
  useEffect(() => {
    setCompletedNotifIds(loadCompletedNotifs(user.id, currentMk));
  }, [user.id, currentMk]);

  const [notificationRefresh, setNotificationRefresh] = useState(0);
  const markNotifCompleted = useCallback((id, occurrenceMonth = currentMk) => {
    if (occurrenceMonth === currentMk) {
      setCompletedNotifIds(previous => {
        if (previous.includes(id)) return previous;
        const next = [...previous, id];
        saveCompletedNotifs(user.id, occurrenceMonth, next);
        return next;
      });
    } else {
      const previous = loadCompletedNotifs(user.id, occurrenceMonth);
      if (!previous.includes(id)) saveCompletedNotifs(user.id, occurrenceMonth, [...previous, id]);
      setNotificationRefresh(value => value + 1);
    }
  }, [user.id, currentMk]);
  const notificationDate = todayLocal();
  const paymentNotifications = useMemo(() => {
    const completedByMonth = new Map([[currentMk, completedNotifIds]]);
    return buildPaymentNotifications({
      cards: cardsWithBalance, installmentPlans, recurringReminders, transactions, today: notificationDate,
      isCompleted: (month, id) => {
        if (!completedByMonth.has(month)) completedByMonth.set(month, loadCompletedNotifs(user.id, month));
        return completedByMonth.get(month).includes(id);
      },
      categoryForTransaction: transaction => getCat(transaction.category, transaction.type === 'income' ? 'income' : 'expense', allExpCats, allIncCats).id,
    });
  }, [cardsWithBalance, installmentPlans, recurringReminders, transactions, notificationDate, currentMk, completedNotifIds, notificationRefresh, user.id, allExpCats, allIncCats]);

  const notifCount = paymentNotifications.length;

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
    const inMonth = allTransactions.filter((t) => monthKey(t.date) === viewMonth);
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
  }, [allTransactions, viewMonth, allExpCats, allIncCats]);

  if (mustReload || loadFailed) return <div className="auth-page"><div className="auth-box"><h1 className="auth-title">Refresh your saved records</h1><p role="alert">A save could not be confirmed, or these records changed on another device. Refresh before making more changes.</p><button className="save-btn" onClick={() => window.location.reload()}>Reload saved data</button></div></div>;

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
    !moneyForm &&
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
    !editingPlan &&
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
              onEdit={editEntry}
              cards={cardsWithBalance}
              allExpCats={allExpCats}
              allIncCats={allIncCats}
              installmentPlans={installmentPlans}
              onOpenMenu={() => setShowDrawer(true)}
              onOpenNotifications={() => setShowNotifs(true)}
              notifCount={notifCount}
              showQuickRefresh={isStandalone}
              onQuickRefresh={handleQuickRefresh}
            />
          )}
          {tab === "dashboard" && (
            <DashView
              transactions={allTransactions}
              getEffectivePlan={getEffectivePlan}
              cards={cardsWithBalance}
              investments={investments}
              moneyRecords={moneyRecords}
              moneyEnabled={moneyEnabled}
              onOpenLoans={()=>setTab("money-lent")}
              onWithdraw={()=>openMoneyForm("withdrawal")}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              user={user}
              onOpenMenu={() => setShowDrawer(true)}
              allExpCats={allExpCats}
              allIncCats={allIncCats}
              onModalChange={setChildModalOpen}
              notifCount={notifCount}
              onOpenNotifications={() => setShowNotifs(true)}
              showQuickRefresh={isStandalone}
              onQuickRefresh={handleQuickRefresh}
              insightsLayout={insightsLayout}
              onInsightsLayoutChange={updateInsightsLayout}
              customCharts={customCharts}
              onCustomChartsChange={updateCustomCharts}
            />
          )}
          {tab === "money-lent" && <MoneyLentView records={moneyRecords} cards={cardsWithBalance} onNew={borrowerId=>openMoneyForm("loan",null,borrowerId)} onRepay={(id,borrowerId)=>openMoneyForm("repayment",id,borrowerId)} onEdit={r=>setMoneyForm({kind:r.kind,editing:r})} onDelete={deleteMoneyRecord} onSaveBorrower={saveBorrower} onMergeBorrowers={mergeBorrowers} onArchive={setLoanArchived} onModalChange={setChildModalOpen} onOpenMenu={()=>setShowDrawer(true)} onOpenNotifications={()=>setShowNotifs(true)} notifCount={notifCount} showQuickRefresh={isStandalone} onQuickRefresh={handleQuickRefresh}/>}
          {tab === "cards" && (
            <CardsView
              cards={cardsWithBalance}
              transactions={allTransactions}
              onEdit={(c) => setShowCardForm(c)}
              onNew={() => setShowCardForm("new")}
              onDelete={removeCard}
              onDeleteTx={deleteTx}
              onEditTx={editEntry}
              installmentPlans={installmentPlans}
              onCancelPlan={cancelInstallmentPlan}
              onEditPlan={setEditingPlan}
              allExpCats={allExpCats}
              allIncCats={allIncCats}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              onOpenMenu={() => setShowDrawer(true)}
              onOpenNotifications={() => setShowNotifs(true)}
              notifCount={notifCount}
              showQuickRefresh={isStandalone}
              onQuickRefresh={handleQuickRefresh}
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
              showQuickRefresh={isStandalone}
              onQuickRefresh={handleQuickRefresh}
            />
          )}
          {tab === "loan-calculator" && (
            <LoanCalculatorView
              onOpenMenu={() => setShowDrawer(true)}
              onOpenNotifications={() => setShowNotifs(true)}
              notifCount={notifCount}
              showQuickRefresh={isStandalone}
              onQuickRefresh={handleQuickRefresh}
            />
          )}
          {tab === "bank-details" && (
            <BankDetailsView
              userId={user.id}
              onOpenMenu={() => setShowDrawer(true)}
              onOpenNotifications={() => setShowNotifs(true)}
              notifCount={notifCount}
              showQuickRefresh={isStandalone}
              onQuickRefresh={handleQuickRefresh}
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
              showQuickRefresh={isStandalone}
              onQuickRefresh={handleQuickRefresh}
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
              showQuickRefresh={isStandalone}
              onQuickRefresh={handleQuickRefresh}
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
              {moneyEnabled && <NavBtn icon={Wallet} label="Money Lent" active={tab === "money-lent"} onClick={()=>setTab("money-lent")}/>}
              <NavBtn
                icon={LineChart}
                label="Investments"
                active={tab === "investments"}
                onClick={() => setTab("investments")}
              />
              <NavBtn
                icon={Calculator}
                label="Loan Calculator"
                active={tab === "loan-calculator"}
                onClick={() => setTab("loan-calculator")}
              />
              <NavBtn
                icon={Building2}
                label="Bank Details"
                active={tab === "bank-details"}
                onClick={() => setTab("bank-details")}
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

        {pendingDelete && <div className="undo-snackbar"><span>Transaction deleted</span><button className="undo-btn" onClick={undoDelete}>Undo</button></div>}

        {moneyForm && <MoneyForm key={moneyForm.editing?.id || moneyForm.kind} kind={moneyForm.kind} editing={moneyForm.editing} cards={cardsWithBalance} records={moneyRecords} onSave={saveMoneyRecord} onClose={()=>setMoneyForm(null)}/>}

        {showAdd && !entryGroup && <NewEntryChooser onChoose={chooseEntryGroup} onClose={()=>setShowAdd(false)}/>}
        {showAdd && entryGroup && ['loan','repayment','withdrawal','savings'].includes(entryTask) && <MoneyForm
          key={entryTask} kind={entryTask} cards={cardsWithBalance} records={moneyRecords} initialLoanId={entryContext.loanId} initialBorrowerId={entryContext.borrowerId}
          entryGroup={entryGroup} entryTask={entryTask} onSubtypeChange={chooseEntryTask} onBack={()=>setEntryGroup(null)} moneyEnabled={moneyEnabled}
          onSave={saveMoneyRecord} onClose={()=>setShowAdd(false)}/>}
        {showAdd && entryGroup && !['loan','repayment','withdrawal','savings'].includes(entryTask) && (
          <AddModal key={entryTask}
            cards={cardsWithBalance} moneyEnabled={moneyEnabled} initialType={entryTask}
            entryGroup={entryGroup} entryTask={entryTask} onSubtypeChange={chooseEntryTask} onBack={()=>setEntryGroup(null)}
            onClose={() => setShowAdd(false)}
            onSave={async(tx) => {await addTx(tx);setShowAdd(false);}}
            onSaveInstallment={async(plan) => {await saveInstallmentPlan(plan);setShowAdd(false);}}
            allExpCats={allExpCats} allIncCats={allIncCats} onAddCat={addCat} userId={user.id} installmentPlans={installmentPlans}/>
        )}

        {editingTx && (
          <AddModal
            editing={editingTx}
            moneyEnabled={moneyEnabled}
            cards={cardsWithBalance}
            onClose={() => setEditingTx(null)}
            onSave={async(tx) => {
              await editTx(editingTx.id, tx);
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
            moneyEnabled={moneyEnabled}
            card={showCardForm === "new" ? null : showCardForm}
            onClose={() => setShowCardForm(null)}
            onSave={async(c) => {
              await saveCard(c);
              setShowCardForm(null);
            }}
          />
        )}

        {editingPlan && (
          <InstallmentPlanFormModal
            plan={editingPlan}
            transactions={transactions}
            cards={cardsWithBalance}
            allExpCats={allExpCats}
            onClose={() => setEditingPlan(null)}
            onSave={async(planId, updates) => {
              await updateInstallmentPlanDetails(planId, updates);
              setEditingPlan(null);
            }}
          />
        )}

        {showInvestmentForm && (
          <InvestmentFormModal
            investment={
              showInvestmentForm === "new" ? null : showInvestmentForm
            }
            onClose={() => setShowInvestmentForm(null)}
            onSave={async(inv) => {
              await saveInvestment(inv);
              setShowInvestmentForm(null);
            }}
          />
        )}

        {recordingValueFor && (
          <InvestmentValueModal
            investment={recordingValueFor}
            onClose={() => setRecordingValueFor(null)}
            onSave={async(value, date, note) => {
              await recordInvestmentValue(recordingValueFor.id, value, date, note);
              setRecordingValueFor(null);
            }}
          />
        )}

        {editingValuation && (
          <InvestmentValueModal
            investment={editingValuation.investment}
            valuation={editingValuation.valuation}
            onClose={() => setEditingValuation(null)}
            onSave={async(value, date, note) => {
              await updateInvestmentValueEntry(
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
            moneyEnabled={moneyEnabled}
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
            notifications={paymentNotifications}
            onClose={() => setShowNotifs(false)}
            onComplete={markNotifCompleted}
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
