// Same-day values need a deterministic tie-breaker after database reloads.
export function compareValuations(a, b) {
  return a.recordedDate.localeCompare(b.recordedDate)
    || (a.createdAt || '').localeCompare(b.createdAt || '')
    || a.id.localeCompare(b.id);
}
export function latestValuationValue(rows) {
  return rows.length ? rows.reduce((latest, row) => compareValuations(row, latest) > 0 ? row : latest).value : null;
}
