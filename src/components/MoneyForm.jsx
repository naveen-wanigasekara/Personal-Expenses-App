import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Sheet from './Sheet.jsx';
import AmountInput from './AmountInput.jsx';
import EntryNavigation from './EntryNavigation.jsx';
import { CurrencyCtx } from '../context.js';
import { borrowerGroups, borrowerLoanLabel } from '../utils/borrowers.js';
import { accountLabel, loanSummary, todayLocal } from '../utils/money.js';

const displayAccount = account => account === 'bank' ? 'cash' : account;

export default function MoneyForm({ kind, editing, cards, records, initialLoanId, initialBorrowerId,
  onClose, onSave, onBack, entryGroup, entryTask, onSubtypeChange, moneyEnabled = true }) {
  const currency = useContext(CurrencyCtx);
  const groups = useMemo(() => borrowerGroups(records), [records]);
  const balanceDate = todayLocal();
  const editedLoanId = editing?.kind === 'repayment' ? editing.loanId : null;
  // Only collect against loans that still owe principal or accrued interest.
  // Keep the repayment being edited available even when it settled its loan.
  const repaymentGroups = useMemo(() => groups.map(group => ({ ...group, loans: group.loans.filter(loan => {
    if (loan.id === editedLoanId) return true;
    const balance = loanSummary(loan, records, balanceDate);
    return balance.outstanding > 0 || balance.interestDue > 0;
  }) })).filter(group => group.loans.length > 0), [groups, records, balanceDate, editedLoanId]);
  const eligibleGroups = kind === 'repayment' ? repaymentGroups : groups;
  const requestedLoanId = editing?.kind === 'loan' ? editing.id : editing?.loanId || initialLoanId;
  const initialGroup = eligibleGroups.find(g => g.id === initialBorrowerId || g.loans.some(l => l.id === requestedLoanId))
    || (kind === 'repayment' ? repaymentGroups[0] : null);
  const initialRepaymentLoanId = initialGroup?.loans.find(loan => loan.id === requestedLoanId)?.id || initialGroup?.loans[0]?.id || '';
  const [borrowerSelection, setBorrowerSelection] = useState(initialGroup?.id || (kind === 'repayment' ? '' : groups.length ? '' : '__new'));
  const isSavings = ['savings', 'withdrawal', 'transfer'].includes(kind);
  const legacyInternal = editing?.kind === 'transfer' && editing.from !== 'savings' && editing.to !== 'savings';
  const [draft, setDraft] = useState(() => ({
    borrower: '', amount: '', account: 'cash', cardId: cards[0]?.id || '', rate: 0,
    ratePeriod: 'monthly', interestBasis: 'original', arrangement: 'flexible', installmentMonths: 12,
    dueDate: '', date: todayLocal(), note: '', loanId: initialRepaymentLoanId,
    principal: '', interest: '', from: kind === 'withdrawal' ? 'savings' : 'cash', to: kind === 'withdrawal' ? 'cash' : 'savings',
    ...editing, borrower: initialGroup?.name || editing?.borrower || '', borrowerId: initialGroup?.id || editing?.borrowerId || '',
    kind: isSavings ? 'transfer' : kind,
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
  const chosenGroup = eligibleGroups.find(g => g.id === borrowerSelection);
  const fallbackGroup = chosenGroup || repaymentGroups[0];
  const fallbackLoanId = fallbackGroup?.loans.find(loan => loan.id === draft.loanId)?.id || fallbackGroup?.loans[0]?.id || '';
  useEffect(() => {
    if (kind !== 'repayment' || (borrowerSelection === (fallbackGroup?.id || '') && draft.loanId === fallbackLoanId)) return;
    // Clear entered amounts if refreshed balances invalidate the selection.
    setBorrowerSelection(fallbackGroup?.id || '');
    setDraft(previous => ({ ...previous, borrowerId: fallbackGroup?.id || '', borrower: fallbackGroup?.name || '', loanId: fallbackLoanId, principal: '', interest: '' }));
  }, [kind, borrowerSelection, draft.loanId, fallbackGroup?.id, fallbackGroup?.name, fallbackLoanId]);
  const selected = records.find(r => r.kind === 'loan' && r.id === draft.loanId);
  const summary = selected ? loanSummary(selected, records.filter(r => r.id !== editing?.id), draft.date) : null;
  const showInterestPayment = Number(selected?.rate) > 0 || Number(draft.interest) > 0;
  const selectBorrower = value => {
    setBorrowerSelection(value);
    const group = eligibleGroups.find(g => g.id === value);
    setDraft(previous => ({ ...previous, borrowerId: group?.id || '', borrower: group?.name || '',
      ...(kind === 'repayment' ? { loanId: group?.loans[0]?.id || '', principal: '', interest: '' } : {}) }));
  };
  const borrowerPicker = repayment => <label className="money-field"><span>Borrower</span>
    <select className="text-input" aria-label="Borrower" value={borrowerSelection} onChange={e => selectBorrower(e.target.value)} required>
      <option value="" disabled>Choose a borrower</option>
      {(repayment ? repaymentGroups : groups).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      {!repayment && <option value="__new">+ New borrower</option>}
    </select>
  </label>;
  const subtypeTitle = kind === 'loan' ? 'Lend money' : kind === 'repayment' ? 'Repayment received' : legacyInternal ? 'Transfer' : 'Savings';
  const title = entryGroup ? entryGroup === 'income' ? 'Income' : 'Expenses' : `${editing ? 'Edit: ' : ''}${subtypeTitle}`;
  const submit = async event => {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    try {
      await onSave({ ...draft, amount: Number(draft.amount), principal: Number(draft.principal), interest: Number(draft.interest), rate: Number(draft.rate), installmentMonths: Number(draft.installmentMonths) });
    } catch (err) { setError(err.message || 'Could not save. Please try again.'); }
    finally { lock.current = false; setSaving(false); }
  };
  const valid = draft.kind === 'repayment' ? !!chosenGroup?.loans.some(loan => loan.id === selected?.id) && (+draft.principal > 0 || +draft.interest > 0)
    : +draft.amount > 0 && (draft.kind !== 'loan' || draft.borrower.trim());
  return <Sheet title={title} protectDraft className="sheet-wide entry-sheet money-sheet" onClose={() => { if (!lock.current) onClose(); }}>
    <form onSubmit={submit} className="entry-form money-form">
      <div className="entry-scroll" role="region" aria-label="Entry details">
      {entryGroup && <EntryNavigation group={entryGroup} task={entryTask} onChange={onSubtypeChange} onBack={onBack} moneyEnabled={moneyEnabled} hasCards={cards.length > 0} disabled={saving} />}
        <fieldset disabled={saving}>
          {draft.kind === 'loan' && <>
            {borrowerPicker(false)}
            {borrowerSelection === '__new' && field('borrower', 'Borrower name', 'text', { required: true, maxLength: 120 })}
            {amount('amount', 'Amount lent')}
            {select('account', 'Funding source', [...accounts, ...(cards.length ? [['card', 'Credit card']] : [])], true)}
            {draft.account === 'card' && select('cardId', 'Credit card', [...cards.map(c => [c.id, c.name]), ...(draft.cardId && !cards.some(c => c.id === draft.cardId) ? [[draft.cardId, 'Previously selected card (deleted)']] : [])])}
            <label className="entry-check"><input type="checkbox" checked={hasInterest} onChange={e => { setHasInterest(e.target.checked); if (!e.target.checked) set('rate', 0); }} /> Charge interest</label>
            {hasInterest && <div className="money-fields">{field('rate', 'Interest rate (%)', 'number', { min: 0.01, max: 100, step: '0.01', required: true })}{select('ratePeriod', 'Rate period', [['monthly', 'Per month'], ['yearly', 'Per year']])}</div>}
          </>}
          {draft.kind === 'repayment' && <>
            {repaymentGroups.length ? <>
              {borrowerPicker(true)}
              {select('loanId', 'Loan', (chosenGroup?.loans || []).map(loan => [loan.id, `${borrowerLoanLabel(loan, groups.find(group => group.id === chosenGroup.id)?.loans || chosenGroup.loans)}${loan.note ? ` · ${loan.note.slice(0,60)}` : ''}`]))}
              {summary && <div className="entry-balance"><span>Principal still owed</span><strong>{currency} {summary.outstanding.toLocaleString()}</strong>{showInterestPayment && <small>Interest due: {currency} {summary.interestDue.toLocaleString()}</small>}</div>}
              <div className={showInterestPayment ? 'money-fields' : ''}>{amount('principal', 'Principal returned')}{showInterestPayment && amount('interest', 'Interest received')}</div>
              {select('account', 'Received into', accounts, true)}
              <p className="entry-caption">Only interest counts as income earned.{selected?.account === 'card' && ' Cash received does not pay your credit card. Record Expenses → Pay credit card when you pay the bank.'}</p>
            </> : <p className="entry-caption">{records.some(record => record.kind === 'loan') ? 'No outstanding loans. All recorded loans are fully settled.' : 'No loans recorded yet. Record Expenses → Lend money first.'}</p>}
          </>}
          {draft.kind === 'transfer' && <>
            {legacyInternal ? <p className="entry-caption">Existing transfer within Cash. The combined balance is unchanged.</p>
              : !entryGroup && <label className="money-field"><span>Action</span><select aria-label="Savings action" className="text-input" value={draft.from === 'savings' ? 'withdraw' : 'save'} onChange={e => setDraft(previous => ({ ...previous, from: e.target.value === 'withdraw' ? 'savings' : 'cash', to: e.target.value === 'withdraw' ? 'cash' : 'savings' }))}><option value="save">Add to savings</option><option value="withdraw">Withdraw from savings</option></select></label>}
            {amount('amount', 'Amount')}
            {!legacyInternal && <p className="entry-caption">Moves your own money; excluded from income earned and spending.</p>}
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
      </div>
      <div className="entry-footer">{error && <p className="money-error" role="alert">{error}</p>}<button type="submit" className="save-btn" disabled={saving || !valid}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Record'}</button></div>
    </form>
  </Sheet>;
}
