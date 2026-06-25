import { MoreHorizontal } from "lucide-react";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  ICON_MAP,
  getIconName,
} from "../constants/categories.js";

export function loadUserCats(userId) {
  try {
    const stored = localStorage.getItem(`user_cats_${userId}`);
    if (stored) {
      const raw = JSON.parse(stored);
      return {
        income: (raw.income || []).map((c) => ({
          ...c,
          icon: ICON_MAP[c.iconName] || MoreHorizontal,
        })),
        expense: (raw.expense || []).map((c) => ({
          ...c,
          icon: ICON_MAP[c.iconName] || MoreHorizontal,
        })),
      };
    }
    // migrate from old custom_cats format
    const old = localStorage.getItem(`custom_cats_${userId}`);
    const oldCustom = old ? JSON.parse(old) : { income: [], expense: [] };
    return {
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
        ...EXPENSE_CATEGORIES.map((c) => ({
          ...c,
          iconName: getIconName(c.icon),
        })),
        ...(oldCustom.expense || []).map((c) => ({
          ...c,
          icon: ICON_MAP[c.iconName] || MoreHorizontal,
        })),
      ],
    };
  } catch {
    return {
      income: INCOME_CATEGORIES.map((c) => ({
        ...c,
        iconName: getIconName(c.icon),
      })),
      expense: EXPENSE_CATEGORIES.map((c) => ({
        ...c,
        iconName: getIconName(c.icon),
      })),
    };
  }
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
