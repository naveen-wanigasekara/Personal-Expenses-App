import { ArrowDownLeft, ArrowUpRight, PiggyBank, HandCoins, Undo2, CreditCard } from 'lucide-react';
import Sheet from './Sheet.jsx';

const ACTIONS = [
  { id: 'expense', title: 'Expense', detail: 'Purchases & bills', icon: ArrowUpRight },
  { id: 'income', title: 'Income', detail: 'Money earned', icon: ArrowDownLeft },
  { id: 'savings', title: 'Savings', detail: 'Save or withdraw', icon: PiggyBank, needsMoney: true },
  { id: 'loan', title: 'Money lent', detail: 'Give someone a loan', icon: HandCoins, needsMoney: true },
  { id: 'repayment', title: 'Repayment received', detail: 'Money a borrower returns', icon: Undo2, needsMoney: true },
  { id: 'credit-card', title: 'Credit card', detail: 'Pay your card or add fees', icon: CreditCard, needsCard: true },
];

export default function NewEntryChooser({ onChoose, onClose, moneyEnabled, hasCards }) {
  return <Sheet title="New entry" onClose={onClose} className="entry-sheet entry-chooser">
    <p className="entry-intro">What would you like to record?</p>
    <div className="entry-actions">
      {ACTIONS.map(({ id, title, detail, icon: Icon, needsMoney, needsCard }) =>
        <button key={id} type="button" className="entry-action" aria-label={title}
          disabled={(needsMoney && !moneyEnabled) || (needsCard && !hasCards)} onClick={() => onChoose(id)}>
          <Icon size={21} aria-hidden="true" />
          <span><strong>{title}</strong><small>{detail}</small></span>
        </button>)}
    </div>
    {!hasCards && <p className="entry-caption">Add a credit card in Cards to use card entries.</p>}
    {!moneyEnabled && <p className="entry-caption">Savings and lending need the database update.</p>}
  </Sheet>;
}
