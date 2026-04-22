import { useState } from "react";
import { Wallet, Mail, KeyRound, Loader2 } from "lucide-react";
import { signUp, signIn, resetPassword } from "../lib/supabase.js";

export default function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const switchMode = (next) => { setMode(next); setErr(null); setMsg(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMsg("Check your email for a confirmation link to complete signup.");
      } else if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setMsg("Password reset link sent — check your inbox.");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="app-glow" />
      <div className="auth-box">
        <div className="auth-brand">
          <div className="auth-logo"><Wallet size={20} strokeWidth={2} /></div>
          <div className="auth-brand-text">Ledger</div>
        </div>

        <h1 className="auth-title">
          {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}
        </h1>
        <p className="auth-sub">
          {mode === "signup"
            ? "Start tracking income, expenses, and budgets."
            : mode === "forgot"
            ? "Enter your email and we'll send you a reset link."
            : "Sign in to your account to continue."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-lbl">Email</label>
          <div className="auth-input">
            <Mail size={15} />
            <input type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required />
          </div>

          {mode !== "forgot" && (
            <>
              <div className="auth-pw-row">
                <label className="field-lbl">Password</label>
                {mode === "signin" && (
                  <button type="button" className="forgot-link" onClick={() => switchMode("forgot")}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="auth-input">
                <KeyRound size={15} />
                <input type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6} />
              </div>
            </>
          )}

          {err && <div className="auth-err">{err}</div>}
          {msg && <div className="auth-msg">{msg}</div>}

          <button type="submit" className="save-btn" disabled={busy || !email || (mode !== "forgot" && !password)}>
            {busy
              ? <><Loader2 size={16} className="spin" /> Please wait...</>
              : mode === "signup" ? "Create account"
              : mode === "forgot" ? "Send reset link"
              : "Sign in"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "forgot" ? (
            <>Remember your password? <button onClick={() => switchMode("signin")}>Sign in</button></>
          ) : mode === "signup" ? (
            <>Already have an account? <button onClick={() => switchMode("signin")}>Sign in</button></>
          ) : (
            <>Don't have an account? <button onClick={() => switchMode("signup")}>Sign up</button></>
          )}
        </div>
      </div>
    </div>
  );
}
