import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import AddModal from '../src/components/AddModal.jsx';
import MoneyForm from '../src/components/MoneyForm.jsx';
import BorrowerForm from '../src/components/BorrowerForm.jsx';
import {EXPENSE_CATEGORIES,INCOME_CATEGORIES} from '../src/constants/categories.js';

afterEach(cleanup);
// jsdom does not lay out scroll boxes. These tests protect the ownership of
// scrolling; actual overflow/reachability is checked in the browser preview.
function expectScrollableDetails(name,field){
 const region=screen.getByRole('region',{name});
 expect(region.classList.contains('entry-scroll')).toBe(true);
 expect(region.tagName).toBe('DIV');
 expect(within(region).getByLabelText(field,{exact:true})).toBeTruthy();
 expect(region.contains(screen.getByRole('button',{name:/^(Record|Save borrower)$/}))).toBe(false);
 expect(region.contains(screen.getByRole('button',{name:'Close'}))).toBe(false);
 return region;
}
it.each(['income','expense'])('keeps every %s field and the type selector in the same scroll region',type=>{
 render(<AddModal cards={[]} initialType={type} entryGroup={type} entryTask={type} moneyEnabled allExpCats={EXPENSE_CATEGORIES} allIncCats={INCOME_CATEGORIES} onClose={vi.fn()} onSave={vi.fn()} onSubtypeChange={vi.fn()}/>);
 const region=expectScrollableDetails('Entry details','Amount');
 expect(within(region).getByLabelText(type==='income'?'Income type':'Expense type')).toBeTruthy();
 fireEvent.click(screen.getByText('Add a note'));fireEvent.change(screen.getByLabelText('Note',{exact:true}),{target:{value:'Last field remains reachable'}});
 expect(within(region).getByLabelText('Note',{exact:true}).value).toBe('Last field remains reachable');
 expect(within(region).getByLabelText('Date')).toBeTruthy();
});
it('keeps expanded loan terms and notes in the scroll region, above the independent save footer',()=>{
 render(<MoneyForm kind="loan" entryGroup="expense" entryTask="loan" onSubtypeChange={vi.fn()} cards={[]} records={[]} onClose={vi.fn()} onSave={vi.fn()}/>);
 const region=expectScrollableDetails('Entry details','Amount lent');
 fireEvent.click(screen.getByText('More options'));
 for(const label of ['Repayment arrangement','Principal due date (optional)','Note (optional)']) expect(within(region).getByLabelText(label,{exact:true})).toBeTruthy();
 expect(region.querySelector('fieldset').disabled).toBe(false);
});
it('uses the same scrolling layout for borrower entry forms',()=>{
 render(<BorrowerForm onSave={vi.fn()} onClose={vi.fn()}/>);
 const region=expectScrollableDetails('Borrower details','Borrower name');
 expect(within(region).getByLabelText('Borrower note')).toBeTruthy();
});
