import { useState, useEffect, useRef } from 'react';
import { supabase, initCrypto, clearCrypto, clearDataSnapshots, signOut } from './lib/supabase.js';
import { upgradeEncryption } from './lib/dataSecurity.js';
import { purgePrivateCaches, clearAccountStorage } from './utils/securityStorage.js';
import { initialRecoveryLocation } from './utils/authFlow.js';
import AuthScreen from './components/AuthScreen.jsx';
import MainApp from './components/MainApp.jsx';
import RecoveryScreen from './components/RecoveryScreen.jsx';
import MfaScreen from './components/MfaScreen.jsx';

function SessionWorkspace({ session, currentUserRef }) {
  const [phase, setPhase] = useState('loading');
  const [factors, setFactors] = useState([]);
  const [retry, setRetry] = useState(0);
  const unlocked = useRef(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;
        if (!active || currentUserRef.current !== session.user.id) return;
        if (assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
          const { data, error } = await supabase.auth.mfa.listFactors();
          if (error) throw error;
          if (!active || currentUserRef.current !== session.user.id) return;
          clearCrypto(); unlocked.current = false;
          setFactors(data.totp.filter((f) => f.status === 'verified')); setPhase('mfa'); return;
        }
        if (!unlocked.current) {
          await initCrypto(session.user.id, { accessToken: session.access_token });
          if (!active || currentUserRef.current !== session.user.id) return;
          await upgradeEncryption(supabase, session.user.id);
          if (!active || currentUserRef.current !== session.user.id) return;
          unlocked.current = true;
        }
        setPhase('ready');
      } catch {
        if (active && currentUserRef.current === session.user.id) { clearCrypto(); unlocked.current = false; setPhase('error'); }
      }
    })();
    return () => { active = false; };
  }, [session.user.id, session.access_token, retry]);
  useEffect(() => () => clearCrypto(), []);
  if (phase === 'mfa') return <MfaScreen factors={factors} onVerified={() => { setPhase('loading'); setRetry((r) => r + 1); }} />;
  if (phase === 'error') return <div className="auth-page"><div className="auth-box"><h1 className="auth-title">Your data is locked</h1><p role="alert">Secure data access could not be completed. Your saved records have been kept. Check your connection or contact support if this continues.</p><button className="save-btn" onClick={() => { setPhase('loading'); setRetry((r) => r + 1); }}>Try again</button><button className="forgot-link" onClick={() => void signOut()}>Sign out</button></div></div>;
  if (phase !== 'ready') return <div className="loading" role="status" aria-label="Unlocking financial data"><div className="loading-ring" /></div>;
  return <MainApp key={session.user.id} user={session.user} />;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(() => initialRecoveryLocation(window.location));
  const lastUser = useRef(null);
  useEffect(() => {
    let active = true;
    let observedAuthEvent = false;
    // A previous worker may have cached authentication or private API requests.
    // Purge before attempting bootstrap, not only after the profile sign-out.
    purgePrivateCaches().then(() => supabase.auth.getSession()).then(({ data, error }) => {
      if (!active) return;
      if (!error && !observedAuthEvent) { lastUser.current = data.session?.user?.id; setSession(data.session); }
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      observedAuthEvent = true;
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (!nextSession || lastUser.current !== nextSession.user.id) {
        clearCrypto(); clearDataSnapshots();
        try { clearAccountStorage(lastUser.current); } catch { /* Storage may be disabled. */ }
        void purgePrivateCaches().catch(() => {});
      }
      lastUser.current = nextSession?.user?.id;
      setSession(nextSession);
    });
    return () => { active = false; subscription.unsubscribe(); clearCrypto(); };
  }, []);
  const finishRecovery = () => {
    window.history.replaceState(null, '', window.location.pathname);
    setRecovery(false);
  };
  if (loading) return <div className="loading"><div className="loading-ring" /></div>;
  if (recovery) return <RecoveryScreen session={session} onDone={finishRecovery} />;
  return session ? <SessionWorkspace key={session.user.id} session={session} currentUserRef={lastUser} /> : <AuthScreen />;
}
