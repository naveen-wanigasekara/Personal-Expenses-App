import { useEffect, useLayoutEffect, useState } from "react";
import { ThemeCtx } from "../context.js";
import { applyTheme, normalizeTheme, readTheme, resolveTheme, THEME_STORAGE_KEY } from "../utils/theme.js";

export default function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => readTheme());
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = resolveTheme(preference, systemDark);

  useLayoutEffect(() => applyTheme(theme), [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (event) => setSystemDark(event.matches);
    const onStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) setPreference(readTheme());
    };
    // Catch a system appearance change between initial render and subscription.
    setSystemDark(media.matches);
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const changeTheme = (value) => {
    const next = normalizeTheme(value);
    setPreference(next);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, next); }
    catch { /* The switch still works for this session when storage is blocked. */ }
  };

  return <ThemeCtx.Provider value={{ preference, changeTheme }}>{children}</ThemeCtx.Provider>;
}
