import { useRef, useState } from 'react';
import Sheet from './Sheet.jsx';
import { useAsyncSave } from '../hooks/useAsyncSave.js';

export default function BorrowerForm({ borrower, onSave, onClose }) {
  const [name, setName] = useState(borrower?.name || '');
  const [note, setNote] = useState(borrower?.note || '');
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const submit = async event => {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setSaving(true); setError('');
    try { await onSave({ id: borrower?.id, name, note }); }
    catch (err) { setError(err.message || 'Could not save borrower.'); }
    finally { lock.current = false; setSaving(false); }
  };
  return <Sheet protectDraft busy={saving} title={borrower ? 'Edit borrower' : 'Add borrower'} className="entry-sheet" onClose={() => { if (!lock.current) onClose(); }}>
    <form className="entry-form" onSubmit={submit}>
      <div className="entry-scroll" role="region" aria-label="Borrower details">
        <fieldset disabled={saving}>
          <label className="money-field"><span>Name</span><input className="text-input" aria-label="Borrower name" value={name} onChange={e => setName(e.target.value)} maxLength={120} required /></label>
          <label className="money-field"><span>Note (optional)</span><input className="text-input" aria-label="Borrower note" value={note} onChange={e => setNote(e.target.value)} maxLength={1000} placeholder="A short reminder to identify this person" /></label>
          <p className="entry-caption">Use this borrower for every loan to the same person.</p>
        </fieldset>
      </div>
      <div className="entry-footer">{error && <p className="money-error" role="alert">{error}</p>}<button className="save-btn" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save borrower'}</button></div>
    </form>
  </Sheet>;
}

export function BorrowerMergeForm({ source, borrowers, onMerge, onClose }) {
  const targets = borrowers.filter(b => b.id !== source.id);
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  return <Sheet title="Merge duplicate borrowers" className="entry-sheet" onClose={() => { if (!lock.current) onClose(); }}>
    <form className="entry-form" onSubmit={async event => {
      event.preventDefault(); if (!target || lock.current) return;
      lock.current = true; setSaving(true); setError('');
      try { await onMerge(source.id, target); } catch (err) { setError(err.message || 'Could not merge borrowers.'); }
      finally { lock.current = false; setSaving(false); }
    }}>
      <div className="entry-scroll" role="region" aria-label="Borrower details">
        <fieldset disabled={saving}>
          <p className="entry-caption">Move the history under <strong>{source.name}</strong> into the borrower you select. Loan amounts, rates and repayments stay unchanged.</p>
          <label className="money-field"><span>Keep borrower</span><select className="text-input" aria-label="Keep borrower" value={target} onChange={e => setTarget(e.target.value)} required><option value="" disabled>Choose the same person’s other record</option>{targets.map(b => <option value={b.id} key={b.id}>{b.name}</option>)}</select></label>
          <p className="entry-caption">Only merge records that belong to the same person.</p>
        </fieldset>
      </div>
      <div className="entry-footer">{error && <p className="money-error" role="alert">{error}</p>}<button className="save-btn" disabled={saving || !target}>{saving ? 'Merging…' : 'Merge histories'}</button></div>
    </form>
  </Sheet>;
}

export function BorrowerDeleteForm({ borrower, onDelete, onClose }) {
  const { saving, saveError, runSave } = useAsyncSave();
  const hasHistory = borrower.loans.length > 0;
  return <Sheet title="Delete borrower" className="entry-sheet" onClose={() => { if (!saving) onClose(); }}>
    <form className="entry-form" onSubmit={event => {
      event.preventDefault();
      if (!hasHistory) runSave(() => onDelete(borrower.id));
    }}>
      <div className="entry-scroll" role="region" aria-label="Delete borrower details">
        <fieldset disabled={saving}>
          <p className="borrower-delete-message">{hasHistory ? <><strong>{borrower.name}</strong> has loan history and cannot be deleted. This protects your loans, repayments and balances, including settled and archived loans.</> : <>Delete <strong>{borrower.name}</strong>? This borrower has no loan history. This action cannot be undone.</>}</p>
          {hasHistory && <p className="entry-caption">Use Archive on individual loans to keep inactive loans out of the active list.</p>}
        </fieldset>
      </div>
      <div className="entry-footer">
        {saveError && <p className="money-error" role="alert">{saveError}</p>}
        <div className="borrower-delete-actions">
          <button type="button" className="tx-edit" disabled={saving} onClick={onClose}>{hasHistory ? 'Got it' : 'Cancel'}</button>
          {!hasHistory && <button type="submit" className="tx-del" disabled={saving}>{saving ? 'Deleting…' : 'Delete borrower'}</button>}
        </div>
      </div>
    </form>
  </Sheet>;
}
