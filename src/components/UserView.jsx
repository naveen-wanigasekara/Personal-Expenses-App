import { useState } from "react";
import {
  Menu,
  Bell,
  HelpCircle,
  MoreHorizontal,
  ChevronRight,
  DollarSign,
  ChevronDown,
  CalendarClock,
  Lock,
  MessageCircle,
  LogOut,
  Loader2,
} from "lucide-react";
import { signOut } from "../lib/supabase.js";
import { CURRENCIES } from "../constants/currencies.js";

export default function UserView({
  user,
  currency,
  onChangeCurrency,
  onOpenMenu,
  onOpenNotifications,
  notifCount,
  onOpenCategories,
  onOpenHelp,
  onOpenReminders,
}) {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const activeCurrency =
    CURRENCIES.find((c) => c.symbol === currency) || CURRENCIES[0];
  const initial = (user.email || "?")[0].toUpperCase();

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError(false);
    const { error } = await signOut();
    if (error) {
      setSigningOut(false);
      setSignOutError(true);
    }
  };

  return (
    <div className="view view-user">
      <div className="dash-topbar">
        <div className="mheader-left">
          <button className="icon-btn" onClick={onOpenMenu} aria-label="Menu">
            <Menu size={16} />
          </button>
        </div>
        <div className="mheader-center">
          <span className="mheader-title">Profile</span>
        </div>
        <div className="mheader-right">
          <button
            className="bell-btn"
            onClick={onOpenNotifications}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {notifCount > 0 && (
              <span className="notif-badge">{notifCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="page-hd">
        <div className="page-eyebrow">Account</div>
        <h1 className="page-title">Profile</h1>
      </div>

      <div className="account-info">
        <div className="account-avatar">{initial}</div>
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
        <span>User Guide</span>
        <ChevronRight
          size={15}
          style={{ marginLeft: "auto", color: "var(--ink-faint)" }}
        />
      </button>

      <button className="settings-menu-row" onClick={onOpenCategories}>
        <MoreHorizontal size={16} />
        <span>Manage Categories</span>
        <ChevronRight
          size={15}
          style={{ marginLeft: "auto", color: "var(--ink-faint)" }}
        />
      </button>

      <button className="settings-menu-row" onClick={onOpenReminders}>
        <CalendarClock size={16} />
        <span>Recurring Reminders</span>
        <ChevronRight
          size={15}
          style={{ marginLeft: "auto", color: "var(--ink-faint)" }}
        />
      </button>

      <div className="settings-menu-row settings-currency-row">
        <DollarSign size={16} />
        <span>Currency Settings</span>
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
      {signOutError && (
        <div className="hint" style={{ color: "var(--danger)" }}>
          Couldn't sign out — check your connection and try again.
        </div>
      )}
    </div>
  );
}
