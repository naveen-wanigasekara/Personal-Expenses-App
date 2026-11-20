import { useRef, useState } from 'react';
import Sheet from './Sheet.jsx';

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
  return <Sheet title={borrower ? 'Edit borrower' : 'Add borrower'} className="entry-sheet" onClose={() => { if (!lock.current) onClose(); }}>
    <form className="entry-form" onSubmit={submit}>
      <fieldset disabled={saving}>
        <label className="money-field"><span>Name</span><input className="text-input" aria-label="Borrower name" value={name} onChange={e => setName(e.target.value)} maxLength={120} required /></label>
        <label className="money-field"><span>Note (optional)</span><input className="text-input" aria-label="Borrower note" value={note} onChange={e => setNote(e.target.value)} maxLength={1000} placeholder="A short reminder to identify this person" /></label>
        <p className="entry-caption">Use this borrower for every loan to the same person.</p>
      </fieldset>
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
      <fieldset disabled={saving}>
        <p className="entry-caption">Move the history under <strong>{source.name}</strong> into the borrower you select. Loan amounts, rates and repayments stay unchanged.</p>
        <label className="money-field"><span>Keep borrower</span><select className="text-input" aria-label="Keep borrower" value={target} onChange={e => setTarget(e.target.value)} required><option value="" disabled>Choose the same person’s other record</option>{targets.map(b => <option value={b.id} key={b.id}>{b.name}</option>)}</select></label>
        <p className="entry-caption">Only merge records that belong to the same person.</p>
      </fieldset>
      <div className="entry-footer">{error && <p className="money-error" role="alert">{error}</p>}<button className="save-btn" disabled={saving || !target}>{saving ? 'Merging…' : 'Merge histories'}</button></div>
    </form>
  </Sheet>;
}
