import { useContext } from 'react';
import { CreditCard, Bell, Check, CalendarDays } from 'lucide-react';
import { CurrencyCtx } from '../context.js';
import { fmt, monthLabel } from '../utils/format.js';
import { paymentNotificationSections } from '../utils/paymentNotifications.js';
import Sheet from './Sheet.jsx';

const TYPE_LABELS = { card: 'Credit card payment', installment: 'Installment payment', other: 'Recurring bill' };
const STATUS_LABELS = { overdue: 'Overdue', due: 'Due today', upcoming: 'Upcoming', 'date-needed': 'Due date not set', scheduled: 'Schedule reminder' };
function displayDate(row) {
  if (!row.date) return `${monthLabel(row.month)} · Exact due date not set`;
  const [year, month, day] = row.date.split('-').map(Number);
  return `${row.status === 'overdue' ? 'Was due' : row.status === 'scheduled' ? 'Scheduled for' : 'Due'} ${new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
export default function NotificationsPanel({ notifications = [], onClose, onComplete }) {
  const currency = useContext(CurrencyCtx);
  return <Sheet title="Notifications" onClose={onClose} className="payment-notifications-sheet">
    <div className="payment-notifications-scroll">
      <p className="notif-intro">Saved card payment dates. Installments due within 20 days, plus current-month due reminders. Recurring bills for this month and next.</p>
      {!notifications.length && <div className="empty-sm">No upcoming or due payment reminders.</div>}
      {paymentNotificationSections(notifications).map(section => section.rows.length > 0 && <section key={section.id} className="payment-notif-section" aria-labelledby={`payment-notif-${section.id}`}>
        <h3 className="notif-section-label" id={`payment-notif-${section.id}`}>{section.title}<span className="count">{section.rows.length}</span></h3>
        <div className="notif-list">{section.rows.map(row => {
          const Icon = row.type === 'card' ? CreditCard : row.type === 'installment' ? CalendarDays : Bell;
          return <article key={row.id} className={`notif-item payment-notif-item ${row.status}`}>
            <div className={`notif-icon ${row.type === 'other' ? 'notif-icon-bell' : 'notif-icon-card'}`}><Icon size={16} aria-hidden="true" /></div>
            <div className="notif-body">
              <div className="payment-notif-heading"><div className="notif-title">{row.title}</div><span className={`payment-notif-status ${row.status}`}>{STATUS_LABELS[row.status]}</span></div>
              <div className="notif-meta">{TYPE_LABELS[row.type]} · {row.detail}</div>
              <div className="notif-meta payment-notif-date">{displayDate(row)}</div>
              {row.amount != null && <div className="notif-amt"><span>{row.amountLabel}: </span>{currency} {fmt(row.amount)}</div>}
            </div>
            <button className="notif-complete-btn" onClick={() => onComplete(row.completionId, row.month)} aria-label={`Mark ${row.title} for ${monthLabel(row.month)} as completed`} title="Mark as completed"><Check size={16} /></button>
          </article>;
        })}</div>
      </section>)}
      <p className="notif-explanation">Card amounts are current outstanding balances, not statement or minimum-payment amounts. Installments are part of card payments, not extra debt.</p>
      <p className="notif-explanation">Marking completed hides this reminder on this device; it does not record a payment. Past months without tracked payment status are not assumed overdue.</p>
    </div>
  </Sheet>;
}
