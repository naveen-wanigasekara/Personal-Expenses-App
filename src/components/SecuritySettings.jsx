import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import Sheet from './Sheet.jsx';

export default function SecuritySettings({ onClose }) {
  const [factors, setFactors] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth.mfa.listFactors().then(({ data, error: e }) => {
      if (active) { if (e) setError('Could not load authenticators.'); else setFactors(data.totp || []); }
    }).catch(() => { if (active) setError('Could not load authenticators.'); });
    return () => { active = false; };
  }, []);
  const enroll = async () => {
    setBusy(true); setError('');
    try {
      // Reuse an unfinished factor rather than silently creating more of them.
      for (const factor of factors.filter((f) => f.status === 'unverified')) {
        const { error: e } = await supabase.auth.mfa.unenroll({ factorId: factor.id }); if (e) throw e;
      }
      const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Ledger authenticator' });
      if (e) throw e; setEnrollment(data);
    } catch { setError('Could not start authenticator setup. Please try again.'); }
    finally { setBusy(false); }
  };
  const verify = async (event) => {
    event.preventDefault(); if (busy || !/^\d{6}$/.test(code)) return;
    setBusy(true); setError('');
    try {
      const { error: e } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.id, code });
      if (e) throw e;
      setEnrollment(null); setCode(''); setSuccess(true);
    } catch { setError('Code not accepted. Try the latest authenticator code.'); }
    finally { setBusy(false); }
  };
  const verified = factors?.some((f) => f.status === 'verified');
  return <Sheet title="Account security" onClose={onClose}>
    <p>Protect your account with an authenticator app. Store a backup of your authenticator securely before enabling it.</p>
    {success || verified ? <p role="status">Two-factor authentication is enabled. You will need your authenticator when signing in.</p> : enrollment ? <form className="auth-form" onSubmit={verify}>
      <p>Scan this QR code in your authenticator app, then enter its six-digit code.</p>
      <img width="200" height="200" alt="Authenticator setup QR code" src={enrollment.totp.qr_code.startsWith('data:image/') ? enrollment.totp.qr_code : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.totp.qr_code)}`} />
      <details><summary>Enter a setup key instead</summary><code style={{ overflowWrap: 'anywhere' }}>{enrollment.totp.secret}</code></details>
      <label className="field-lbl" htmlFor="enroll-code">Authentication code</label><input id="enroll-code" className="text-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
      <button className="save-btn" disabled={busy || !/^\d{6}$/.test(code)}>{busy ? 'Verifying…' : 'Enable two-factor authentication'}</button>
    </form> : <button className="save-btn" disabled={busy || !factors} onClick={enroll}>{busy ? 'Preparing…' : 'Set up authenticator'}</button>}
    {error && <p className="auth-err" role="alert">{error}</p>}
  </Sheet>;
}
