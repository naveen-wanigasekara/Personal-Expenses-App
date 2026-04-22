export const fmt = (n) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n || 0);

export const fmtCompact = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (abs >= 100_000) return (n / 1_000).toFixed(0) + "K";
  if (abs >= 10_000) return (n / 1_000).toFixed(1) + "K";
  return fmt(n);
};

export const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });
};

export const emptyPlan = () => ({
  income: { total: 0, categories: {} },
  expense: { total: 0, categories: {} },
});

export function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 5) return "evening";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
