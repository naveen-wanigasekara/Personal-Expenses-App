// Amount fields display two decimal places; accept only finite amounts that
// can be shown without silently rounding away user-entered cents.
export function isValidMoneyDraft(raw) {
  return /^\d*\.?\d{0,2}$/.test(raw)
    && (raw === "" || raw === "." || Number.isFinite(Number(raw)));
}
