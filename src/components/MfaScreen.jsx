import { useState } from 'react';
import { supabase, signOut } from '../lib/supabase.js';

export default function MfaScreen({ factors, onVerified }) {
  const [factorId, setFactorId] = useState(factors[0]?.id || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); if (!/^\d{6}$/.test(code) || !factorId || busy) return;
    setBusy(true); setError('');
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (verifyError) throw verifyError;
      setCode(''); onVerified();
    } catch { setError('The code could not be verified. Try the latest code from your authenticator.'); }
    finally { setBusy(false); }
  };
  return <div className="auth-page"><div className="auth-box"><h1 className="auth-title">Verify your sign-in</h1><p>Enter the code from your authenticator app.</p><form className="auth-form" onSubmit={submit}>
    {factors.length > 1 && <><label htmlFor="mfa-factor">Authenticator</label><select id="mfa-factor" className="text-input" value={factorId} onChange={(e) => setFactorId(e.target.value)}>{factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.friendly_name || 'Authenticator'}</option>)}</select></>}
    <label className="field-lbl" htmlFor="mfa-code">Authentication code</label><input className="text-input" id="mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
    {error && <p className="auth-err" role="alert">{error}</p>}<button className="save-btn" disabled={busy || !/^\d{6}$/.test(code)}>{busy ? 'Verifying…' : 'Verify'}</button>
  </form><button className="forgot-link" onClick={async () => { const { error: e } = await signOut(); if (e) setError('Could not sign out. Check your connection.'); }}>Sign out</button></div></div>;
}
