import { ArrowLeft } from 'lucide-react';
import { ENTRY_TYPES } from '../constants/entryTypes.js';
import { canLeaveDrafts } from '../utils/draftGuard.js';

export default function EntryNavigation({ group, task, onChange, onBack, moneyEnabled, hasCards, disabled }) {
  return <div className={`entry-navigation entry-navigation-${group}`}>
    {onBack && <button className="entry-back" type="button" onClick={() => {if (canLeaveDrafts()) onBack();}} disabled={disabled}><ArrowLeft size={15} /> Income / Expenses</button>}
    <p className="entry-intro">{group === 'income' ? 'Money received' : 'Money paid or spent'}</p>
    <label className="money-field"><span>{group === 'income' ? 'Income type' : 'Expense type'}</span>
      <select className="text-input" aria-label={group === 'income' ? 'Income type' : 'Expense type'} value={task} onChange={e => {if (canLeaveDrafts()) onChange(e.target.value);}} disabled={disabled}>
        {ENTRY_TYPES[group].map(type => <option key={type.id} value={type.id} disabled={(type.needsMoney && !moneyEnabled) || (type.needsCard && !hasCards)}>{type.label}</option>)}
      </select>
    </label>
  </div>;
}
