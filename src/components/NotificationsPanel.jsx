import { useContext } from "react";
import { CreditCard, Bell, Check } from "lucide-react";
import { CurrencyCtx } from "../context.js";
import { fmt, ordinal } from "../utils/format.js";
import Sheet from "./Sheet.jsx";

export default function NotificationsPanel({
  installmentNotifs,
  recurringNotifs,
  cards,
  currentMk,
  onClose,
  onCompleteInstallment,
  onCompleteRecurring,
}) {
  const CURRENCY = useContext(CurrencyCtx);

  const getCardName = (cardId) =>
    cards.find((c) => c.id === cardId)?.name || "Card";

  const getSeq = (plan) => {
    const [sy, sm] = plan.startMonth.split("-").map(Number);
    const [cy, cm] = currentMk.split("-").map(Number);
    return (cy - sy) * 12 + (cm - sm) + 1;
  };

  const hasNotifs = installmentNotifs.length > 0 || recurringNotifs.length > 0;

  return (
    <Sheet title="Notifications" onClose={onClose}>
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
                  <div className="notif-icon notif-icon-card">
                    <CreditCard size={14} />
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">{plan.label}</div>
                    <div className="notif-meta">
                      {getCardName(plan.cardId)} · Installment {seq}/
                      {plan.totalMonths}
                    </div>
                  </div>
                  <div className="notif-amt">
                    {CURRENCY} {fmt(plan.monthlyAmount)}
                  </div>
                  <button
                    className="notif-complete-btn"
                    onClick={() => onCompleteInstallment(plan.id)}
                    aria-label="Mark as completed"
                    title="Mark as completed"
                  >
                    <Check size={14} />
                  </button>
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
                <div className="notif-icon notif-icon-bell">
                  <Bell size={14} />
                </div>
                <div className="notif-body">
                  <div className="notif-title">{reminder.label}</div>
                  <div className="notif-meta">
                    Due {ordinal(reminder.dayOfMonth)} of this month
                  </div>
                </div>
                {reminder.amount && (
                  <div className="notif-amt">
                    {CURRENCY} {fmt(reminder.amount)}
                  </div>
                )}
                <button
                  className="notif-complete-btn"
                  onClick={() => onCompleteRecurring(reminder.id)}
                  aria-label="Mark as completed"
                  title="Mark as completed"
                >
                  <Check size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ height: 20 }} />
    </Sheet>
  );
}
