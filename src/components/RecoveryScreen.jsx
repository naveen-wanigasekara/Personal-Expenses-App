import { useState } from 'react';
import { supabase, signOut } from '../lib/supabase.js';
import { validateNewPassword, MIN_PASSWORD_LENGTH } from '../utils/securityPolicy.js';

export default function RecoveryScreen({ session, onDone }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const invalid = validateNewPassword(password, confirmation);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword(''); setConfirmation(''); setSaved(true);
      const { error: logoutError } = await signOut();
      if (logoutError) setError('Your password changed. Sign out again to finish revoking sessions.');
    } catch { setError('Your password could not be updated. The recovery link may have expired; request a new one.'); }
    finally { setBusy(false); }
  };
  return <div className="auth-page"><div className="auth-box">
    <h1 className="auth-title">{saved ? 'Password updated' : 'Choose a new password'}</h1>
    {saved ? <><p>Sign in again with your new password.</p><button className="save-btn" onClick={async () => { const { error: logoutError } = await signOut(); if (logoutError) setError('Could not sign out. Check your connection and retry.'); else onDone(); }}>Return to sign in</button></> : session ? <form onSubmit={submit} className="auth-form">
      <label htmlFor="recovery-password" className="field-lbl">New password</label>
      <input className="text-input" id="recovery-password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} maxLength={128} required value={password} onChange={(e) => setPassword(e.target.value)} />
      <label htmlFor="recovery-confirm" className="field-lbl">Confirm new password</label>
      <input className="text-input" id="recovery-confirm" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
      <p className="hint">Use at least 12 characters. All sessions will be signed out after the change.</p>
      <button className="save-btn" disabled={busy || !!validateNewPassword(password, confirmation)}>{busy ? 'Updating…' : 'Update password'}</button>
    </form> : <><p>This recovery link is missing or expired. Return to sign in and request a new link.</p><button className="save-btn" onClick={onDone}>Return to sign in</button></>}
    {error && <p className="auth-err" role="alert">{error}</p>}
  </div></div>;
}
