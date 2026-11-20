import { useContext, useEffect, useMemo, useState } from 'react';
import { Archive, ArrowLeft, Menu, Plus, Users, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { CurrencyCtx } from '../context.js';
import { accountLabel, loanSummary, roundMoney, todayLocal } from '../utils/money.js';
import { borrowerGroups, borrowerLoanLabel } from '../utils/borrowers.js';
import { fmt } from '../utils/format.js';
import BorrowerForm, { BorrowerMergeForm } from './BorrowerForm.jsx';

export default function MoneyLentView({ records, cards, onNew, onRepay, onEdit, onDelete,
  onSaveBorrower, onMergeBorrowers, onArchive, onModalChange, onOpenMenu }) {
  const currency = useContext(CurrencyCtx);
  const [mode, setMode] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null), [merge, setMerge] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { onModalChange?.(!!form || !!merge); return () => onModalChange?.(false); }, [form, merge, onModalChange]);
  const groups = useMemo(() => borrowerGroups(records), [records]);
  const through = todayLocal();
  const summaryById = useMemo(() => new Map(records.filter(r => r.kind === 'loan').map(loan => [loan.id, loanSummary(loan, records, through)])), [records, through]);
  const summaryFor = loan => summaryById.get(loan.id);
  const selected = groups.find(g => g.id === selectedId);
  const archiveCount = records.filter(r => r.kind === 'loan' && (r.archived || summaryFor(r).status === 'Settled')).length;
  const isArchived = loan => loan.archived || summaryFor(loan).status === 'Settled';
  const visibleLoans = group => group.loans.filter(loan => mode === 'directory' || isArchived(loan) === (mode === 'archive'));
  const summaries = group => group.loans.map(loan => ({ loan, ...summaryFor(loan) }));
  const totals = group => {
    const rows = summaries(group), sum = field => roundMoney(rows.reduce((value, row) => value + Number(field === 'lent' ? row.loan.amount : row[field]), 0));
    return { lent: sum('lent'), outstanding: sum('outstanding'), principalReturned: sum('principalReturned'), interestReceived: sum('interestReceived'), interestDue: sum('interestDue') };
  };
  const run = async action => {
    if (busy) return; setBusy(true); setError('');
    try { await action(); } catch (err) { setError(err.message || 'Could not save. Please try again.'); } finally { setBusy(false); }
  };
  const status = summary => <span className={`money-status ${summary.status === 'Settled' ? 'settled' : summary.status === 'Payment due' ? 'due' : ''}`}>{summary.status}</span>;
  const loanCard = (loan, group) => {
    const summary = summaryFor(loan), archived = isArchived(loan);
    const card = cards.find(c => c.id === loan.cardId)?.name || 'Deleted credit card';
    return <article className={`card money-loan ${summary.status === 'Settled' ? 'loan-settled' : ''}`} key={loan.id}>
      <div className="money-heading"><h3>{borrowerLoanLabel(loan, group.loans)}</h3>{status(summary)}{loan.archived && summary.status !== 'Settled' && <span className="money-status">Archived · balance still owed</span>}</div>
      <p className="money-hint">{loan.account === 'card' ? card : accountLabel(loan.account)} · {Number(loan.rate) === 0 ? 'Interest-free' : `${loan.rate}% ${loan.ratePeriod} · ${loan.interestBasis === 'remaining' ? 'remaining principal' : 'original amount'}`}</p>
      <dl className="money-stats"><div><dt>Principal outstanding</dt><dd>{currency} {fmt(summary.outstanding)}</dd></div><div><dt>Principal returned</dt><dd>{currency} {fmt(summary.principalReturned)}</dd></div><div><dt>Interest received</dt><dd>{currency} {fmt(summary.interestReceived)}</dd></div><div><dt>Unpaid interest</dt><dd>{currency} {fmt(summary.interestDue)}</dd></div>{summary.interestCredit > 0 && <div><dt>Interest paid in advance</dt><dd>{currency} {fmt(summary.interestCredit)}</dd></div>}</dl>
      <p className="money-hint">{loan.arrangement === 'installments' ? `${loan.installmentMonths} monthly principal installments` : `Repayment: ${loan.arrangement.replace('-', ' ')}`}{loan.dueDate ? ` · Principal due ${loan.dueDate}` : ''}{summary.nextInterestDate ? ` · Next interest ${summary.nextInterestDate}` : ''}{summary.nextPrincipalDate ? ` · Next principal ${summary.nextPrincipalDate}` : ''}</p>
      {summary.principalDue > 0 && <p className="money-error">Principal due: {currency} {fmt(summary.principalDue)}</p>}
      {loan.note && <p>{loan.note}</p>}
      <div className="money-actions">
        {summary.status !== 'Settled' && <button className="text-btn" onClick={() => onRepay(loan.id, group.id)}>Record repayment</button>}
        <button className="text-btn" onClick={() => onEdit(loan)}>Edit loan</button>
        {onArchive && summary.status !== 'Settled' && <button className="text-btn" disabled={busy} onClick={() => run(() => onArchive(loan, !archived))}>{archived ? 'Restore to active' : 'Archive inactive loan'}</button>}
      </div>
      <details><summary>Repayment history ({summary.payments.length})</summary>{summary.payments.length ? summary.payments.map(payment => <div className="money-payment activity-received" key={payment.id}>
        <p><span className="activity-status">Received</span> {payment.date} · {accountLabel(payment.account)}</p><p>Principal {currency} {fmt(payment.principal)} · Interest {currency} {fmt(payment.interest)}</p>{payment.note && <p>{payment.note}</p>}
        <div className="money-actions"><button className="text-btn" onClick={() => onEdit(payment)}>Edit repayment</button><button className="text-btn" onClick={() => onDelete(payment)}>Delete repayment</button></div>
      </div>) : <p className="money-hint">No repayments yet.</p>}</details>
      <details className="loan-more"><summary>More actions</summary><button className="text-btn" onClick={() => onDelete(loan)}>Delete loan</button></details>
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
        <div className="borrower-event-title">{received ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}<strong>{received ? 'Repayment received' : 'Money lent'}</strong><span>{event.date}</span></div>
        <p>{currency} {fmt(received ? Number(event.principal) + Number(event.interest) : event.amount)} · {accountLabel(event.account)}{!received && event.account === 'card' ? ` · ${cards.find(c => c.id === event.cardId)?.name || 'Deleted card'}` : ''}</p>
        <p className="money-hint">{borrowerLoanLabel(loan, group.loans)}{received ? ` · Principal ${currency} ${fmt(event.principal)} · Interest ${currency} ${fmt(event.interest)}` : ''}</p>
        {event.note && <p>{event.note}</p>}
        <div className="money-actions"><button className="text-btn" onClick={() => onEdit(event)}>Edit entry</button></div>
      </div>;
    })}</details>;
  };
  const selectedTotal = selected ? totals(selected) : null;
  const archiveButton = <button className="text-btn archive-button" aria-label={mode === 'archive' ? 'Active loans' : 'Archive'} onClick={() => setMode(mode === 'archive' ? 'active' : 'archive')}><Archive size={15} /> {mode === 'archive' ? 'Active loans' : `Archive (${archiveCount})`}</button>;
  return <div className="view money-view">
    <div className="money-heading">{selected ? <button className="icon-btn" aria-label="Back to borrowers" onClick={() => setSelectedId(null)}><ArrowLeft size={18} /></button> : <button className="icon-btn" aria-label="Menu" onClick={onOpenMenu}><Menu size={18} /></button>}<h1>{selected?.name || (mode === 'directory' ? 'Borrowers' : mode === 'archive' ? 'Money Lent · Archive' : 'Money Lent')}</h1>{archiveButton}</div>
    {error && <p className="money-error" role="alert">{error}</p>}
    <div className="borrower-toolbar"><button className="text-btn" onClick={() => onNew(selected?.id)}><Plus size={16} /> Lend money</button>
      {!selected && <button className="text-btn" onClick={() => { setMode(mode === 'directory' ? 'active' : 'directory'); setSearch(''); }}><Users size={16} /> {mode === 'directory' ? 'Active loans' : 'Borrowers'}</button>}
      {onSaveBorrower && <button className="text-btn" onClick={() => setForm(selected || 'new')}>{selected ? 'Edit borrower' : 'Add borrower'}</button>}
    </div>
    {selected ? <>
      <dl className="card money-stats borrower-summary">{[['lent', 'Total lent'], ['principalReturned', 'Principal returned · all loans'], ['outstanding', 'Total principal outstanding'], ['interestReceived', 'Interest received · all loans'], ['interestDue', 'Unpaid interest · all loans']].map(([field, label]) => <div key={field}><dt>{label}</dt><dd>{currency} {fmt(selectedTotal[field])}</dd></div>)}</dl>
      {selected.note && <p className="money-hint">{selected.note}</p>}
      <h2 className="borrower-section-title">{mode === 'archive' ? 'Archived loans' : mode === 'directory' ? 'All loans' : 'Active loans'}</h2>
      {visibleLoans(selected).map(loan => loanCard(loan, selected))}
      {!visibleLoans(selected).length && <p className="money-hint">No {mode === 'archive' ? 'archived' : 'active'} loans. {mode !== 'archive' && 'Previous loans and repayments are available in Archive and the complete history below.'}</p>}
      {fullHistory(selected)}
      {onMergeBorrowers && groups.length > 1 && <details className="borrower-manage"><summary>Manage borrower</summary><button className="text-btn" onClick={() => setMerge(selected)}>Merge duplicate borrower</button></details>}
    </> : <>
      <p className="money-hint">{mode === 'archive' ? 'Settled and archived loans. All history is retained.' : mode === 'directory' ? 'One record per person, across all lending dates.' : 'Active loans only. Settled loans move to Archive automatically.'}</p>
      {groups.length > 0 && <label className="money-field borrower-search"><span>Find a borrower</span><input type="search" aria-label="Find a borrower" className="text-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name" /></label>}
      {groups.filter(group => (mode === 'directory' || visibleLoans(group).length > 0) && group.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).map(group => {
        const total = totals(group), visible = visibleLoans(group);
        return <article className="card borrower-card" key={group.id}><div className="money-heading"><h2>{group.name}</h2><span className="money-status">{visible.length} {mode === 'archive' ? 'archived' : mode === 'directory' ? '' : 'active'} {visible.length === 1 ? 'loan' : 'loans'}</span></div>
          <dl className="money-stats"><div><dt>Principal outstanding</dt><dd>{currency} {fmt(total.outstanding)}</dd></div><div><dt>Unpaid interest</dt><dd>{currency} {fmt(total.interestDue)}</dd></div></dl>
          {group.loans.some(loan => loan.archived && summaryFor(loan).status !== 'Settled') && <p className="money-hint">Includes an archived balance that is still owed.</p>}
          <div className="money-actions"><button className="text-btn" aria-label={`Open ${group.name}`} onClick={() => setSelectedId(group.id)}>View borrower & history</button><button className="text-btn" onClick={() => onNew(group.id)}>Lend again</button></div>
        </article>;
      })}
      {!groups.some(group => (mode === 'directory' || visibleLoans(group).length > 0) && group.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) && <div className="card"><p>{search ? 'No matching borrowers.' : mode === 'archive' ? 'No archived loans.' : mode === 'directory' ? 'No borrowers registered yet.' : 'No active loans.'}</p></div>}
    </>}
    {form && <BorrowerForm borrower={form === 'new' ? null : form} onClose={() => setForm(null)} onSave={async draft => { const id = await onSaveBorrower(draft); setForm(null); setSelectedId(id); if (!selected) setMode('directory'); }} />}
    {merge && <BorrowerMergeForm source={merge} borrowers={groups} onClose={() => setMerge(null)} onMerge={async (source, target) => { const id = await onMergeBorrowers(source, target); setMerge(null); setSelectedId(id); }} />}
  </div>;
}
