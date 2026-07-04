// localStorage-backed helpers. Deliberately narrow: categories, currency,
// Insights layout, and custom charts all live in the user_settings table now
// (see constants/categories.js's getDefaultUserCats/normalizeUserCats and
// MainApp.jsx) — this file only holds the small, genuinely per-device/
// session conveniences that were never meant to follow the user across
// devices in the first place.

export function loadLastCategory(userId, type) {
  return localStorage.getItem(`last_cat_${userId}_${type}`) || null;
}
export function saveLastCategory(userId, type, catId) {
  if (catId) localStorage.setItem(`last_cat_${userId}_${type}`, catId);
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
