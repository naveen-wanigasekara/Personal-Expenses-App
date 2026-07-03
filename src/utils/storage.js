import { MoreHorizontal } from "lucide-react";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  NEW_SIGNUP_EXPENSE_CATEGORIES,
  ICON_MAP,
  getIconName,
  SAVINGS_CATEGORY_ID,
  SAVINGS_LABEL_OPTIONS,
  FIXED_INCOME_CATEGORY_ID,
  FIXED_INCOME_LABEL_OPTIONS,
  isPostCutoverAccount,
} from "../constants/categories.js";

// Guarantees the protected Savings category exists with a valid label,
// repairing silently (no visible migration step) for both new and existing
// users whose localStorage predates this feature or was edited before it
// became protected. Inserted before "other"/"misc" rather than appended, so
// it can never become getCat's list[list.length-1] fallback target for
// unrelated orphaned category ids. Applies to every account.
function ensureProtectedSavingsCategory(cats) {
  const expense = [...cats.expense];
  const idx = expense.findIndex((c) => c.id === SAVINGS_CATEGORY_ID);
  const valid = idx !== -1 && SAVINGS_LABEL_OPTIONS.includes(expense[idx].label);
  if (valid) return { cats, changed: false };

  const defaultCat = {
    id: SAVINGS_CATEGORY_ID,
    label: "Savings & Investments",
    iconName: "PiggyBank",
    icon: ICON_MAP.PiggyBank,
    color: "#4a9b7a",
  };

  if (idx === -1) {
    const lastIdx = expense.findIndex((c) => c.id === "other" || c.id === "misc");
    expense.splice(lastIdx === -1 ? expense.length : lastIdx, 0, defaultCat);
  } else {
    expense[idx] = { ...expense[idx], label: "Savings & Investments" };
  }
  return { cats: { ...cats, expense }, changed: true };
}

// Same idea as ensureProtectedSavingsCategory, but for Fixed Income — also
// applies to every account. Inserted at the front (its canonical default
// position) rather than appended.
function ensureProtectedFixedIncomeCategory(cats) {
  const income = [...cats.income];
  const idx = income.findIndex((c) => c.id === FIXED_INCOME_CATEGORY_ID);
  const valid =
    idx !== -1 && FIXED_INCOME_LABEL_OPTIONS.includes(income[idx].label);
  if (valid) return { cats, changed: false };

  const defaultCat = {
    id: FIXED_INCOME_CATEGORY_ID,
    label: "Fixed Income",
    iconName: "Briefcase",
    icon: ICON_MAP.Briefcase,
    color: "#4a9b7a",
  };

  if (idx === -1) {
    income.unshift(defaultCat);
  } else {
    income[idx] = { ...income[idx], label: "Fixed Income" };
  }
  return { cats: { ...cats, income }, changed: true };
}

export function loadUserCats(userId, createdAt) {
  const isNewCohort = isPostCutoverAccount(createdAt);
  const defaultExpenseCategories = isNewCohort
    ? NEW_SIGNUP_EXPENSE_CATEGORIES
    : EXPENSE_CATEGORIES;

  let result;
  try {
    const stored = localStorage.getItem(`user_cats_${userId}`);
    if (stored) {
      const raw = JSON.parse(stored);
      result = {
        income: (raw.income || []).map((c) => ({
          ...c,
          icon: ICON_MAP[c.iconName] || MoreHorizontal,
        })),
        expense: (raw.expense || []).map((c) => ({
          ...c,
          icon: ICON_MAP[c.iconName] || MoreHorizontal,
        })),
      };
    } else {
      // migrate from old custom_cats format — a legacy-only path, so this
      // always seeds from the legacy defaults regardless of cohort (a
      // genuinely new signup will never have this old-format key at all).
      const old = localStorage.getItem(`custom_cats_${userId}`);
      const oldCustom = old ? JSON.parse(old) : { income: [], expense: [] };
      result = {
        income: [
          ...INCOME_CATEGORIES.map((c) => ({
            ...c,
            iconName: getIconName(c.icon),
          })),
          ...(oldCustom.income || []).map((c) => ({
            ...c,
            icon: ICON_MAP[c.iconName] || MoreHorizontal,
          })),
        ],
        expense: [
          ...defaultExpenseCategories.map((c) => ({
            ...c,
            iconName: getIconName(c.icon),
          })),
          ...(oldCustom.expense || []).map((c) => ({
            ...c,
            icon: ICON_MAP[c.iconName] || MoreHorizontal,
          })),
        ],
      };
    }
  } catch {
    result = {
      income: INCOME_CATEGORIES.map((c) => ({
        ...c,
        iconName: getIconName(c.icon),
      })),
      expense: defaultExpenseCategories.map((c) => ({
        ...c,
        iconName: getIconName(c.icon),
      })),
    };
  }

  let { cats, changed } = ensureProtectedSavingsCategory(result);
  const fixedIncomeResult = ensureProtectedFixedIncomeCategory(cats);
  cats = fixedIncomeResult.cats;
  changed = changed || fixedIncomeResult.changed;
  if (changed) saveUserCats(userId, cats);
  return cats;
}

export function saveUserCats(userId, cats) {
  localStorage.setItem(
    `user_cats_${userId}`,
    JSON.stringify({
      income: cats.income.map(({ icon: _, ...r }) => r),
      expense: cats.expense.map(({ icon: _, ...r }) => r),
    }),
  );
}

export function loadUserCurrency(userId) {
  return localStorage.getItem(`user_currency_${userId}`) || "Rs.";
}

export function saveUserCurrency(userId, sym) {
  localStorage.setItem(`user_currency_${userId}`, sym);
}

export function loadLastCategory(userId, type) {
  return localStorage.getItem(`last_cat_${userId}_${type}`) || null;
}
export function saveLastCategory(userId, type, catId) {
  if (catId) localStorage.setItem(`last_cat_${userId}_${type}`, catId);
}

export function loadInsightsLayout(userId) {
  try {
    const raw = localStorage.getItem(`insights_layout_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveInsightsLayout(userId, layout) {
  localStorage.setItem(`insights_layout_${userId}`, JSON.stringify(layout));
}

export function loadCustomCharts(userId) {
  try {
    const raw = localStorage.getItem(`custom_charts_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomCharts(userId, charts) {
  localStorage.setItem(`custom_charts_${userId}`, JSON.stringify(charts));
}

// Notifications are computed live from installment plans/recurring reminders,
// not stored rows — marking one "Completed" just dismisses that specific
// occurrence for the current month, keyed by month so it naturally
// reappears if the underlying plan/reminder is still active next month
// (matching how recurring reminders already auto-dismiss once a matching
// transaction exists for the month).
export function loadCompletedNotifs(userId, monthKey) {
  try {
    const raw = localStorage.getItem(`completed_notifs_${userId}_${monthKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCompletedNotifs(userId, monthKey, ids) {
  localStorage.setItem(
    `completed_notifs_${userId}_${monthKey}`,
    JSON.stringify(ids),
  );
}
