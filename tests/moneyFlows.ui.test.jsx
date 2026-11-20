import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,within,cleanup} from '@testing-library/react';
import {getDefaultUserCats} from '../src/constants/categories.js';
const store=vi.hoisted(()=>({transactions:[],cards:[],records:[],revision:0,fail:false}));
vi.mock('../src/hooks/usePWA.js',()=>({usePWA:()=>({isStandalone:false,updateApp:vi.fn()})}));
vi.mock('../src/lib/supabase.js',()=>{
 const empty=async()=>[];
 return {
  fetchMoneyWorkspace:async()=>structuredClone(store),
  commitMoneyChanges:vi.fn(async(changes,revision)=>{
   if(store.fail) throw new Error('Records changed on another device');
   if(revision!==store.revision) throw new Error('stale revision');
   for(const c of changes){const key=c.table==='money_records'?'records':c.table;const rows=store[key] || (store[key]=[]);
    if(c.op==='delete') store[key]=rows.filter(r=>r.id!==c.id);
    else {const data=c.table==='money_records'?{...c.data.data,id:c.id}:{...c.data,id:c.id};const i=rows.findIndex(r=>r.id===c.id);if(i<0) rows.push(data);else rows[i]={...rows[i],...data};}
   } return ++store.revision;
  }),
  commitFinanceChanges:vi.fn(),fetchTransactions:empty,insertTransaction:vi.fn(),updateTransaction:vi.fn(),deleteTransaction:vi.fn(),fetchCards:empty,upsertCard:vi.fn(),deleteCard:vi.fn(),fetchBudgets:empty,upsertBudget:vi.fn(),fetchInstallmentPlans:empty,fetchRecurringReminders:empty,insertRecurringReminder:vi.fn(),updateRecurringReminder:vi.fn(),deleteRecurringReminder:vi.fn(),fetchInvestments:empty,fetchInvestmentValuations:empty,fetchUserSettings:async()=>null,upsertUserSettings:vi.fn(),supabase:{auth:{getUser:vi.fn(),mfa:{listFactors:vi.fn()}}},signOut:vi.fn(),resetPassword:vi.fn(),
 };
});
import MainApp from '../src/components/MainApp.jsx';
import MoneyForm from '../src/components/MoneyForm.jsx';
const user={id:'qa-user',email:'synthetic@example.com',created_at:'2026-01-01'};
const change=(name,value)=>fireEvent.change(screen.getByLabelText(name,{exact:true}),{target:{value}});
const entry=async kind=>{
 const tasks={'Money lent':['Expenses','loan'],'Loan repayment':['Income','repayment'],'Withdraw from savings':['Income','withdrawal'],'Savings':['Expenses','savings'],'Expense':['Expenses','expense'],'Income':['Income','income'],'Credit card':['Expenses','card-payment']};
 const [group,task]=tasks[kind];
 fireEvent.click(screen.getAllByRole('button',{name:'New entry'})[0]);fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:group,exact:true}));
 change(group==='Income'?'Income type':'Expense type',task);await screen.findByRole('dialog');
};
const save=async()=>{fireEvent.click(screen.getByRole('button',{name:'Record',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());};
const moneyValue=label=>screen.getByText(label,{exact:true}).closest('div').querySelector('dd').textContent;
beforeEach(()=>{
 delete store.installment_plans;
 store.transactions=[{id:'salary',type:'income',category:'fixed',amount:200000,date:'2026-01-01'},{id:'savings',type:'expense',category:'savings-investments',amount:100000,date:'2026-01-01'}];
 store.cards=[{id:'hnb',name:'HNB',credit_limit:500000,opening_balance:0,colors:['#222','#555']}];store.records=[];store.revision=0;store.fail=false;
 window.scrollTo=vi.fn();window.matchMedia=vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));window.confirm=vi.fn(()=>true);sessionStorage.clear();
});
afterEach(cleanup);
async function mount(){render(<MainApp user={user}/>);await screen.findByText('Your Money',{selector:'h3'});}
async function lend({borrower='Person',amount='50000',account='savings',rate='0',date='2026-01-02'}={}){
 await entry('Money lent');const existing=Array.from(screen.getByLabelText('Borrower',{exact:true}).options).find(o=>o.text===borrower);if(existing) change('Borrower',existing.value);else {change('Borrower','__new');change('Borrower name',borrower);}change('Amount lent',amount);change('Funding source',account);if(Number(rate)>0){fireEvent.click(screen.getByLabelText('Charge interest'));change('Interest rate (%)',rate);}change('Date lent',date);await save();
}
it('savings loan and linked repayment update Insights, history and saved reload balances',async()=>{
 await mount();await lend();expect(moneyValue('Owed to you · principal')).toContain('50,000');
 expect(screen.getByText('Total Savings').closest('.running-bal').textContent).toContain('50,000');
 await entry('Loan repayment');change('Principal returned','50000');change('Received into','savings');await save();
 expect(moneyValue('Owed to you · principal')).toContain('0');expect(screen.getByText('Total Savings').closest('.running-bal').textContent).toContain('100,000');
 cleanup();await mount();expect(moneyValue('Owed to you · principal')).toContain('0');expect(store.records).toHaveLength(3);
 fireEvent.click(screen.getByRole('button',{name:'View people & repayments'}));expect(screen.queryByRole('button',{name:'Open Person'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Archive'}));fireEvent.click(screen.getByRole('button',{name:'Open Person'}));expect(await screen.findByText('Settled',{selector:'span'})).toBeTruthy();expect(screen.getByText('Repayment history (1)')).toBeTruthy();
});
it('HNB-funded loan, cash repayment and separate card payment do not inflate income/spending',async()=>{
 await mount();await lend({amount:'100000',account:'card'});
 expect(moneyValue('You owe · credit cards')).toContain('100,000');
 await entry('Loan repayment');change('Principal returned','100000');change('Received into','cash');await save();
 expect(moneyValue('Available money · Cash / Bank')).toContain('200,000');expect(moneyValue('You owe · credit cards')).toContain('100,000');
 await entry('Credit card');change('Amount','100000');fireEvent.click(screen.getByRole('button',{name:'Record',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(moneyValue('You owe · credit cards')).toContain('0');expect(moneyValue('Available money · Cash / Bank')).toContain('100,000');
 expect(store.transactions.filter(t=>t.type==='income')).toHaveLength(1);
});
it('interest-only receipts show income while keeping the full principal outstanding',async()=>{
 await mount();await lend({amount:'100000',account:'cash',rate:'5',date:'2026-01-02'});
 await entry('Loan repayment');change('Interest received','5000');change('Date','2026-02-02');await save();
 expect(moneyValue('Owed to you · principal')).toContain('100,000');expect(moneyValue('Available money · Cash / Bank')).toContain('5,000');
 fireEvent.click(screen.getByRole('button',{name:'View people & repayments'}));fireEvent.click(screen.getByRole('button',{name:'Open Person'}));expect(screen.getByText('Interest received').closest('div').textContent).toContain('5,000');expect(screen.getByText('Principal outstanding').closest('div').textContent).toContain('100,000');
});
it('withdrawal validation leaves the form open, saves once, and ledger edits reverse correctly',async()=>{
 await mount();await entry('Withdraw from savings');change('Amount','100001');fireEvent.click(screen.getByRole('button',{name:'Record',exact:true}));expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Insufficient savings'));expect(store.records).toHaveLength(0);
 change('Amount','20000');await save();expect(store.records).toHaveLength(1);
 fireEvent.click(screen.getAllByRole('button',{name:'Ledger'})[0]);
 // New transfers use today's date, so they appear in the selected month.
 fireEvent.click(screen.getByRole('button',{name:/Withdraw from savings.*Savings → Cash \/ Bank/}));fireEvent.click(screen.getByRole('button',{name:'Edit',exact:true}));
 change('Amount','10000');fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(store.records[0].amount).toBe(10000);
 fireEvent.click(screen.getAllByRole('button',{name:'Insights'})[0]);expect(screen.getByText('Total Savings').closest('.running-bal').textContent).toContain('90,000');
});
it('a rejected or stale save never reports success or displays an unsaved balance',async()=>{
 await mount();await entry('Money lent');change('Borrower name','Failed');change('Amount lent','1000');store.fail=true;
 fireEvent.click(screen.getByRole('button',{name:'Record',exact:true}));await screen.findByRole('heading',{name:'Refresh your saved records'});expect(store.records).toHaveLength(0);
});

it('starts with only Income and Expenses and shows one subtype at a time',async()=>{
 await mount();fireEvent.click(screen.getAllByRole('button',{name:'New entry'})[0]);
 const dialog=screen.getByRole('dialog',{name:'New entry'});
 expect(within(dialog).queryByLabelText('Amount')).toBeNull();
 expect(dialog.querySelectorAll('.entry-action')).toHaveLength(2);
 for(const label of ['Income','Expenses']) expect(within(dialog).getByRole('button',{name:label,exact:true})).toBeTruthy();
 for(const label of ['Cash Purchase','Card Purchase','Transfer money','Withdraw from savings']) expect(within(dialog).queryByRole('button',{name:label,exact:true})).toBeNull();
 fireEvent.click(within(dialog).getByRole('button',{name:'Expenses',exact:true}));
 expect(screen.queryByLabelText('Borrower name')).toBeNull();
 expect(Array.from(screen.getByLabelText('Pay with').options).map(o=>o.text)).toEqual(['Cash / Bank','Credit card']);
 expect(Array.from(screen.getByLabelText('Category').options).some(o=>o.value==='savings-investments')).toBe(false);
 change('Pay with','card');expect(screen.getByLabelText('Credit card')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Income / Expenses'}));expect(screen.queryByLabelText('Amount')).toBeNull();
});
it('saves under Expenses and withdraws under Income without duplicate account pickers',async()=>{
 await mount();await entry('Savings');expect(screen.queryByLabelText('From account')).toBeNull();expect(screen.queryByLabelText('To account')).toBeNull();
 change('Amount','25000');await save();expect(store.records[0]).toMatchObject({kind:'transfer',from:'cash',to:'savings',amount:25000});
 expect(moneyValue('Available money · Cash / Bank')).toContain('75,000');
 await entry('Withdraw from savings');expect(screen.queryByLabelText('Savings action')).toBeNull();change('Amount','10000');await save();
 expect(store.records[1]).toMatchObject({from:'savings',to:'cash',amount:10000});
 expect(moneyValue('Available money · Cash / Bank')).toContain('85,000');
 expect(screen.getByText('Total Savings').closest('.running-bal').textContent).toContain('115,000');
});
it('combines existing bank and cash balances and preserves a bank record when edited',async()=>{
 const date=new Date().toLocaleDateString('en-CA');store.transactions.push({id:'bank-income',type:'income',category:'fixed',amount:5000,account:'bank',date,note:'Legacy bank income'});
 await mount();expect(moneyValue('Available money · Cash / Bank')).toContain('105,000');expect(screen.queryByText('Bank balance')).toBeNull();
 fireEvent.click(screen.getAllByRole('button',{name:'Ledger'})[0]);fireEvent.click(screen.getByRole('button',{name:/Legacy bank income/}));fireEvent.click(screen.getByRole('button',{name:'Edit',exact:true}));
 change('Amount','6000');fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(store.transactions.find(t=>t.id==='bank-income')).toMatchObject({amount:6000,account:'bank'});
 fireEvent.click(screen.getAllByRole('button',{name:'Insights'})[0]);expect(moneyValue('Available money · Cash / Bank')).toContain('106,000');
});
it('hides optional loan terms and does not offer interest input for an interest-free repayment',async()=>{
 await mount();await entry('Money lent');expect(screen.queryByLabelText('Interest rate (%)')).toBeNull();
 expect(screen.getByLabelText('Repayment arrangement').closest('details').open).toBe(false);
 change('Borrower name','Interest free');change('Amount lent','1000');await save();
 await entry('Loan repayment');expect(screen.queryByLabelText('Interest received')).toBeNull();
 expect(Array.from(screen.getByLabelText('Received into').options).map(o=>o.text)).toEqual(['Cash / Bank','Savings']);
});
it('card expenses still create complete installment schedules from the single Expense task',async()=>{
 await mount();await entry('Expense');change('Pay with','card');fireEvent.click(screen.getByLabelText('Split into installments'));
 change('Monthly installment amount','10000');change('Installment description','Synthetic purchase');change('Number of months','3');
 fireEvent.click(screen.getByRole('button',{name:'Create plan'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(store.installment_plans).toHaveLength(1);expect(store.installment_plans[0]).toMatchObject({monthly_amount:10000,total_months:3,total_amount:30000,card_id:'hnb'});
 const planRows=store.transactions.filter(t=>t.installment_id===store.installment_plans[0].id);expect(planRows).toHaveLength(3);expect(planRows.every(t=>t.amount===10000&&t.type==='card-purchase')).toBe(true);
});

it('editing an existing bank-funded loan preserves its funding and interest terms',async()=>{
 const onSave=vi.fn().mockResolvedValue();const loan={id:'old-loan',kind:'loan',borrower:'Existing borrower',amount:1000,account:'bank',rate:2.5,ratePeriod:'yearly',interestBasis:'remaining',arrangement:'interest-only',installmentMonths:12,dueDate:'',date:'2026-01-02',note:''};
 render(<MoneyForm kind="loan" editing={loan} cards={[]} records={[loan]} onSave={onSave} onClose={vi.fn()}/>);
 expect(screen.getByLabelText('Funding source').value).toBe('cash');
 expect(Array.from(screen.getByLabelText('Funding source').options).map(o=>o.text)).toEqual(['Cash / Bank','Savings']);
 change('Amount lent','2000');fireEvent.click(screen.getByRole('button',{name:'Save changes'}));
 await waitFor(()=>expect(onSave).toHaveBeenCalledWith(expect.objectContaining({id:'old-loan',amount:2000,account:'bank',rate:2.5,ratePeriod:'yearly',interestBasis:'remaining',arrangement:'interest-only'})));
});
it('editing a legacy cash-to-bank transfer cannot turn it into a savings withdrawal',async()=>{
 const onSave=vi.fn().mockResolvedValue();const transfer={id:'old-transfer',kind:'transfer',from:'cash',to:'bank',amount:500,date:'2026-01-02',note:''};
 render(<MoneyForm kind="transfer" editing={transfer} cards={[]} records={[transfer]} onSave={onSave} onClose={vi.fn()}/>);
 expect(screen.queryByLabelText('Savings action')).toBeNull();
 change('Amount','600');fireEvent.click(screen.getByRole('button',{name:'Save changes'}));
 await waitFor(()=>expect(onSave).toHaveBeenCalledWith(expect.objectContaining({id:'old-transfer',from:'cash',to:'bank',amount:600})));
});

it('groups repeated lending under one borrower and allocates repayments to the selected dated loan',async()=>{
 await mount();await lend({borrower:'Saman',amount:'50000',date:'2026-01-02'});
 await lend({borrower:'Saman',amount:'25000',account:'cash',rate:'5',date:'2026-02-02'});
 const loans=store.records.filter(r=>r.kind==='loan');expect(loans).toHaveLength(2);expect(loans[0].borrowerId).toBe(loans[1].borrowerId);expect(store.records.filter(r=>r.kind==='borrower')).toHaveLength(1);
 fireEvent.click(screen.getByRole('button',{name:'View people & repayments'}));expect(screen.getAllByRole('button',{name:'Open Saman'})).toHaveLength(1);
 fireEvent.click(screen.getByRole('button',{name:'Open Saman'}));expect(screen.getByText('Complete transaction history (2)')).toBeTruthy();
 // Lending remains available through New Entry after page shortcuts are removed.
 expect(screen.queryByRole('button',{name:'Lend money',exact:true})).toBeNull();await entry('Money lent');change('Borrower',loans[0].borrowerId);expect(screen.getByRole('dialog',{name:'Expenses'})).toBeTruthy();expect(screen.getByLabelText('Borrower',{exact:true}).value).toBe(loans[0].borrowerId);fireEvent.click(screen.getByRole('button',{name:'Close'}));
 const cards=screen.getAllByRole('article');fireEvent.click(within(cards[1]).getByRole('button',{name:'Record repayment'}));
 expect(screen.getByRole('dialog',{name:'Income'})).toBeTruthy();expect(screen.getByLabelText('Loan').value).toBe(loans[1].id);
 change('Principal returned','10000');change('Interest received','1250');change('Date','2026-03-02');await save();
 expect(store.records.find(r=>r.kind==='repayment')).toMatchObject({loanId:loans[1].id,principal:10000,interest:1250});
 expect(screen.getByText('Complete transaction history (3)')).toBeTruthy();expect(screen.getByText('Total principal outstanding').closest('div').textContent).toContain('65,000');
 const history=screen.getByText('Complete transaction history (3)').closest('details');fireEvent.click(within(history).getByText('Complete transaction history (3)'));
 expect(history.querySelectorAll('.borrower-event')).toHaveLength(3);expect(within(history).getByText('Repayment received')).toBeTruthy();
 cleanup();await mount();fireEvent.click(screen.getByRole('button',{name:'View people & repayments'}));fireEvent.click(screen.getByRole('button',{name:'Open Saman'}));expect(screen.getByText('Complete transaction history (3)')).toBeTruthy();
});

it('renames borrowers and explicitly merges their histories without changing balances',async()=>{
 await mount();await lend({borrower:'Saman',amount:'1000',account:'cash'});await lend({borrower:'S. Silva',amount:'2000',account:'cash'});
 const originalLoans=structuredClone(store.records.filter(r=>r.kind==='loan'));
 fireEvent.click(screen.getByRole('button',{name:'View people & repayments'}));fireEvent.click(screen.getByRole('button',{name:'Open Saman'}));fireEvent.click(screen.getByLabelText('Manage borrower'));fireEvent.click(screen.getByRole('button',{name:'Edit borrower'}));
 change('Borrower name','Saman Silva');fireEvent.click(screen.getByRole('button',{name:'Save borrower'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(screen.getByRole('heading',{name:'Saman Silva',exact:true})).toBeTruthy();
 fireEvent.click(screen.getByText('Manage borrower'));fireEvent.click(screen.getByRole('button',{name:'Merge duplicate borrower'}));const target=store.records.find(r=>r.kind==='borrower'&&r.name==='S. Silva').id;change('Keep borrower',target);
 fireEvent.click(screen.getByRole('button',{name:'Merge histories'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(screen.getByRole('heading',{name:'S. Silva',exact:true})).toBeTruthy();expect(screen.getByText('Total principal outstanding').closest('div').textContent).toContain('3,000');expect(screen.getByText('Complete transaction history (2)')).toBeTruthy();
 expect(store.records.filter(r=>r.kind==='loan')).toEqual(originalLoans);
 fireEvent.click((await screen.findAllByRole('button',{name:'Insights'}))[0]);expect(moneyValue('Owed to you · principal')).toContain('3,000');expect(moneyValue('Available money · Cash / Bank')).toContain('97,000');
});

it('archives inactive loans and restores them without forgiving principal or changing funds',async()=>{
 await mount();await lend({amount:'1000',account:'cash'});
 fireEvent.click(screen.getByRole('button',{name:'View people & repayments'}));fireEvent.click(screen.getByRole('button',{name:'Open Person'}));
 fireEvent.click(screen.getByLabelText(/^Loan actions:/));fireEvent.click(screen.getByRole('button',{name:'Archive inactive loan'}));await waitFor(()=>expect(store.records.find(r=>r.kind==='loan').archived).toBe(true));
 expect(screen.queryByRole('button',{name:'Record repayment'})).toBeNull();expect(screen.getByText('Total principal outstanding').closest('div').textContent).toContain('1,000');
 fireEvent.click(screen.getByRole('button',{name:'Archive'}));expect(screen.getByText('Archived · balance still owed')).toBeTruthy();fireEvent.click(screen.getByLabelText(/^Loan actions:/));fireEvent.click(screen.getByRole('button',{name:'Restore to active'}));await waitFor(()=>expect(store.records.find(r=>r.kind==='loan').archived).toBe(false));
 fireEvent.click(screen.getByRole('button',{name:'Active loans'}));expect(screen.getByRole('button',{name:'Record repayment'})).toBeTruthy();
 fireEvent.click(screen.getAllByRole('button',{name:'Insights'})[0]);expect(moneyValue('Owed to you · principal')).toContain('1,000');expect(moneyValue('Available money · Cash / Bank')).toContain('99,000');
});

it('keeps unpaid-interest loans active after principal payoff, then automatically archives on interest settlement',async()=>{
 await mount();await lend({amount:'1000',account:'cash',rate:'5'});
 await entry('Loan repayment');change('Principal returned','1000');change('Date','2026-02-02');await save();
 fireEvent.click(screen.getByRole('button',{name:'View people & repayments'}));expect(screen.getByRole('button',{name:'Open Person'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Open Person'}));
 fireEvent.click(screen.getByRole('button',{name:'Record repayment'}));change('Interest received','50');change('Date','2026-02-02');await save();
 expect(screen.queryByRole('button',{name:'Record repayment'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Archive'}));expect(screen.getByText('Settled',{selector:'span'})).toBeTruthy();expect(screen.getByText('Repayment history (2)')).toBeTruthy();
});

it('records regular income, cash spending and card fees through the two central groups',async()=>{
 await mount();await entry('Income');expect(Array.from(screen.getByLabelText('Income type').options).map(o=>o.text)).toEqual(['Regular income','Repayment received','Withdraw from savings']);change('Amount','1000');await save();
 await entry('Expense');expect(Array.from(screen.getByLabelText('Expense type').options).map(o=>o.text)).toEqual(['Purchase or bill','Lend money','Add to savings','Pay credit card','Card interest or fees']);change('Amount','200');await save();
 await entry('Expense');change('Expense type','card-interest');expect(screen.queryByLabelText('Card action')).toBeNull();change('Amount','50');await save();
 expect(store.transactions.filter(t=>t.type==='income')).toHaveLength(2);expect(store.transactions.find(t=>t.type==='card-interest')).toMatchObject({amount:50,card_id:'hnb'});
 expect(moneyValue('Available money · Cash / Bank')).toContain('100,800');expect(moneyValue('You owe · credit cards')).toContain('50');
});

it('highlights received ledger rows with readable labels and filters repayments as money received',async()=>{
 await mount();await lend({amount:'1000',account:'cash'});await entry('Loan repayment');change('Principal returned','1000');await save();
 fireEvent.click(screen.getAllByRole('button',{name:'Ledger'})[0]);change('Transaction type','income');
 const receipt=screen.getByRole('button',{name:/Principal received from Person/}).closest('.tx');expect(receipt.classList.contains('activity-received')).toBe(true);expect(within(receipt).getByText('Received')).toBeTruthy();
 change('Transaction type','expense');expect(screen.queryByRole('button',{name:/Principal received from Person/})).toBeNull();
});

it('repayment entry retains a borrower until their last loan is paid, then removes them on reopen',async()=>{
 await mount();await lend({borrower:'Repeat borrower',amount:'1000',account:'cash'});await lend({borrower:'Repeat borrower',amount:'2000',account:'cash',date:'2026-02-02'});
 const loans=store.records.filter(r=>r.kind==='loan');
 await entry('Loan repayment');expect(screen.getByLabelText('Loan').options).toHaveLength(2);change('Principal returned','1000');await save();
 await entry('Loan repayment');expect(Array.from(screen.getByLabelText('Borrower',{exact:true}).options).filter(o=>!o.disabled).map(o=>o.text)).toEqual(['Repeat borrower']);
 expect(Array.from(screen.getByLabelText('Loan').options).map(o=>o.value)).toEqual([loans[1].id]);change('Principal returned','2000');await save();
 await entry('Loan repayment');expect(screen.queryByLabelText('Borrower',{exact:true})).toBeNull();expect(screen.getByText('No outstanding loans. All recorded loans are fully settled.')).toBeTruthy();expect(screen.getByRole('button',{name:'Record'}).disabled).toBe(true);
});
