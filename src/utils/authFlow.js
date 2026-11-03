export function initialRecoveryLocation(location) {
  const hash = new URLSearchParams(location.hash.slice(1));
  return hash.get('type') === 'recovery' || new URLSearchParams(location.search).get('flow') === 'recovery';
}
export function isRecoveryEvent(event, pending) {
  return event === 'PASSWORD_RECOVERY' || (pending && event !== 'SIGNED_OUT');
}
