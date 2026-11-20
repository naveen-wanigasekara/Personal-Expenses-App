export const ENTRY_TYPES = {
  income: [
    { id: 'income', label: 'Regular income' },
    { id: 'repayment', label: 'Repayment received', needsMoney: true },
    { id: 'withdrawal', label: 'Withdraw from savings', needsMoney: true },
  ],
  expense: [
    { id: 'expense', label: 'Purchase or bill' },
    { id: 'loan', label: 'Lend money', needsMoney: true },
    { id: 'savings', label: 'Add to savings', needsMoney: true },
    { id: 'card-payment', label: 'Pay credit card', needsCard: true },
    { id: 'card-interest', label: 'Card interest or fees', needsCard: true },
  ],
};
