export const THEME_STORAGE_KEY = "ledger-theme-v1";
export const THEME_PREFERENCES = ["dark", "light", "system"];

export function normalizeTheme(value) {
  return THEME_PREFERENCES.includes(value) ? value : "dark";
}

export function readTheme(storage) {
  try {
    return normalizeTheme((storage ?? window.localStorage).getItem(THEME_STORAGE_KEY));
  } catch {
    return "dark";
  }
}

export function resolveTheme(preference, systemDark) {
  return preference === "system" ? (systemDark ? "dark" : "light") : normalizeTheme(preference);
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content", theme === "light" ? "#f3f7f5" : "#080f14",
  );
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", theme);
}
