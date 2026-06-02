import { useEffect } from "react";
import { X, CreditCard, Bell } from "lucide-react";
import { useContext } from "react";
import { CurrencyCtx } from "../context.js";
import { fmt } from "../utils/format.js";

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function NotificationsPanel({ installmentNotifs, recurringNotifs, cards, currentMk, onClose }) {
  const CURRENCY = useContext(CurrencyCtx);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const getCardName = (cardId) => cards.find((c) => c.id === cardId)?.name || "Card";

  const getSeq = (plan) => {
    const [sy, sm] = plan.startMonth.split("-").map(Number);
    const [cy, cm] = currentMk.split("-").map(Number);
    return (cy - sy) * 12 + (cm - sm) + 1;
  };

  const hasNotifs = installmentNotifs.length > 0 || recurringNotifs.length > 0;

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>Notifications</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {!hasNotifs && (
          <div className="empty-sm">No notifications for this month.</div>
        )}

        {installmentNotifs.length > 0 && (
          <>
            <div className="notif-section-label">Installment Payments</div>
            <div className="notif-list">
              {installmentNotifs.map((plan) => {
                const seq = getSeq(plan);
                return (
                  <div key={plan.id} className="notif-item">
                    <div className="notif-icon notif-icon-card"><CreditCard size={14} /></div>
                    <div className="notif-body">
                      <div className="notif-title">{plan.label}</div>
                      <div className="notif-meta">
                        {getCardName(plan.cardId)} · Installment {seq}/{plan.totalMonths}
                      </div>
                    </div>
                    <div className="notif-amt">{CURRENCY} {fmt(plan.monthlyAmount)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {recurringNotifs.length > 0 && (
          <>
            <div className="notif-section-label">Recurring Bills</div>
            <div className="notif-list">
              {recurringNotifs.map((reminder) => (
                <div key={reminder.id} className="notif-item">
                  <div className="notif-icon notif-icon-bell"><Bell size={14} /></div>
                  <div className="notif-body">
                    <div className="notif-title">{reminder.label}</div>
                    <div className="notif-meta">Due {ordinal(reminder.dayOfMonth)} of this month</div>
                  </div>
                  {reminder.amount && (
                    <div className="notif-amt">{CURRENCY} {fmt(reminder.amount)}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
