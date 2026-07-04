import {
  Landmark,
  Home as HomeIcon,
  Zap,
  ShoppingCart,
  Heart,
  Car,
  ShoppingBag,
  Film,
  ShieldAlert,
  PiggyBank,
  MoreHorizontal,
  Briefcase,
  Repeat,
  Gift,
  TrendingDown,
  TrendingUp,
  Wallet,
  Target,
  Percent,
  Utensils,
  GraduationCap,
  Plane,
  Sparkles,
} from "lucide-react";

export const EXPENSE_CATEGORIES = [
  { id: "loan", label: "Loan Repayment", icon: Landmark, color: "#e0654a" },
  { id: "rent", label: "House Rent", icon: HomeIcon, color: "#c98a5a" },
  { id: "utilities", label: "Utilities", icon: Zap, color: "#e3a847" },
  { id: "groceries", label: "Groceries", icon: ShoppingCart, color: "#7ba05b" },
  { id: "healthcare", label: "Healthcare", icon: Heart, color: "#d96477" },
  {
    id: "transport",
    label: "Transport & Vehicle",
    icon: Car,
    color: "#8a7555",
  },
  {
    id: "shopping-household",
    label: "Shopping & Household",
    icon: ShoppingBag,
    color: "#9878c0",
  },
  {
    id: "entertainment",
    label: "Entertainment & Dining",
    icon: Film,
    color: "#e08a5f",
  },
  {
    id: "insurance",
    label: "Insurance & Premiums",
    icon: ShieldAlert,
    color: "#5a8ba3",
  },
  {
    id: "card-interest",
    label: "Card Interest & Fees",
    icon: Percent,
    color: "#c64a6f",
  },
  {
    id: "savings-investments",
    label: "Savings & Investments",
    icon: PiggyBank,
    color: "#4a9b7a",
  },
  {
    id: "other",
    label: "Other Expenses",
    icon: MoreHorizontal,
    color: "#8a8075",
  },
];

// Seeded only for accounts created after CATEGORY_DEFAULTS_V2_CUTOVER (see
// isPostCutoverAccount below) — existing accounts keep EXPENSE_CATEGORIES
// above untouched. "Card Interest & Fees" isn't part of the curated list a
// user asked for, but AddModal.jsx always tags card-interest transactions
// with this exact id, so it must exist in every account's category list for
// those transactions to display correctly — kept here for that reason.
// "Savings & Investments" is deliberately not last, and "Miscellaneous" is
// deliberately last, so getCat's orphaned-id fallback (list[length-1]) can
// never land on the protected Savings category.
export const NEW_SIGNUP_EXPENSE_CATEGORIES = [
  { id: "food-dining", label: "Food & Dining", icon: Utensils, color: "#e08a5f" },
  { id: "transport", label: "Transport", icon: Car, color: "#8a7555" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "#9878c0" },
  {
    id: "bills-utilities",
    label: "Bills & Utilities",
    icon: Zap,
    color: "#e3a847",
  },
  { id: "entertainment", label: "Entertainment", icon: Film, color: "#c98a5a" },
  { id: "healthcare", label: "Healthcare", icon: Heart, color: "#d96477" },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    color: "#5a8ba3",
  },
  { id: "travel", label: "Travel", icon: Plane, color: "#7ba05b" },
  {
    id: "gifts-donations",
    label: "Gifts & Donations",
    icon: Gift,
    color: "#c64a6f",
  },
  {
    id: "personal-care",
    label: "Personal Care",
    icon: Sparkles,
    color: "#a594f9",
  },
  {
    id: "card-interest",
    label: "Card Interest & Fees",
    icon: Percent,
    color: "#e0654a",
  },
  {
    id: "savings-investments",
    label: "Savings & Investments",
    icon: PiggyBank,
    color: "#4a9b7a",
  },
  { id: "misc", label: "Miscellaneous", icon: MoreHorizontal, color: "#8a8075" },
];

export const INCOME_CATEGORIES = [
  { id: "fixed", label: "Fixed Income", icon: Briefcase, color: "#4a9b7a" },
  {
    id: "emergency",
    label: "Emergency Funds",
    icon: ShieldAlert,
    color: "#e3a847",
  },
  { id: "passive", label: "Passive Income", icon: Repeat, color: "#7ba05b" },
  { id: "bonus", label: "Bonus & Rewards", icon: Gift, color: "#d96477" },
  {
    id: "refund",
    label: "Refunds & Reimbursements",
    icon: TrendingDown,
    color: "#5a8ba3",
  },
  {
    id: "other-income",
    label: "Other Income",
    icon: MoreHorizontal,
    color: "#8a8075",
  },
];

export const ICON_MAP = {
  Briefcase,
  Repeat,
  Gift,
  TrendingDown,
  TrendingUp,
  Wallet,
  Target,
  Landmark,
  HomeIcon,
  Zap,
  ShoppingCart,
  Heart,
  Car,
  ShoppingBag,
  Film,
  ShieldAlert,
  PiggyBank,
  MoreHorizontal,
  Percent,
  Utensils,
  GraduationCap,
  Plane,
  Sparkles,
};

export const getIconName = (ic) =>
  Object.entries(ICON_MAP).find(([, v]) => v === ic)?.[0] || "MoreHorizontal";

export const ICON_OPTIONS = Object.entries(ICON_MAP).map(([name, icon]) => ({
  name,
  icon,
}));

export const CUSTOM_CAT_COLORS = [
  "#e0654a",
  "#c98a5a",
  "#e3a847",
  "#7ba05b",
  "#4a9b7a",
  "#d96477",
  "#5a8ba3",
  "#9878c0",
  "#e08a5f",
  "#c64a6f",
  "#a594f9",
  "#8a8075",
];

export const getCat = (id, type, expList, incList) => {
  const list =
    type === "income"
      ? incList || INCOME_CATEGORIES
      : expList || EXPENSE_CATEGORIES;
  return list.find((c) => c.id === id) || list[list.length - 1];
};

// The one expense category that can't be deleted or freely renamed, so the
// app can reliably identify savings transactions for the Total Savings stat.
// Protected for every account, regardless of signup date.
export const SAVINGS_CATEGORY_ID = "savings-investments";
export const SAVINGS_LABEL_OPTIONS = ["Savings", "Savings & Investments"];

// True for transactions that count as regular "spending" — excludes anything
// tagged as Savings, since setting money aside isn't spending it.
export const isSpendableExpense = (t, expList, incList) => {
  if (
    t.type !== "expense" &&
    t.type !== "card-purchase" &&
    t.type !== "card-interest"
  )
    return false;
  return (
    getCat(t.category, "expense", expList, incList).id !== SAVINGS_CATEGORY_ID
  );
};

// Fixed Income can't be deleted or freely renamed, for every account —
// same universal treatment as Savings above.
export const FIXED_INCOME_CATEGORY_ID = "fixed";
export const FIXED_INCOME_LABEL_OPTIONS = ["Fixed Income", "Salary"];

// Controls which default EXPENSE category set a brand-new signup is seeded
// with (see NEW_SIGNUP_EXPENSE_CATEGORIES vs EXPENSE_CATEGORIES in
// utils/storage.js) — unrelated to category protection, which is universal.
// Deliberately end-of-day today, not midnight — guarantees any account
// created earlier today (including test/dev accounts made while building
// this feature) is still treated as an existing account. Adjust this if the
// actual deploy happens on a different day than expected.
export const CATEGORY_DEFAULTS_V2_CUTOVER = "2026-07-03T00:00:00Z";

export function isPostCutoverAccount(createdAt) {
  if (!createdAt) return false;
  return (
    new Date(createdAt).getTime() >=
    new Date(CATEGORY_DEFAULTS_V2_CUTOVER).getTime()
  );
}

// Single source of truth for "is this category protected, and if so what are
// its only allowed labels" — used by CategoriesModal (disable delete),
// CategoryFormModal (lock the name field to a picker), and MainApp's
// editCat/deleteCat guards (defense-in-depth behind those UI guards).
export function getProtectedCategory(type, id) {
  if (type === "expense" && id === SAVINGS_CATEGORY_ID) {
    return { labelOptions: SAVINGS_LABEL_OPTIONS };
  }
  if (type === "income" && id === FIXED_INCOME_CATEGORY_ID) {
    return { labelOptions: FIXED_INCOME_LABEL_OPTIONS };
  }
  return null;
}

// Pure, in-memory default category set for a brand-new account — no
// database row or localStorage read involved. Deterministic in createdAt, so
// two devices that have never customized categories independently compute
// the identical list rather than needing to sync anything.
export function getDefaultUserCats(createdAt) {
  const defaultExpenseCategories = isPostCutoverAccount(createdAt)
    ? NEW_SIGNUP_EXPENSE_CATEGORIES
    : EXPENSE_CATEGORIES;
  return {
    income: INCOME_CATEGORIES.map((c) => ({ ...c, iconName: getIconName(c.icon) })),
    expense: defaultExpenseCategories.map((c) => ({
      ...c,
      iconName: getIconName(c.icon),
    })),
  };
}

// Guarantees the protected Savings category exists with a valid label,
// repairing silently (no visible migration step) for accounts whose
// user_settings row predates this feature or was edited before it became
// protected. Inserted before "other"/"misc" rather than appended, so it can
// never become getCat's list[list.length-1] fallback target for unrelated
// orphaned category ids. Applies to every account.
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

// Hydrates icon components from iconName (categories round-tripped through
// the database only carry iconName, since components aren't serializable)
// and repairs protected categories if missing or mislabeled. Pure — no
// database or localStorage access — so it works equally on a freshly
// fetched user_settings row. Returns `changed` in case a caller wants to
// know whether the repaired copy differs from what was passed in.
export function normalizeUserCats(raw) {
  const hydrated = {
    income: (raw?.income || []).map((c) => ({
      ...c,
      icon: ICON_MAP[c.iconName] || MoreHorizontal,
    })),
    expense: (raw?.expense || []).map((c) => ({
      ...c,
      icon: ICON_MAP[c.iconName] || MoreHorizontal,
    })),
  };
  let { cats, changed } = ensureProtectedSavingsCategory(hydrated);
  const fixedIncomeResult = ensureProtectedFixedIncomeCategory(cats);
  cats = fixedIncomeResult.cats;
  changed = changed || fixedIncomeResult.changed;
  return { cats, changed };
}
