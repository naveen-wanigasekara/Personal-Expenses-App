// Run before styles/React so a saved light preference never flashes dark.
(() => {
  let preference = "dark";
  try {
    const saved = localStorage.getItem("ledger-theme-v1");
    if (["dark", "light", "system"].includes(saved)) preference = saved;
  } catch { /* Storage can be blocked; keep the existing dark default. */ }
  const theme = preference === "system"
    ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  const colorScheme = theme === "light" ? "only light" : "dark";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = colorScheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f3f7f5" : "#080f14");
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", colorScheme);
})();
