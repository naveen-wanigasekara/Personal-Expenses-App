import { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Sheet from './Sheet.jsx';
import AmountInput from './AmountInput.jsx';
import { accountLabel, loanSummary, todayLocal } from '../utils/money.js';

const displayAccount = account => account === 'bank' ? 'cash' : account;

export default function MoneyForm({ kind, editing, cards, records, initialLoanId, onClose, onSave, onBack }) {
  const isSavings = ['savings', 'withdrawal', 'transfer'].includes(kind);
  const legacyInternal = editing?.kind === 'transfer' && editing.from !== 'savings' && editing.to !== 'savings';
  const [draft, setDraft] = useState(() => ({
    borrower: '', amount: '', account: 'cash', cardId: cards[0]?.id || '', rate: 0,
    ratePeriod: 'monthly', interestBasis: 'original', arrangement: 'flexible', installmentMonths: 12,
    dueDate: '', date: todayLocal(), note: '', loanId: initialLoanId || records.find(r => r.kind === 'loan')?.id || '',
    principal: '', interest: '', from: kind === 'withdrawal' ? 'savings' : 'cash', to: kind === 'withdrawal' ? 'cash' : 'savings',
    ...editing, kind: isSavings ? 'transfer' : kind,
  }));
  const [hasInterest, setHasInterest] = useState(Number(editing?.rate) > 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const set = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  const field = (key, label, type = 'text', props = {}) => <label className="money-field"><span>{label}</span><input className="text-input" aria-label={label} type={type} value={draft[key]} onChange={e => set(key, e.target.value)} {...props} /></label>;
  const amount = (key, label) => <label className="money-field"><span>{label}</span><AmountInput aria-label={label} className="text-input" value={draft[key]} onChange={value => set(key, value)} placeholder="0.00" /></label>;
  const select = (key, label, options, account = false) => <label className="money-field"><span>{label}</span><select className="text-input" aria-label={label} value={account ? displayAccount(draft[key]) : draft[key]} onChange={e => set(key, e.target.value)}>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
  const accounts = ['cash', 'savings'].map(id => [id, accountLabel(id)]);
  const selected = records.find(r => r.kind === 'loan' && r.id === draft.loanId);
  const summary = selected ? loanSummary(selected, records.filter(r => r.id !== editing?.id), draft.date) : null;
  const showInterestPayment = Number(selected?.rate) > 0 || Number(draft.interest) > 0;
  const title = kind === 'loan' ? 'Money lent' : kind === 'repayment' ? 'Repayment received' : legacyInternal ? 'Transfer' : 'Savings';
  const submit = async event => {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    try {
      await onSave({ ...draft, amount: Number(draft.amount), principal: Number(draft.principal), interest: Number(draft.interest), rate: Number(draft.rate), installmentMonths: Number(draft.installmentMonths) });
    } catch (err) { setError(err.message || 'Could not save. Please try again.'); }
    finally { lock.current = false; setSaving(false); }
  };
  const valid = draft.kind === 'repayment' ? !!selected && (+draft.principal > 0 || +draft.interest > 0) : +draft.amount > 0 && (draft.kind !== 'loan' || draft.borrower.trim());
  return <Sheet title={`${editing ? 'Edit: ' : ''}${title}`} className="sheet-wide entry-sheet money-sheet" onClose={() => { if (!lock.current) onClose(); }}>
    {onBack && <button className="entry-back" type="button" onClick={onBack} disabled={saving}><ArrowLeft size={15} /> Entry types</button>}
    <form onSubmit={submit} className="entry-form money-form">
      <fieldset disabled={saving}>
        {draft.kind === 'loan' && <>
          {field('borrower', 'Borrower name', 'text', { required: true, maxLength: 120 })}
          {amount('amount', 'Amount lent')}
          {select('account', 'Funding source', [...accounts, ...(cards.length ? [['card', 'Credit card']] : [])], true)}
          {draft.account === 'card' && select('cardId', 'Credit card', [...cards.map(c => [c.id, c.name]), ...(draft.cardId && !cards.some(c => c.id === draft.cardId) ? [[draft.cardId, 'Previously selected card (deleted)']] : [])])}
          <label className="entry-check"><input type="checkbox" checked={hasInterest} onChange={e => { setHasInterest(e.target.checked); if (!e.target.checked) set('rate', 0); }} /> Charge interest</label>
          {hasInterest && <div className="money-fields">{field('rate', 'Interest rate (%)', 'number', { min: 0.01, max: 100, step: '0.01', required: true })}{select('ratePeriod', 'Rate period', [['monthly', 'Per month'], ['yearly', 'Per year']])}</div>}
        </>}
        {draft.kind === 'repayment' && <>
          {records.some(r => r.kind === 'loan') ? <>
            {select('loanId', 'Loan', records.filter(r => r.kind === 'loan').map(r => [r.id, `${r.borrower} · ${r.amount.toLocaleString()}`]))}
            {summary && <div className="entry-balance"><span>Still owed</span><strong>{summary.outstanding.toLocaleString()}</strong>{showInterestPayment && <small>Interest due: {summary.interestDue.toLocaleString()}</small>}</div>}
            <div className={showInterestPayment ? 'money-fields' : ''}>{amount('principal', 'Principal returned')}{showInterestPayment && amount('interest', 'Interest received')}</div>
            {select('account', 'Received into', accounts, true)}
          </> : <p className="entry-caption">No loans recorded yet. Record money lent first.</p>}
        </>}
        {draft.kind === 'transfer' && <>
          {legacyInternal ? <p className="entry-caption">Existing transfer within Cash / Bank. The combined balance is unchanged.</p> : <label className="money-field"><span>Action</span><select aria-label="Savings action" className="text-input" value={draft.from === 'savings' ? 'withdraw' : 'save'} onChange={e => setDraft(previous => ({ ...previous, from: e.target.value === 'withdraw' ? 'savings' : 'cash', to: e.target.value === 'withdraw' ? 'cash' : 'savings' }))}><option value="save">Add to savings</option><option value="withdraw">Withdraw from savings</option></select></label>}
          {amount('amount', 'Amount')}
          {!legacyInternal && <p className="entry-route">{accountLabel(draft.from)} <span aria-hidden="true">→</span> {accountLabel(draft.to)}</p>}
        </>}
        {field('date', draft.kind === 'loan' ? 'Date lent' : 'Date', 'date', { required: true, max: todayLocal() })}
        <details className="entry-details" open={editing && (draft.note || draft.dueDate || (draft.arrangement !== 'flexible' && draft.kind === 'loan')) ? true : undefined}>
          <summary>{draft.kind === 'loan' ? 'More options' : 'Add a note'}</summary>
          <div className="entry-extra">
            {draft.kind === 'loan' && <>
              {hasInterest && select('interestBasis', 'Interest calculation', [['original', 'On original amount'], ['remaining', 'On remaining principal']])}
              {select('arrangement', 'Repayment arrangement', [['flexible', 'Flexible'], ['single', 'Single payment'], ['interest-only', 'Interest only; principal separately'], ['installments', 'Monthly principal installments']])}
              {draft.arrangement === 'installments' && field('installmentMonths', 'Number of monthly installments', 'number', { min: 1, max: 120, step: 1, required: true })}
              {field('dueDate', 'Principal due date (optional)', 'date')}
              {hasInterest && <details className="entry-help"><summary>How interest works</summary><p className="entry-caption">Simple interest, due each completed month or year. No automatic compounding or partial-period charge. Card fees are separate.</p></details>}
            </>}
            {field('note', 'Note (optional)', 'text', { maxLength: 1000 })}
          </div>
        </details>
      </fieldset>
      <div className="entry-footer">{error && <p className="money-error" role="alert">{error}</p>}<button type="submit" className="save-btn" disabled={saving || !valid}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Record'}</button></div>
    </form>
  </Sheet>;
}
