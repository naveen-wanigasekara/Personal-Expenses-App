// Kept in memory only: no financial drafts or credentials enter browser storage.
const guards = new Set();
export const DISCARD_MESSAGE = 'Discard unsaved changes? Your entry has not been saved.';
export function registerDraftGuard(guard) {
  guards.add(guard);
  return () => guards.delete(guard);
}
export function hasBlockingDrafts() {
  return [...guards].some(guard => guard.dirty() || guard.busy?.());
}
export function canLeaveDrafts() {
  if ([...guards].some(guard => guard.busy?.())) return false;
  return ![...guards].some(guard => guard.dirty()) || window.confirm(DISCARD_MESSAGE);
}
