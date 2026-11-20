import { useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { CurrencyCtx } from '../context.js';
import { SAVINGS_CATEGORY_ID } from '../constants/categories.js';
import { todayLocal } from '../utils/money.js';
import { fmtCompact } from '../utils/format.js';
import { loadLastCategory, saveLastCategory } from '../utils/storage.js';
import { validDate, validMonth } from '../utils/dateInput.js';
import { validInstallmentMonths } from '../utils/installments.js';
import Sheet from './Sheet.jsx';
import AmountInput from './AmountInput.jsx';
import EntryNavigation from './EntryNavigation.jsx';

export default function AddModal({ cards, onClose, onSave, onSaveInstallment, allExpCats, allIncCats,
  editing, userId, initialType = 'expense', initialTask, onBack, moneyEnabled = false, entryGroup, entryTask, onSubtypeChange }) {
  const CURRENCY = useContext(CurrencyCtx);
  const isEditing = !!editing;
  const [type, setType] = useState(editing?.type || initialType);
  const [account] = useState(editing?.account || 'cash');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [category, setCategory] = useState(editing?.category || '');
  const [note, setNote] = useState(editing?.note || '');
  const [date, setDate] = useState(() => editing?.date || todayLocal());
  const [cardId, setCardId] = useState(editing?.cardId || cards[0]?.id || '');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installLabel, setInstallLabel] = useState('');
  const [installMonths, setInstallMonths] = useState('12');
  const [installStartMonth, setInstallStartMonth] = useState(date.slice(0, 7));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savingRef = useRef(false);
  const amountUserEdited = useRef(false);
  const isCardType = type.startsWith('card-');
  const isExpense = type === 'expense' || type === 'card-purchase';
  const isCardAction = type === 'card-payment' || type === 'card-interest';
  const cats = (type === 'income' ? allIncCats : allExpCats).filter(c =>
    // Saving has its own entry, but existing categorized savings remain editable.
    isEditing || (c.id !== SAVINGS_CATEGORY_ID && c.id !== 'loan-interest'));

  useEffect(() => {
    if (isEditing) return;
    if (type === 'card-interest') { setCategory('card-interest'); return; }
    if (type === 'card-payment') { setCategory(''); return; }
    const last = userId ? loadLastCategory(userId, type) : null;
    setCategory(current => cats.some(c => c.id === current) ? current : cats.some(c => c.id === last) ? last : cats[0]?.id || 'other');
  }, [type, isEditing, allExpCats, allIncCats, userId]);
  useEffect(() => {
    if (!isEditing && category && !isCardAction && userId) saveLastCategory(userId, type, category);
  }, [category, type, userId, isEditing, isCardAction]);
  useEffect(() => {
    if (type !== 'card-payment' || isEditing || amountUserEdited.current) return;
    const card = cards.find(c => c.id === cardId);
    if (card?.currentBalance > 0) setAmount(card.currentBalance.toFixed(2));
  }, [type, cardId, cards, isEditing]);

  const changeType = next => {
    setType(next); setIsInstallment(false); amountUserEdited.current = false;
    if (next === 'card-payment') setCategory('');
    else if (next === 'card-interest') setCategory('card-interest');
    else {
      const options = (next === 'income' ? allIncCats : allExpCats).filter(c => isEditing || (c.id !== SAVINGS_CATEGORY_ID && c.id !== 'loan-interest'));
      setCategory(current => options.some(c => c.id === current) ? current : options[0]?.id || 'other');
    }
  };
  const valid = Number.isFinite(+amount) && +amount > 0 && (isInstallment
    ? installLabel.trim() && validInstallmentMonths(+installMonths) && validMonth(installStartMonth) && cardId
    : validDate(date) && (!isCardType || cardId) && (isCardAction || category));
  const submit = async event => {
    event.preventDefault();
    if (!valid || savingRef.current) return;
    savingRef.current = true; setSaving(true); setSaveError('');
    try {
      if (isInstallment) {
        await onSaveInstallment({ label: installLabel.trim(), monthlyAmount: +amount, totalMonths: +installMonths, startMonth: installStartMonth, category, cardId });
      } else {
        const tx = { type, amount: +amount, note, date, account: isCardType && type !== 'card-payment' ? null : account };
        if (type !== 'card-payment') tx.category = type === 'card-interest' ? 'card-interest' : category;
        if (isCardType) tx.cardId = cardId;
        await onSave(tx);
      }
    } catch (error) { setSaveError(error.message || 'Could not save. Please try again.'); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const selectedCard = cards.find(c => c.id === cardId);
  const planTotal = +amount * +installMonths;
  const availableCredit = selectedCard ? +selectedCard.limit - selectedCard.currentBalance - (selectedCard.futureInstallmentTotal || 0) : 0;
  const title = isEditing ? 'Edit entry' : entryGroup ? (entryGroup === 'income' ? 'Income' : 'Expenses') : initialTask === 'credit-card' ? 'Credit card' : type === 'income' ? 'Income' : isCardAction ? 'Credit card' : 'Expense';
  const close = () => { if (!savingRef.current) onClose(); };
  return <Sheet title={title} onClose={close} className="sheet-wide entry-sheet">
    {entryGroup && <EntryNavigation group={entryGroup} task={entryTask} onChange={onSubtypeChange} onBack={onBack} moneyEnabled={moneyEnabled} hasCards={cards.length > 0} disabled={saving} />}
    {!entryGroup && onBack && <button className="entry-back" type="button" onClick={onBack} disabled={saving}><ArrowLeft size={15} /> Entry types</button>}
    <form className="entry-form" onSubmit={submit}>
      <fieldset disabled={saving}>
        {isEditing && <label className="money-field"><span>Entry type</span><select aria-label="Entry type" className="text-input" value={type} onChange={e => changeType(e.target.value)}>
          <option value="income">Income</option><option value="expense">Expense · Cash / Bank</option>
          {cards.length > 0 && <><option value="card-purchase">Expense · Credit card</option><option value="card-payment">Card payment</option><option value="card-interest">Card interest & fees</option></>}
        </select></label>}
        {isCardAction && !isEditing && !entryGroup && <label className="money-field"><span>Action</span><select aria-label="Card action" className="text-input" value={type} onChange={e => changeType(e.target.value)}><option value="card-payment">Pay card balance</option><option value="card-interest">Add interest or fees</option></select></label>}
        <label className="money-field"><span>{isInstallment ? 'Monthly installment amount' : 'Amount'}</span><div className="amount-input"><span className="amt-cur">{CURRENCY}</span><AmountInput aria-label={isInstallment ? 'Monthly installment amount' : 'Amount'} value={amount} onChange={v => {amountUserEdited.current = true; setAmount(v);}} placeholder="0.00" /></div></label>
        {isExpense && <label className="money-field"><span>Pay with</span><select aria-label="Pay with" className="text-input" value={type === 'card-purchase' ? 'card' : 'cash'} onChange={e => changeType(e.target.value === 'card' ? 'card-purchase' : 'expense')}><option value="cash">Cash / Bank</option>{cards.length > 0 && <option value="card">Credit card</option>}</select></label>}
        {isCardType && <label className="money-field"><span>Credit card</span><select aria-label="Credit card" className="text-input" value={cardId} onChange={e => setCardId(e.target.value)}>{cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}{cardId && !cards.some(c => c.id === cardId) && <option value={cardId}>Previously selected card (deleted)</option>}</select></label>}
        {!isCardAction && <label className="money-field"><span>Category</span><select aria-label="Category" className="text-input" value={category} onChange={e => setCategory(e.target.value)}>{cats.map(c => <option key={c.id} value={c.id}>{c.id === 'loan' ? `${c.label} (you pay)` : c.label}</option>)}</select></label>}
        {type === 'card-purchase' && !isEditing && <label className="entry-check"><input type="checkbox" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} /> Split into installments</label>}
        {isInstallment ? <>
          <label className="money-field"><span>Description</span><input className="text-input" aria-label="Installment description" value={installLabel} onChange={e => setInstallLabel(e.target.value)} required /></label>
          <div className="money-fields"><label className="money-field"><span>Months</span><input className="text-input" type="number" aria-label="Number of months" value={installMonths} onChange={e => setInstallMonths(e.target.value)} min="2" max="120" required /></label><label className="money-field"><span>Start month</span><input type="month" className="text-input" aria-label="Start month" value={installStartMonth} onChange={e => setInstallStartMonth(e.target.value)} required /></label></div>
          {+amount > 0 && <p className="entry-caption">Total: {CURRENCY} {fmtCompact(planTotal)}</p>}
          {selectedCard?.limit && planTotal > availableCredit && <p className="money-error">Plan exceeds available credit of {CURRENCY} {fmtCompact(availableCredit)}.</p>}
        </> : <label className="money-field"><span>Date</span><input className="text-input" type="date" aria-label="Date" value={date} onChange={e => setDate(e.target.value)} required /></label>}
        <details className="entry-details" open={note ? true : undefined}><summary>Add a note</summary><label className="money-field"><span>Note (optional)</span><input className="text-input" aria-label="Note" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional description" /></label></details>
        {isCardAction && <p className="entry-caption">{type === 'card-payment' ? 'Paid from Cash / Bank. Reduces your card balance.' : 'Adds to your card balance and spending.'}</p>}
        {isEditing && editing.installmentId && <p className="entry-caption"><AlertTriangle size={13} /> Updates this entry, not the whole installment plan.</p>}
      </fieldset>
      <div className="entry-footer">{saveError && <p className="money-error" role="alert">{saveError}</p>}<button className="save-btn" type="submit" disabled={!valid || saving}>{saving ? 'Saving…' : isEditing ? 'Save changes' : isInstallment ? 'Create plan' : 'Record'}</button></div>
    </form>
  </Sheet>;
}
