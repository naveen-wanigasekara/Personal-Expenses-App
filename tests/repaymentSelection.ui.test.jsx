import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import MoneyForm from '../src/components/MoneyForm.jsx';
import {todayLocal} from '../src/utils/money.js';
const loan=(id,borrower,extra={})=>({id,kind:'loan',borrower,amount:1000,account:'cash',date:'2026-01-01',rate:0,ratePeriod:'monthly',interestBasis:'original',arrangement:'flexible',...extra});
const repayment=(loanId,extra={})=>({id:`paid-${loanId}`,kind:'repayment',loanId,principal:1000,interest:0,account:'cash',date:'2026-02-01',...extra});
const options=label=>Array.from(screen.getByLabelText(label,{exact:true}).options).filter(o=>!o.disabled);
const mount=(records,props={})=>render(<MoneyForm kind="repayment" records={records} cards={[]} onSave={vi.fn()} onClose={vi.fn()} {...props}/>);
afterEach(cleanup);
it('excludes settled and unloaned borrowers while keeping principal, interest-only and archived unpaid debt selectable',()=>{
 const records=[loan('paid','Fully paid'),repayment('paid'),loan('open','Still owes'),repayment('open',{principal:400}),loan('interest','Interest owed',{rate:5}),repayment('interest'),loan('archived','Archived unpaid',{archived:true}),{id:'empty',kind:'borrower',name:'No loans',legacyNames:[]}];
 mount(records);
 expect(options('Borrower').map(o=>o.text)).toEqual(['Archived unpaid','Interest owed','Still owes']);
 expect(options('Borrower').some(o=>o.text==='Fully paid')).toBe(false);
});
it('keeps a borrower with one unpaid loan and selects that loan instead of a settled sibling',()=>{
 const a=loan('a','Same person'),b=loan('b','Same person',{date:'2026-02-01'});
 mount([a,repayment('a'),b]);
 expect(options('Borrower').map(o=>o.text)).toEqual(['Same person']);
 expect(options('Loan').map(o=>o.value)).toEqual(['b']);expect(screen.getByLabelText('Loan').value).toBe('b');
});
it('uses the first unpaid loan when switching borrowers or a stale shortcut points to a settled loan',()=>{
 const rows=[loan('a','A'),loan('b1','B'),repayment('b1'),loan('b2','B')];
 mount(rows,{initialLoanId:'b1'});
 expect(screen.getByLabelText('Loan').value).toBe('a');
 const b=options('Borrower').find(o=>o.text==='B');fireEvent.change(screen.getByLabelText('Borrower',{exact:true}),{target:{value:b.value}});
 expect(screen.getByLabelText('Loan').value).toBe('b2');
});
it('removes borrowers after their final balance is settled and disables new repayments',()=>{
 const a=loan('a','A'),b=loan('b','B');const {rerender}=mount([a,b,repayment('a')]);
 expect(options('Borrower').map(o=>o.text)).toEqual(['B']);
 rerender(<MoneyForm kind="repayment" records={[a,b,repayment('a'),repayment('b')]} cards={[]} onSave={vi.fn()} onClose={vi.fn()}/>);
 expect(screen.queryByLabelText('Borrower',{exact:true})).toBeNull();expect(screen.getByText('No outstanding loans. All recorded loans are fully settled.')).toBeTruthy();expect(screen.getByRole('button',{name:'Record'}).disabled).toBe(true);
});
it('keeps the original settled loan available when correcting an existing repayment',async()=>{
 const a=loan('a','A'),payment=repayment('a');const onSave=vi.fn().mockResolvedValue();
 mount([a,payment,loan('b','Other settled'),repayment('b')],{editing:payment,onSave});
 expect(options('Borrower').map(o=>o.text)).toEqual(['A']);expect(screen.getByLabelText('Loan').value).toBe('a');
 fireEvent.change(screen.getByLabelText('Principal returned'),{target:{value:'900'}});fireEvent.click(screen.getByRole('button',{name:'Save changes'}));
 await waitFor(()=>expect(onSave).toHaveBeenCalledWith(expect.objectContaining({id:payment.id,loanId:'a',principal:900})));
});
it('keeps a borrower until the final unpaid interest is received',()=>{
 const a=loan('a','Interest only',{date:'2026-01-01',rate:5});const p=repayment('a');
 const {rerender}=mount([a,p]);expect(options('Borrower').map(o=>o.text)).toEqual(['Interest only']);
 rerender(<MoneyForm kind="repayment" records={[a,p,repayment('a',{id:'interest',principal:0,interest:50,date:todayLocal()})]} cards={[]} onSave={vi.fn()} onClose={vi.fn()}/>);
 expect(screen.queryByLabelText('Borrower',{exact:true})).toBeNull();
});
it('switches to an eligible borrower if refreshed balances settle the selected borrower',()=>{
 const a=loan('a','A'),b=loan('b','B');const {rerender}=mount([a,b]);
 fireEvent.change(screen.getByLabelText('Principal returned'),{target:{value:'100'}});
 rerender(<MoneyForm kind="repayment" records={[a,b,repayment('a')]} cards={[]} onSave={vi.fn()} onClose={vi.fn()}/>);
 expect(options('Borrower').map(o=>o.text)).toEqual(['B']);expect(screen.getByLabelText('Loan').value).toBe('b');expect(screen.getByLabelText('Principal returned').value).toBe('');
});
