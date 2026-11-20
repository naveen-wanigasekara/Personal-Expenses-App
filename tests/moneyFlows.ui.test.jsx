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
  commitFinanceChanges:vi.fn(),fetchTransactions:empty,insertTransaction:vi.fn(),updateTransaction:vi.fn(),deleteTransaction:vi.fn(),fetchCards:empty,upsertCard:vi.fn(),deleteCard:vi.fn(),fetchBudgets:async()=>structuredClone(store.budgets||[]),upsertBudget:vi.fn(async row=>{if(store.fail)throw Error('Save failed');store.budgets=[...(store.budgets||[]).filter(r=>r.month_key!==row.month_key),row];}),fetchInstallmentPlans:async()=>structuredClone((store.installment_plans||store.notificationPlans||[]).map(p=>({active:true,...p}))),fetchRecurringReminders:async()=>structuredClone(store.recurring_reminders||store.notificationReminders||[]),insertRecurringReminder:vi.fn(async row=>{store.recurring_reminders=[...(store.recurring_reminders||[]),row];}),updateRecurringReminder:vi.fn(async(id,row)=>{store.recurring_reminders=store.recurring_reminders.map(r=>r.id===id?{...r,...row}:r);}),deleteRecurringReminder:vi.fn(async id=>{store.recurring_reminders=store.recurring_reminders.filter(r=>r.id!==id);}),fetchInvestments:async()=>structuredClone(store.investments||[]),fetchInvestmentValuations:async()=>structuredClone(store.investment_valuations||[]),fetchUserSettings:async()=>store.settings||null,upsertUserSettings:vi.fn(async(id,data)=>{if(store.fail)throw Error('Save failed');store.settings=JSON.parse(JSON.stringify({...store.settings,...data}));}),supabase:{auth:{getUser:vi.fn(),mfa:{listFactors:vi.fn()}}},signOut:vi.fn(),resetPassword:vi.fn(),
 };
});
import MainApp from '../src/components/MainApp.jsx';
import ThemeProvider from '../src/components/ThemeProvider.jsx';
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
 delete store.recurring_reminders;delete store.budgets;delete store.settings;delete store.investments;delete store.investment_valuations;delete store.installment_plans;delete store.notificationPlans;delete store.notificationReminders;
 localStorage.removeItem(`completed_notifs_${user.id}_${new Date().toISOString().slice(0,7)}`);
 store.transactions=[{id:'salary',type:'income',category:'fixed',amount:200000,date:'2026-01-01'},{id:'savings',type:'expense',category:'savings-investments',amount:100000,date:'2026-01-01'}];
 store.cards=[{id:'hnb',name:'HNB',credit_limit:500000,opening_balance:0,colors:['#222','#555']}];store.records=[];store.revision=0;store.fail=false;
 window.scrollTo=vi.fn();window.matchMedia=vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));window.confirm=vi.fn(()=>true);sessionStorage.clear();
});
afterEach(cleanup);
async function mount(){render(<ThemeProvider><MainApp user={user}/></ThemeProvider>);await screen.findByText('Your Money',{selector:'h3'});}
async function lend({borrower='Person',amount='50000',account='savings',rate='0',date='2026-01-02'}={}){
 await entry('Money lent');const existing=Array.from(screen.getByLabelText('Borrower',{exact:true}).options).find(o=>o.text===borrower);if(existing) change('Borrower',existing.value);else {change('Borrower','__new');change('Borrower name',borrower);}change('Amount lent',amount);change('Funding source',account);if(Number(rate)>0){fireEvent.click(screen.getByLabelText('Charge interest'));change('Interest rate (%)',rate);}change('Date lent',date);await save();
}
it('savings loan and linked repayment update Insights, history and saved reload balances',async()=>{
 await mount();expect(screen.queryByText('Upcoming & due payments')).toBeNull();expect(screen.queryByRole('button',{name:'View people & repayments',exact:true})).toBeNull();expect(screen.queryByRole('button',{name:'Withdraw from savings',exact:true})).toBeNull();await lend();expect(moneyValue('Owed to you · principal')).toContain('50,000');
 expect(screen.getByText('Total Savings').closest('.running-bal').textContent).toContain('50,000');
 await entry('Loan repayment');change('Principal returned','50000');change('Received into','savings');await save();
 expect(moneyValue('Owed to you · principal')).toContain('0');expect(screen.getByText('Total Savings').closest('.running-bal').textContent).toContain('100,000');
 cleanup();await mount();expect(moneyValue('Owed to you · principal')).toContain('0');expect(store.records).toHaveLength(3);
 fireEvent.click(screen.getAllByRole('button',{name:'Money Lent',exact:true})[0]);expect(screen.queryByRole('button',{name:'Open Person'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Archive'}));fireEvent.click(screen.getByRole('button',{name:'Open Person'}));expect(await screen.findByText('Settled',{selector:'span'})).toBeTruthy();expect(screen.getByText('Repayment history (1)')).toBeTruthy();
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
 fireEvent.click(screen.getAllByRole('button',{name:'Money Lent',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Borrowers',exact:true}));fireEvent.click(screen.getByRole('button',{name:'Open Person'}));expect(screen.getByText('Interest received').closest('div').textContent).toContain('5,000');expect(screen.getByText('Principal outstanding').closest('div').textContent).toContain('100,000');
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
 expect(screen.getByLabelText('Installment start date').value).toBe(new Date().toLocaleDateString('en-CA'));
 change('Monthly installment amount','10000');change('Installment description','Synthetic purchase');change('Number of months','3');change('Installment start date','2026-11-15');
 fireEvent.click(screen.getByRole('button',{name:'Create plan'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(store.installment_plans).toHaveLength(1);expect(store.installment_plans[0]).toMatchObject({monthly_amount:10000,total_months:3,total_amount:30000,card_id:'hnb',start_month:'2026-11-15'});
 const planRows=store.transactions.filter(t=>t.installment_id===store.installment_plans[0].id);expect(planRows).toHaveLength(3);expect(planRows.every(t=>t.amount===10000&&t.type==='card-purchase')).toBe(true);
 expect(planRows.map(t=>t.date)).toEqual(['2026-11-15','2026-12-15','2027-01-15']);
 cleanup();await mount();
 expect(store.transactions.filter(t=>t.installment_id===store.installment_plans[0].id).map(t=>t.date)).toEqual(['2026-11-15','2026-12-15','2027-01-15']);
 fireEvent.click(screen.getAllByRole('button',{name:'Cards',exact:true})[0]);
 fireEvent.click(screen.getByRole('button',{name:/HNB.*Outstanding Balance/}));
 fireEvent.click(screen.getByRole('button',{name:'Edit Synthetic purchase',exact:true}));
 expect(screen.getByLabelText('Installment start date').value).toBe('2026-11-15');
 change('Monthly amount','12000');change('Number of months','4');
 fireEvent.click(screen.getByRole('button',{name:'Save changes',exact:true}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 const updated=store.transactions.filter(t=>t.installment_id===store.installment_plans[0].id).sort((a,b)=>a.date.localeCompare(b.date));
 expect(updated.map(t=>t.date)).toEqual(['2026-11-15','2026-12-15','2027-01-15','2027-02-15']);
 expect(updated.map(t=>t.amount)).toEqual([10000,12000,12000,12000]);expect(store.installment_plans[0].total_amount).toBe(46000);

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
 fireEvent.click(screen.getAllByRole('button',{name:'Money Lent',exact:true})[0]);expect(screen.getAllByRole('article')).toHaveLength(2);fireEvent.click(screen.getByRole('button',{name:'Borrowers',exact:true}));expect(screen.getAllByRole('button',{name:'Open Saman'})).toHaveLength(1);
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
 cleanup();await mount();fireEvent.click(screen.getAllByRole('button',{name:'Money Lent',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Borrowers',exact:true}));fireEvent.click(screen.getByRole('button',{name:'Open Saman'}));expect(screen.getByText('Complete transaction history (3)')).toBeTruthy();
});

it('renames borrowers and explicitly merges their histories without changing balances',async()=>{
 await mount();await lend({borrower:'Saman',amount:'1000',account:'cash'});await lend({borrower:'S. Silva',amount:'2000',account:'cash'});
 const originalLoans=structuredClone(store.records.filter(r=>r.kind==='loan'));
 fireEvent.click(screen.getAllByRole('button',{name:'Money Lent',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Borrowers',exact:true}));fireEvent.click(screen.getByRole('button',{name:'Open Saman'}));fireEvent.click(screen.getByLabelText('Manage borrower'));fireEvent.click(screen.getByRole('button',{name:'Edit borrower'}));
 change('Borrower name','Saman Silva');fireEvent.click(screen.getByRole('button',{name:'Save borrower'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(screen.getByRole('heading',{name:'Saman Silva',exact:true})).toBeTruthy();
 fireEvent.click(screen.getByText('Manage borrower'));fireEvent.click(screen.getByRole('button',{name:'Merge duplicate borrower'}));const target=store.records.find(r=>r.kind==='borrower'&&r.name==='S. Silva').id;change('Keep borrower',target);
 fireEvent.click(screen.getByRole('button',{name:'Merge histories'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(screen.getByRole('heading',{name:'S. Silva',exact:true})).toBeTruthy();expect(screen.getByText('Total principal outstanding').closest('div').textContent).toContain('3,000');expect(screen.getByText('Complete transaction history (2)')).toBeTruthy();
 expect(store.records.filter(r=>r.kind==='loan')).toEqual(originalLoans);
 fireEvent.click((await screen.findAllByRole('button',{name:'Insights'}))[0]);expect(moneyValue('Owed to you · principal')).toContain('3,000');expect(moneyValue('Available money · Cash / Bank')).toContain('97,000');
});

it('archives inactive loans and restores them without forgiving principal or changing funds',async()=>{
 await mount();await lend({amount:'1000',account:'cash'});
 fireEvent.click(screen.getAllByRole('button',{name:'Money Lent',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Borrowers',exact:true}));fireEvent.click(screen.getByRole('button',{name:'Open Person'}));
 fireEvent.click(screen.getByRole('button',{name:'Archive'}));fireEvent.click(screen.getByRole('button',{name:'Active loans'}));fireEvent.click(screen.getByLabelText(/^Loan actions:/));fireEvent.click(screen.getByRole('button',{name:'Archive inactive loan'}));await waitFor(()=>expect(store.records.find(r=>r.kind==='loan').archived).toBe(true));
 expect(screen.queryByRole('button',{name:'Record repayment'})).toBeNull();expect(screen.getByText('Total principal outstanding').closest('div').textContent).toContain('1,000');
 fireEvent.click(screen.getByRole('button',{name:'Archive'}));expect(screen.getByText('Archived · balance still owed')).toBeTruthy();fireEvent.click(screen.getByLabelText(/^Loan actions:/));fireEvent.click(screen.getByRole('button',{name:'Restore to active'}));await waitFor(()=>expect(store.records.find(r=>r.kind==='loan').archived).toBe(false));
 fireEvent.click(screen.getByRole('button',{name:'Active loans'}));expect(screen.getByRole('button',{name:'Record repayment'})).toBeTruthy();
 fireEvent.click(screen.getAllByRole('button',{name:'Insights'})[0]);expect(moneyValue('Owed to you · principal')).toContain('1,000');expect(moneyValue('Available money · Cash / Bank')).toContain('99,000');
});

it('keeps unpaid-interest loans active after principal payoff, then automatically archives on interest settlement',async()=>{
 await mount();await lend({amount:'1000',account:'cash',rate:'5'});
 await entry('Loan repayment');change('Principal returned','1000');change('Date','2026-02-02');await save();
 fireEvent.click(screen.getAllByRole('button',{name:'Money Lent',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Borrowers',exact:true}));expect(screen.getByRole('button',{name:'Open Person'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Open Person'}));
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

it('integrates CC reminders and future installments with occurrence-specific completion and reload',async()=>{
 const date=new Date();const month=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;const following=new Date(date.getFullYear(),date.getMonth()+1,1);const nextMonth=`${following.getFullYear()}-${String(following.getMonth()+1).padStart(2,'0')}`;
 localStorage.removeItem(`completed_notifs_${user.id}_${nextMonth}`);
 store.cards[0].opening_balance=100000;store.cards[0].payment_due_date=`${month}-25`;
 store.notificationPlans=[{id:'notif-plan',card_id:'hnb',label:'Notification laptop',monthly_amount:10000,total_amount:30000,total_months:3,start_month:month,category:'other',active:true}];
 store.transactions.push(...[0,1,2].map(index=>{const d=new Date(date.getFullYear(),date.getMonth()+index,1);return{id:`ptx_notif-plan_${index}`,type:'card-purchase',installment_id:'notif-plan',card_id:'hnb',amount:10000,category:'other',date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`};}));
 store.notificationReminders=[{id:'notif-rent',label:'Notification rent',amount:5000,day_of_month:1,active:true}];
 await mount();fireEvent.click(screen.getAllByRole('button',{name:'Notifications'})[0]);const dialog=screen.getByRole('dialog',{name:'Notifications'});
 expect(within(dialog).getByRole('heading',{name:/Monthly Credit Card/})).toBeTruthy();expect(within(dialog).getByRole('heading',{name:/Due Payments/})).toBeTruthy();
 const before=JSON.stringify({transactions:store.transactions,cards:store.cards,records:store.records});
 const nextLabel=following.toLocaleDateString('en-US',{month:'long',year:'numeric'});fireEvent.click(within(dialog).getByRole('button',{name:`Mark Notification laptop for ${nextLabel}, installment 2 due ${nextMonth}-01 as completed`}));
 expect(within(dialog).queryByRole('button',{name:`Mark Notification laptop for ${nextLabel}, installment 2 due ${nextMonth}-01 as completed`})).toBeNull();expect(within(dialog).getAllByText('Notification laptop')).toHaveLength(1);
 expect(JSON.stringify({transactions:store.transactions,cards:store.cards,records:store.records})).toBe(before);
 cleanup();await mount();fireEvent.click(screen.getAllByRole('button',{name:'Notifications'})[0]);expect(screen.queryByRole('button',{name:`Mark Notification laptop for ${nextLabel}, installment 2 due ${nextMonth}-01 as completed`})).toBeNull();expect(screen.getAllByText('Notification laptop')).toHaveLength(1);
 localStorage.removeItem(`completed_notifs_${user.id}_${nextMonth}`);
});

it('creates, edits, reloads and deletes an unused card with its payment date intact',async()=>{
 await mount();fireEvent.click(screen.getAllByRole('button',{name:'Cards',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Add a card'}));
 change('Card name','QA new card');change('Credit limit','200000');change('Next card payment date','2026-12-20');
 fireEvent.click(screen.getByRole('button',{name:'Add card',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(store.cards.find(c=>c.name==='QA new card').payment_due_date).toBe('2026-12-20');
 fireEvent.click(screen.getByRole('button',{name:/QA new card.*Outstanding Balance/}));fireEvent.click(screen.getByRole('button',{name:'Edit card',exact:true}));
 change('Next card payment date','2026-12-25');change('Card name','QA renamed card');fireEvent.click(screen.getByRole('button',{name:'Update card'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 cleanup();await mount();fireEvent.click(screen.getAllByRole('button',{name:'Cards',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:/QA renamed card.*Outstanding Balance/}));
 fireEvent.click(screen.getByRole('button',{name:'Edit card',exact:true}));expect(screen.getByLabelText('Next card payment date').value).toBe('2026-12-25');fireEvent.click(screen.getByRole('button',{name:'Close'}));
 fireEvent.click(screen.getByRole('button',{name:'Delete card',exact:true}));await waitFor(()=>expect(store.cards.some(c=>c.name==='QA renamed card')).toBe(false));
});
it('protects a card linked to a loan created after the card list was loaded',async()=>{
 await mount();await lend({account:'card'});fireEvent.click(screen.getAllByRole('button',{name:'Cards',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:/HNB.*Outstanding Balance/}));
 fireEvent.click(screen.getByRole('button',{name:'Delete card',exact:true}));expect(screen.getByText(/This card funds a recorded loan/)).toBeTruthy();expect(store.cards).toHaveLength(1);expect(store.records.some(r=>r.kind==='loan')).toBe(true);
});
it('cancels only future installments and preserves the original billed charge after reload',async()=>{
 await mount();await entry('Expense');change('Pay with','card');fireEvent.click(screen.getByLabelText('Split into installments'));
 change('Monthly installment amount','10000');change('Installment description','Cancel test');change('Number of months','3');
 fireEvent.click(screen.getByRole('button',{name:'Create plan'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 const first=structuredClone(store.transactions.find(t=>t.installment_id));
 fireEvent.click(screen.getAllByRole('button',{name:'Cards',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:/HNB.*Outstanding Balance/}));fireEvent.click(screen.getByRole('button',{name:'Cancel',exact:true}));
 await waitFor(()=>expect(store.installment_plans[0].active).toBe(false));expect(store.transactions.filter(t=>t.installment_id)).toEqual([first]);
 cleanup();await mount();expect(store.transactions.filter(t=>t.installment_id)).toEqual([first]);
});
it('persists category add, edit and deletion without deferred state or stale category writes',async()=>{
 await mount();fireEvent.click(screen.getAllByRole('button',{name:'Profile',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Manage Categories',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Add category',exact:true}));change('Category name','QA category');fireEvent.click(within(screen.getByRole('dialog',{name:'New category'})).getByRole('button',{name:'Add category',exact:true}));
 await waitFor(()=>expect(store.settings.categories.expense.some(c=>c.label==='QA category')).toBe(true));
 fireEvent.click(screen.getByRole('button',{name:'Edit QA category',exact:true}));change('Category name','QA renamed');fireEvent.click(screen.getByRole('button',{name:'Save changes',exact:true}));
 await waitFor(()=>expect(store.settings.categories.expense.some(c=>c.label==='QA renamed')).toBe(true));
 fireEvent.click(screen.getByRole('button',{name:'Delete QA renamed',exact:true}));await waitFor(()=>expect(store.settings.categories.expense.some(c=>c.label==='QA renamed')).toBe(false));
 cleanup();await mount();expect(store.settings.categories.expense.some(c=>c.label==='QA category'||c.label==='QA renamed')).toBe(false);
});
it('keeps a stable loan label after the earlier loan is fully repaid',async()=>{
 await mount();await lend({amount:'10000'});await lend({amount:'20000',date:'2026-01-03'});await entry('Loan repayment');change('Principal returned','10000');await save();
 await entry('Loan repayment');expect(screen.getByLabelText('Loan').selectedOptions[0].textContent).toMatch(/^Loan 2 /);
});
it('does not record successful card changes when the backend rejects the save',async()=>{
 await mount();const before=structuredClone(store.cards);fireEvent.click(screen.getAllByRole('button',{name:'Cards',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Add a card'}));
 change('Card name','Rejected card');change('Credit limit','100000');store.fail=true;fireEvent.click(screen.getByRole('button',{name:'Add card',exact:true}));
 await screen.findByRole('heading',{name:'Refresh your saved records'});expect(store.cards).toEqual(before);
});
it('creates, edits, values, reloads and removes an investment with its linked history',async()=>{
 await mount();fireEvent.click(screen.getByRole('button',{name:'Investments',exact:true}));fireEvent.click(screen.getByRole('button',{name:'Add an investment',exact:true}));
 change('Investment name','QA portfolio');change('Starting amount','10000');fireEvent.click(screen.getByRole('button',{name:'Add investment',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 fireEvent.click(screen.getByRole('button',{name:/^QA portfolio/}));fireEvent.click(screen.getByRole('button',{name:'Record value',exact:true}));change('Current value','15000');
 fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Record value',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(store.investments[0].current_value).toBe(15000);cleanup();await mount();
 fireEvent.click(screen.getByRole('button',{name:'Investments',exact:true}));fireEvent.click(screen.getByRole('button',{name:/^QA portfolio/}));
 fireEvent.click(screen.getAllByRole('button',{name:'Edit value',exact:true})[0]);change('Current value','16000');fireEvent.click(screen.getByRole('button',{name:'Save changes',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(store.investments[0].current_value).toBe(16000);
 fireEvent.click(screen.getAllByRole('button',{name:'Delete value',exact:true})[0]);await waitFor(()=>expect(store.investment_valuations).toHaveLength(1));expect(store.investments[0].current_value).toBe(10000);expect(screen.getByRole('button',{name:'Delete value',exact:true}).disabled).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Edit investment',exact:true}));change('Investment name','QA portfolio renamed');fireEvent.click(screen.getByRole('button',{name:'Save changes',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(store.investments[0].name).toBe('QA portfolio renamed');fireEvent.click(screen.getByRole('button',{name:'Delete investment',exact:true}));await waitFor(()=>expect(store.investments).toHaveLength(0));expect(store.investment_valuations).toHaveLength(0);
 cleanup();await mount();fireEvent.click(screen.getByRole('button',{name:'Investments',exact:true}));expect(screen.getByText('No investments yet')).toBeTruthy();
});
it('saves and reloads fixed and monthly budgets without losing the fixed plan',async()=>{
 await mount();fireEvent.click(screen.getByRole('button',{name:'Budget',exact:true}));change('Fixed monthly expense budget','100000');change('Groceries budget','20000');fireEvent.click(screen.getByRole('button',{name:'Save fixed plan',exact:true}));
 await waitFor(()=>expect(store.budgets.find(r=>r.month_key==='fixed').expense_total).toBe(100000));
 fireEvent.click(screen.getByRole('button',{name:'This month',exact:true}));change('This month’s expense budget','120000');fireEvent.click(screen.getByRole('button',{name:'Save for this month',exact:true}));
 await waitFor(()=>expect(store.budgets.find(r=>r.month_key!=='fixed').expense_total).toBe(120000));
 cleanup();await mount();fireEvent.click(screen.getByRole('button',{name:'Budget',exact:true}));expect(screen.getByLabelText('Fixed monthly expense budget').value).toBe('100,000.00');fireEvent.click(screen.getByRole('button',{name:'This month',exact:true}));expect(screen.getByLabelText('This month’s expense budget').value).toBe('120,000.00');
});
it('creates, reloads and deletes a recurring reminder through Profile',async()=>{
 await mount();fireEvent.click(screen.getAllByRole('button',{name:'Profile',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Recurring Reminders',exact:true}));fireEvent.click(screen.getByRole('button',{name:'Add reminder',exact:true}));
 change('Reminder label','QA recurring');change('Estimated amount (optional)','9000');change('Due day each month (1–28)','25');fireEvent.click(screen.getByRole('button',{name:'Save Reminder',exact:true}));
 await waitFor(()=>expect(store.recurring_reminders).toHaveLength(1));cleanup();await mount();fireEvent.click(screen.getAllByRole('button',{name:'Notifications',exact:true})[0]);expect(screen.getAllByText('QA recurring')).toHaveLength(2);fireEvent.click(screen.getByRole('button',{name:'Close',exact:true}));
 fireEvent.click(screen.getAllByRole('button',{name:'Profile',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Recurring Reminders',exact:true}));fireEvent.click(screen.getByRole('button',{name:'Delete reminder: QA recurring',exact:true}));await waitFor(()=>expect(store.recurring_reminders).toHaveLength(0));
});

const openBorrowerForDeletion = async name => {
 fireEvent.click(screen.getAllByRole('button',{name:'Money Lent',exact:true})[0]);
 fireEvent.click(screen.getByRole('button',{name:'Borrowers',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:`Open ${name}`}));
 fireEvent.click(screen.getByLabelText('Manage borrower'));
 fireEvent.click(screen.getByRole('button',{name:'Delete borrower',exact:true}));
 return screen.getByRole('dialog',{name:'Delete borrower'});
};
it('confirms empty borrower deletion, supports cancellation, and persists removal after reload',async()=>{
 store.records=[{id:'empty',kind:'borrower',name:'Empty borrower',legacyNames:[]},{id:'other',kind:'borrower',name:'Keep borrower',legacyNames:[]}];
 await mount();let dialog=await openBorrowerForDeletion('Empty borrower');
 fireEvent.click(within(dialog).getByRole('button',{name:'Cancel'}));expect(store.records).toHaveLength(2);
 fireEvent.click(screen.getByLabelText('Manage borrower'));fireEvent.click(screen.getByRole('button',{name:'Delete borrower',exact:true}));
 dialog=screen.getByRole('dialog',{name:'Delete borrower'});fireEvent.click(within(dialog).getByRole('button',{name:'Delete borrower'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(screen.queryByRole('button',{name:'Open Empty borrower'})).toBeNull();expect(screen.getByRole('button',{name:'Open Keep borrower'})).toBeTruthy();
 expect(store.records.map(r=>r.id)).toEqual(['other']);
 cleanup();await mount();fireEvent.click(screen.getAllByRole('button',{name:'Money Lent',exact:true})[0]);fireEvent.click(screen.getByRole('button',{name:'Borrowers',exact:true}));expect(screen.queryByRole('button',{name:'Open Empty borrower'})).toBeNull();
});
it('does not delete a borrower or financial records when loan history exists',async()=>{
 await mount();await lend({borrower:'Protected borrower',account:'cash',amount:'1000'});
 const original=structuredClone(store.records),revision=store.revision;
 const dialog=await openBorrowerForDeletion('Protected borrower');
 expect(within(dialog).getByText(/has loan history and cannot be deleted/)).toBeTruthy();expect(within(dialog).queryByRole('button',{name:'Delete borrower'})).toBeNull();
 fireEvent.click(within(dialog).getByRole('button',{name:'Got it',exact:true}));expect(store.records).toEqual(original);expect(store.revision).toBe(revision);
});
it('failed borrower deletion preserves the saved identity and requires refreshed records',async()=>{
 store.records=[{id:'empty',kind:'borrower',name:'Empty borrower',legacyNames:[]}];
 await mount();const dialog=await openBorrowerForDeletion('Empty borrower');store.fail=true;
 fireEvent.click(within(dialog).getByRole('button',{name:'Delete borrower'}));
 await screen.findByRole('heading',{name:'Refresh your saved records'});expect(store.records).toHaveLength(1);expect(store.records[0].id).toBe('empty');
});
