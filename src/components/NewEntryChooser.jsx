import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Sheet from './Sheet.jsx';

export default function NewEntryChooser({ onChoose, onClose }) {
  return <Sheet title="New entry" onClose={onClose} className="entry-sheet entry-chooser">
    <p className="entry-intro">Are you receiving money or paying it out?</p>
    <div className="entry-actions entry-directions">
      <button type="button" className="entry-action entry-action-income" aria-label="Income" onClick={() => onChoose('income')}>
        <ArrowDownLeft size={24} aria-hidden="true" /><span><strong>Income</strong><small>Money received</small></span>
      </button>
      <button type="button" className="entry-action entry-action-expense" aria-label="Expenses" onClick={() => onChoose('expense')}>
        <ArrowUpRight size={24} aria-hidden="true" /><span><strong>Expenses</strong><small>Money paid or spent</small></span>
      </button>
    </div>
  </Sheet>;
}
