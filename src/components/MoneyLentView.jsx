import { useContext, useEffect, useMemo, useState } from 'react';
import { Archive, ArrowLeft, Menu, Users, ArrowDownLeft, ArrowUpRight, Pencil, Trash2, Bell, RefreshCw, Search, Wallet } from 'lucide-react';
import { CurrencyCtx } from '../context.js';
import { accountLabel, loanSummary, roundMoney, todayLocal } from '../utils/money.js';
import { borrowerGroups, borrowerLoanLabel } from '../utils/borrowers.js';
import { fmt } from '../utils/format.js';
import BorrowerForm, { BorrowerMergeForm } from './BorrowerForm.jsx';
import MoneyActionMenu from './MoneyActionMenu.jsx';

function Amounts({ items, currency, className = '' }) {
  return <dl className={`money-stats ${className}`}>{items.filter(Boolean).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{currency} {fmt(value)}</dd></div>)}</dl>;
}

export default function MoneyLentView({ records, cards, onRepay, onEdit, onDelete,
  onSaveBorrower, onMergeBorrowers, onArchive, onModalChange, onOpenMenu,
  onOpenNotifications, notifCount, showQuickRefresh, onQuickRefresh }) {
  const currency = useContext(CurrencyCtx);
  const [mode, setMode] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null), [merge, setMerge] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { onModalChange?.(!!form || !!merge); return () => onModalChange?.(false); }, [form, merge, onModalChange]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  const groups = useMemo(() => borrowerGroups(records), [records]);
  const through = todayLocal();
  const summaryById = useMemo(() => new Map(records.filter(r => r.kind === 'loan').map(loan => [loan.id, loanSummary(loan, records, through)])), [records, through]);
  const summaryFor = loan => summaryById.get(loan.id);
  const selected = groups.find(g => g.id === selectedId);
  const isArchived = loan => !!loan.archived || summaryFor(loan).status === 'Settled';
  const archiveCount = records.filter(r => r.kind === 'loan' && isArchived(r)).length;
  const visibleLoans = group => group.loans.filter(loan => mode === 'directory' || isArchived(loan) === (mode === 'archive'));
  const totals = group => {
    const sum = field => roundMoney(group.loans.reduce((value, loan) => value + Number(field === 'lent' ? loan.amount : summaryFor(loan)[field]), 0));
    return { lent: sum('lent'), outstanding: sum('outstanding'), principalReturned: sum('principalReturned'), interestReceived: sum('interestReceived'), interestDue: sum('interestDue') };
  };
  const run = async action => {
    if (busy) return; setBusy(true); setError('');
    try { await action(); } catch (err) { setError(err.message || 'Could not save. Please try again.'); } finally { setBusy(false); }
  };
  const status = summary => <span className={`money-status ${summary.status === 'Settled' ? 'settled' : summary.status === 'Payment due' ? 'due' : ''}`}>{summary.status}</span>;
  const paymentAmounts = payment => <span>{Number(payment.principal) > 0 && <>Principal {currency} {fmt(payment.principal)}</>}{Number(payment.principal) > 0 && Number(payment.interest) > 0 && ' · '}{Number(payment.interest) > 0 && <>Interest {currency} {fmt(payment.interest)}</>}</span>;
  const loanCard = (loan, group) => {
    const summary = summaryFor(loan), archived = isArchived(loan);
    const funding = loan.account === 'card' ? cards.find(c => c.id === loan.cardId)?.name || 'Deleted credit card' : accountLabel(loan.account);
    return <article className={`card money-loan ${summary.status === 'Settled' ? 'loan-settled' : ''}`} key={loan.id}>
      <div className="lending-loan-heading"><h3>{borrowerLoanLabel(loan, group.loans)}</h3>
        <MoneyActionMenu label={`Loan actions: ${borrowerLoanLabel(loan, group.loans)}`} actions={[
          { label: 'Edit loan', icon: Pencil, onSelect: () => onEdit(loan) },
          onArchive && summary.status !== 'Settled' && { label: archived ? 'Restore to active' : 'Archive inactive loan', icon: Archive, disabled: busy, onSelect: () => run(() => onArchive(loan, !archived)) },
          { label: 'Delete loan', icon: Trash2, danger: true, onSelect: () => onDelete(loan) },
        ]} />
      </div>
      <div className="lending-meta">{status(summary)}<span>{funding}</span><span>{Number(loan.rate) === 0 ? 'Interest-free' : `${loan.rate}% ${loan.ratePeriod}`}</span></div>
      {loan.archived && summary.status !== 'Settled' && <p className="money-hint">Archived · balance still owed</p>}
      <Amounts currency={currency} items={[
        ['Principal outstanding', summary.outstanding],
        summary.principalReturned > 0 && ['Principal returned', summary.principalReturned],
        summary.interestReceived > 0 && ['Interest received', summary.interestReceived],
        summary.interestDue > 0 && ['Unpaid interest', summary.interestDue],
        summary.interestCredit > 0 && ['Interest paid in advance', summary.interestCredit],
      ]} />
      <div className="lending-terms">
        {Number(loan.rate) > 0 && <p>Interest on {loan.interestBasis === 'remaining' ? 'remaining principal' : 'original amount'}</p>}
        {loan.arrangement === 'installments' ? <p>{loan.installmentMonths} monthly principal installments</p> : loan.arrangement !== 'flexible' && (loan.arrangement !== 'interest-only' || Number(loan.rate) > 0) && <p>Repayment: {loan.arrangement.replace('-', ' ')}</p>}
        {loan.dueDate && <p>Principal due {loan.dueDate}</p>}
        {summary.nextInterestDate && <p>Next interest {summary.nextInterestDate}</p>}
        {summary.nextPrincipalDate && summary.nextPrincipalDate !== loan.dueDate && <p>Next principal {summary.nextPrincipalDate}</p>}
      </div>
      {summary.principalDue > 0 && <p className="money-error">Principal due: {currency} {fmt(summary.principalDue)}</p>}
      {loan.note && <p className="lending-note">{loan.note}</p>}
      {summary.status !== 'Settled' && <div className="money-actions"><button className="tx-edit" onClick={() => onRepay(loan.id, group.id)}><ArrowDownLeft size={15} aria-hidden="true" /> Record repayment</button></div>}
      <details className="lending-history"><summary>Repayment history ({summary.payments.length})</summary>{summary.payments.length ? summary.payments.map(payment => <div className="money-payment activity-received" key={payment.id}>
        <div className="lending-payment-heading"><p><span className="activity-status">Received</span><time dateTime={payment.date}>{payment.date}</time> · {accountLabel(payment.account)}</p>
          <MoneyActionMenu label={`Repayment actions: ${payment.date}`} actions={[
            { label: 'Edit repayment', icon: Pencil, onSelect: () => onEdit(payment) },
            { label: 'Delete repayment', icon: Trash2, danger: true, onSelect: () => onDelete(payment) },
          ]} />
        </div>
        <p>{paymentAmounts(payment)}</p>{payment.note && <p className="lending-note">{payment.note}</p>}
      </div>) : <p className="money-hint">No repayments yet.</p>}</details>
    </article>;
  };
  const fullHistory = group => {
    const ids = new Set(group.loans.map(l => l.id));
    const events = records.filter(r => r.kind === 'loan' ? ids.has(r.id) : r.kind === 'repayment' && ids.has(r.loanId))
      .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    return <details className="card borrower-history"><summary>Complete transaction history ({events.length})</summary>{events.map(event => {
      const received = event.kind === 'repayment';
      const loan = received ? group.loans.find(l => l.id === event.loanId) : event;
      return <div className={`borrower-event ${received ? 'activity-received' : ''}`} key={event.id}>
        <div className="borrower-event-title">{received ? <ArrowDownLeft size={17} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}<strong>{received ? 'Repayment received' : 'Money lent'}</strong><time dateTime={event.date}>{event.date}</time></div>
        <p>{currency} {fmt(received ? Number(event.principal) + Number(event.interest) : event.amount)} · {accountLabel(event.account)}{!received && event.account === 'card' ? ` · ${cards.find(c => c.id === event.cardId)?.name || 'Deleted card'}` : ''}</p>
        <p className="money-hint">{borrowerLoanLabel(loan, group.loans)}{received && <> · {paymentAmounts(event)}</>}</p>
        {event.note && <p className="lending-note">{event.note}</p>}
        <div className="money-actions"><button className="tx-edit" onClick={() => onEdit(event)}><Pencil size={14} aria-hidden="true" /> Edit entry</button></div>
      </div>;
    })}</details>;
  };
  const selectedTotal = selected ? totals(selected) : null;
  const filteredGroups = groups.filter(group => (mode === 'directory' || visibleLoans(group).length > 0) && group.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <div className="view money-view">
    <div className="dash-topbar">
      <div className="mheader-left"><button className="icon-btn" aria-label="Menu" onClick={onOpenMenu}><Menu size={16} /></button></div>
      <div className="mheader-center"><span className="mheader-title">Money Lent</span></div>
      <div className="mheader-right">{showQuickRefresh && <button className="bell-btn" onClick={onQuickRefresh} aria-label="Refresh"><RefreshCw size={16} /></button>}{onOpenNotifications && <button className="bell-btn" onClick={onOpenNotifications} aria-label="Notifications"><Bell size={16} />{notifCount > 0 && <span className="notif-badge">{notifCount}</span>}</button>}</div>
    </div>
    <div className="lending-scroll"><div className="lending-content">
      <div className="lending-page-heading">{selected && <button className="back-btn" aria-label="Back to borrowers" onClick={() => setSelectedId(null)}><ArrowLeft size={18} /></button>}<div className="page-hd"><div className="page-eyebrow">{selected ? 'Borrower' : mode === 'archive' ? 'Previous loans' : 'Lending'}</div><h1 className="page-title">{selected?.name || (mode === 'directory' ? 'Borrowers' : mode === 'archive' ? 'Archive' : 'Money Lent')}</h1></div>
        <button className="tx-edit archive-button" aria-label={mode === 'archive' ? 'Active loans' : 'Archive'} onClick={() => setMode(mode === 'archive' ? 'active' : 'archive')}><Archive size={15} aria-hidden="true" />{mode === 'archive' ? 'Active loans' : `Archive (${archiveCount})`}</button>
      </div>
      {error && <p className="money-error" role="alert">{error}</p>}
      <div className="borrower-toolbar">
        {!selected && <button className="tx-edit" onClick={() => { setMode(mode === 'directory' ? 'active' : 'directory'); setSearch(''); }}><Users size={16} />{mode === 'directory' ? 'Active loans' : 'Borrowers'}</button>}
        {selected && onSaveBorrower && <MoneyActionMenu label="Manage borrower" actions={[
          { label: 'Edit borrower', icon: Pencil, onSelect: () => setForm(selected) },
          onMergeBorrowers && groups.length > 1 && { label: 'Merge duplicate borrower', icon: Users, onSelect: () => setMerge(selected) },
        ]} />}
      </div>
      {selected ? <>
        {selected.loans.length > 0 && <Amounts currency={currency} className="card borrower-summary" items={[
          ['Total lent', selectedTotal.lent], ['Total principal outstanding', selectedTotal.outstanding],
          selectedTotal.principalReturned > 0 && ['Principal returned · all loans', selectedTotal.principalReturned],
          selectedTotal.interestReceived > 0 && ['Interest received · all loans', selectedTotal.interestReceived],
          selectedTotal.interestDue > 0 && ['Unpaid interest · all loans', selectedTotal.interestDue],
        ]} />}
        {selected.note && <p className="money-hint">{selected.note}</p>}
        <div className="section-hd borrower-section-title"><h2>{mode === 'archive' ? 'Archived loans' : mode === 'directory' ? 'All loans' : 'Active loans'}</h2><span className="count">{visibleLoans(selected).length}</span></div>
        {visibleLoans(selected).map(loan => loanCard(loan, selected))}
        {!visibleLoans(selected).length && <p className="money-hint">{!selected.loans.length ? 'No loans recorded for this borrower yet. Use New Entry → Expenses → Lend money to add the first loan.' : <>No {mode === 'archive' ? 'archived' : 'active'} loans. {mode !== 'archive' && 'Previous loans and repayments are available in Archive and the complete history below.'}</>}</p>}
        {selected.loans.length > 0 && fullHistory(selected)}
      </> : <>
        <p className="money-hint lending-intro">{mode === 'archive' ? 'Settled and archived loans. All history is retained.' : mode === 'directory' ? 'One record per person, across all lending dates.' : 'Active loans only. Settled loans move to Archive automatically.'}</p>
        {groups.length > 0 && <div className="tx-search-bar borrower-search"><Search size={14} className="tx-search-icon" aria-hidden="true" /><input type="search" aria-label="Find a borrower" className="tx-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a borrower…" /></div>}
        <div className="lending-borrower-grid">{filteredGroups.map(group => {
          const total = totals(group), visible = visibleLoans(group);
          return <article className="card borrower-card" key={group.id}><div className="lending-loan-heading"><h2>{group.name}</h2><span className="money-status">{visible.length} {mode === 'archive' ? 'archived' : mode === 'directory' ? '' : 'active'} {visible.length === 1 ? 'loan' : 'loans'}</span></div>
            <Amounts currency={currency} items={group.loans.length ? [["Principal outstanding", total.outstanding], total.interestDue > 0 && ['Unpaid interest', total.interestDue]] : []} />
            {group.loans.some(loan => loan.archived && summaryFor(loan).status !== 'Settled') && <p className="money-hint">Includes an archived balance that is still owed.</p>}
            <div className="money-actions"><button className="tx-edit" aria-label={`Open ${group.name}`} onClick={() => setSelectedId(group.id)}>View borrower & history</button></div>
          </article>;
        })}</div>
        {!filteredGroups.length && <div className="empty lending-empty"><div className="empty-icon"><Wallet size={26} strokeWidth={1.5} /></div><div className="empty-title">{search ? 'No matching borrowers' : mode === 'archive' ? 'No archived loans' : mode === 'directory' ? 'No borrowers yet' : 'No active loans'}</div><div className="empty-sub">{search ? 'Try another name or clear your search.' : mode === 'archive' ? 'Settled and inactive loans will appear here.' : 'Use New Entry → Expenses → Lend money to get started.'}</div></div>}
      </>}
    </div></div>
    {form && <BorrowerForm borrower={form === 'new' ? null : form} onClose={() => setForm(null)} onSave={async draft => { const id = await onSaveBorrower(draft); setForm(null); setSelectedId(id); if (!selected) setMode('directory'); }} />}
    {merge && <BorrowerMergeForm source={merge} borrowers={groups} onClose={() => setMerge(null)} onMerge={async (source, target) => { const id = await onMergeBorrowers(source, target); setMerge(null); setSelectedId(id); }} />}
  </div>;
}
