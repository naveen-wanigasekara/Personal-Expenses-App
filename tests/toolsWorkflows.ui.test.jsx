import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
const bank = vi.hoisted(() => ({ rows: [], load: vi.fn(), save: vi.fn() }));
vi.mock('../src/lib/bankDetails.js', () => ({ bankDetailsStore: bank }));
import BankDetailsView from '../src/components/BankDetailsView.jsx';
import LoanCalculatorView from '../src/components/LoanCalculatorView.jsx';
import BudgetView from '../src/components/BudgetView.jsx';

beforeEach(() => {
  vi.resetAllMocks(); bank.rows = [];
  bank.load.mockImplementation(async () => structuredClone(bank.rows));
  bank.save.mockImplementation(async (user, rows) => { bank.rows = structuredClone(rows); return rows; });
  window.confirm = vi.fn(() => true);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(Error('Clipboard unavailable')) } });
});
afterEach(cleanup);
it('does not display a negative-zero savings percentage for a small budget deficit',()=>{
  render(<BudgetView fixedPlan={{income:{total:480000,categories:{}},expense:{total:480001,categories:{}}}} monthPlans={{}} viewMonth="2026-11" stats={{byIncCat:{},byExpCat:{}}} allExpCats={[]} allIncCats={[]}/>);
  const savings=screen.getByText('Planned savings').parentElement.textContent;
  expect(savings).toContain('-1.00');expect(savings).toContain('0%');expect(savings).not.toContain('-0%');
});
const change = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const account = { id: 'account-1', bank: 'QA Bank', branch: 'QA Branch', accountName: 'Synthetic account', accountNumber: '001234500' };

it('creates, edits, reloads, copies and deletes synthetic bank details while retaining leading zeros', async () => {
  render(<BankDetailsView userId="synthetic-user" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Add bank details' }));
  expect(screen.getByRole('button', { name: 'Save bank details' }).disabled).toBe(true);
  for (const [label, value] of [['Bank', account.bank], ['Branch', account.branch], ['Account holder name', account.accountName], ['Account number', account.accountNumber]]) change(label, value);
  fireEvent.click(screen.getByRole('button', { name: 'Save bank details' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(bank.rows[0].accountNumber).toBe('001234500');
  fireEvent.click(screen.getByRole('button', { name: 'Copy bank details' }));
  expect((await screen.findByLabelText('Copy details for QA Bank')).value).toContain('001234500');
  fireEvent.click(screen.getByRole('button', { name: 'Edit' })); change('Branch', 'Edited branch');
  fireEvent.click(screen.getByRole('button', { name: 'Save bank details' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  cleanup(); render(<BankDetailsView userId="synthetic-user" />);
  await screen.findByText('Edited branch'); expect(screen.getByText('001234500')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await screen.findByText('No bank details saved yet.'); expect(bank.rows).toEqual([]);
});

it('keeps a failed bank draft and restores access after a load failure', async () => {
  bank.load.mockRejectedValueOnce(Error('Offline')); render(<BankDetailsView userId="synthetic-user" />);
  await screen.findByRole('alert'); expect(screen.queryByRole('button', { name: 'Add bank details' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Add bank details' }));
  for (const [label, value] of [['Bank', account.bank], ['Branch', account.branch], ['Account holder name', account.accountName], ['Account number', account.accountNumber]]) change(label, value);
  bank.save.mockRejectedValueOnce(Error('Offline')); fireEvent.click(screen.getByRole('button', { name: 'Save bank details' }));
  await screen.findByRole('alert'); expect(screen.getByLabelText('Account number').value).toBe('001234500'); expect(bank.rows).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Save bank details' })); await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); expect(bank.rows).toHaveLength(1);
});

it('calculates zero-interest and interest-bearing repayments, switches units, and rejects fractional months', () => {
  render(<LoanCalculatorView />); change('Loan amount', '120000'); change('Annual interest rate (%)', '0'); change('Repayment period', '1');
  expect(screen.getByRole('status').textContent).toContain('10,000.00'); expect(screen.getByRole('status').textContent).toContain('12 months');
  change('Period unit', 'months'); change('Repayment period', '12'); expect(screen.getByRole('status').textContent).toContain('10,000.00');
  change('Annual interest rate (%)', '12'); expect(screen.getByRole('status').textContent).toContain('10,661.85');
  change('Repayment period', '1.5'); expect(screen.getByRole('alert').textContent).toContain('whole months'); expect(screen.getByRole('status').textContent).not.toMatch(/NaN|Infinity|10,661/);
});
