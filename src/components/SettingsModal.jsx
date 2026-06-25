import { useState, useEffect } from "react";
import {
  X,
  HelpCircle,
  MoreHorizontal,
  ChevronRight,
  DollarSign,
  Lock,
  MessageCircle,
  LogOut,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { signOut } from "../lib/supabase.js";
import { CURRENCIES } from "../constants/currencies.js";

export default function SettingsModal({
  user,
  onClose,
  onOpenCategories,
  onOpenHelp,
  onOpenReminders,
  currency,
  onChangeCurrency,
}) {
  const [signingOut, setSigningOut] = useState(false);
  const activeCurrency =
    CURRENCIES.find((c) => c.symbol === currency) || CURRENCIES[0];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>Account</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="account-info">
          <div className="account-avatar">
            {(user.email || "?")[0].toUpperCase()}
          </div>
          <div className="account-meta">
            <div className="account-email">{user.email}</div>
            <div className="account-since">
              Member since{" "}
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        <button className="settings-menu-row" onClick={onOpenHelp}>
          <HelpCircle size={16} />
          <span>Help &amp; user guide</span>
          <ChevronRight
            size={15}
            style={{ marginLeft: "auto", color: "var(--ink-faint)" }}
          />
        </button>

        <button className="settings-menu-row" onClick={onOpenCategories}>
          <MoreHorizontal size={16} />
          <span>Manage categories</span>
          <ChevronRight
            size={15}
            style={{ marginLeft: "auto", color: "var(--ink-faint)" }}
          />
        </button>

        <div className="settings-menu-row settings-currency-row">
          <DollarSign size={16} />
          <span>Currency</span>
          <div className="currency-picker" style={{ marginLeft: "auto" }}>
            <span className="currency-code">{activeCurrency.code}</span>
            <ChevronDown size={13} style={{ color: "var(--ink-faint)" }} />
            <select
              className="currency-select-overlay"
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value)}
              aria-label="Select currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.symbol}>
                  {c.code} ({c.symbol}) — {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="privacy-card">
          <div className="privacy-card-header">
            <Lock size={15} />
            <span>Privacy &amp; Security</span>
          </div>
          <p className="privacy-card-body">
            Your financial data is end-to-end encrypted and securely stored in
            the cloud, and only you can access it—we never share, sell, or read
            your personal information, ensuring it remains 100% private with
            secure cloud sync.
          </p>
        </div>

        <a
          className="save-btn support-btn"
          href="https://wa.me/94705025330"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={16} /> Contact Support
        </a>

        <button
          className="save-btn danger-btn"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <LogOut size={16} />
          )}
          Sign out
        </button>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
