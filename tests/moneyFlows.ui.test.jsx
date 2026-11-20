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
   for(const c of changes){const key=c.table==='money_records'?'records':c.table;const rows=store[key];
    if(c.op==='delete') store[key]=rows.filter(r=>r.id!==c.id);
    else {const data=c.table==='money_records'?{...c.data.data,id:c.id}:{...c.data,id:c.id};const i=rows.findIndex(r=>r.id===c.id);if(i<0) rows.push(data);else rows[i]={...rows[i],...data};}
   } return ++store.revision;
  }),
  commitFinanceChanges:vi.fn(),fetchTransactions:empty,insertTransaction:vi.fn(),updateTransaction:vi.fn(),deleteTransaction:vi.fn(),fetchCards:empty,upsertCard:vi.fn(),deleteCard:vi.fn(),fetchBudgets:empty,upsertBudget:vi.fn(),fetchInstallmentPlans:empty,fetchRecurringReminders:empty,insertRecurringReminder:vi.fn(),updateRecurringReminder:vi.fn(),deleteRecurringReminder:vi.fn(),fetchInvestments:empty,fetchInvestmentValuations:empty,fetchUserSettings:async()=>null,upsertUserSettings:vi.fn(),supabase:{auth:{getUser:vi.fn(),mfa:{listFactors:vi.fn()}}},signOut:vi.fn(),resetPassword:vi.fn(),
 };
});
import MainApp from '../src/components/MainApp.jsx';
const user={id:'qa-user',email:'synthetic@example.com',created_at:'2026-01-01'};
const change=(name,value)=>fireEvent.change(screen.getByLabelText(name,{exact:true}),{target:{value}});
const entry=async kind=>{fireEvent.click(screen.getAllByRole('button',{name:'New entry'})[0]);fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:kind,exact:true}));await screen.findByRole('dialog');};
const save=async()=>{fireEvent.click(screen.getByRole('button',{name:'Record',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());};
const moneyValue=label=>screen.getByText(label,{exact:true}).closest('div').querySelector('dd').textContent;
beforeEach(()=>{
 store.transactions=[{id:'salary',type:'income',category:'fixed',amount:200000,date:'2026-01-01'},{id:'savings',type:'expense',category:'savings-investments',amount:100000,date:'2026-01-01'}];
 store.cards=[{id:'hnb',name:'HNB',credit_limit:500000,opening_balance:0,colors:['#222','#555']}];store.records=[];store.revision=0;store.fail=false;
 window.scrollTo=vi.fn();window.matchMedia=vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));window.confirm=vi.fn(()=>true);sessionStorage.clear();
});
afterEach(cleanup);
async function mount(){render(<MainApp user={user}/>);await screen.findByText('Your Money',{selector:'h3'});}
async function lend({borrower='Person',amount='50000',account='savings',rate='0',date='2026-01-02'}={}){
 await entry('Money lent');change('Borrower name',borrower);change('Amount lent',amount);change('Funding source',account);change('Interest rate (%)',rate);change('Date lent',date);await save();
}
it('savings loan and linked repayment update Insights, history and saved reload balances',async()=>{
 await mount();await lend();expect(moneyValue('Owed to you · principal')).toContain('50,000');
 expect(screen.getByText('Total Savings').closest('.running-bal').textContent).toContain('50,000');
 await entry('Loan repayment');change('Principal returned','50000');change('Received into','savings');await save();
 expect(moneyValue('Owed to you · principal')).toContain('0');expect(screen.getByText('Total Savings').closest('.running-bal').textContent).toContain('100,000');
 cleanup();await mount();expect(moneyValue('Owed to you · principal')).toContain('0');expect(store.records).toHaveLength(2);
 fireEvent.click(screen.getByRole('button',{name:'View people & repayments'}));expect(await screen.findByText('Settled',{selector:'span'})).toBeTruthy();expect(screen.getByText('Repayment history (1)')).toBeTruthy();
});
it('HNB-funded loan, cash repayment and separate card payment do not inflate income/spending',async()=>{
 await mount();await lend({amount:'100000',account:'card'});
 expect(moneyValue('You owe · credit cards')).toContain('100,000');
 await entry('Loan repayment');change('Principal returned','100000');change('Received into','cash');await save();
 expect(moneyValue('Available money · cash + bank')).toContain('200,000');expect(moneyValue('You owe · credit cards')).toContain('100,000');
 fireEvent.click(screen.getAllByRole('button',{name:'New entry'})[0]);fireEvent.click(screen.getByRole('button',{name:'Card Payment',exact:true}));change('Amount','100000');fireEvent.click(screen.getByRole('button',{name:'Record',exact:true}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(moneyValue('You owe · credit cards')).toContain('0');expect(moneyValue('Available money · cash + bank')).toContain('100,000');
 expect(store.transactions.filter(t=>t.type==='income')).toHaveLength(1);
});
it('interest-only receipts show income while keeping the full principal outstanding',async()=>{
 await mount();await lend({amount:'100000',account:'cash',rate:'5',date:'2026-01-02'});
 await entry('Loan repayment');change('Interest received','5000');change('Date','2026-02-02');await save();
 expect(moneyValue('Owed to you · principal')).toContain('100,000');expect(moneyValue('Available money · cash + bank')).toContain('5,000');
 fireEvent.click(screen.getByRole('button',{name:'View people & repayments'}));expect(screen.getByText('Interest received').closest('div').textContent).toContain('5,000');expect(screen.getByText('Principal outstanding').closest('div').textContent).toContain('100,000');
});
it('withdrawal validation leaves the form open, saves once, and ledger edits reverse correctly',async()=>{
 await mount();await entry('Withdraw from savings');change('Transfer amount','100001');fireEvent.click(screen.getByRole('button',{name:'Record',exact:true}));expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Insufficient savings'));expect(store.records).toHaveLength(0);
 change('Transfer amount','20000');await save();expect(store.records).toHaveLength(1);
 fireEvent.click(screen.getAllByRole('button',{name:'Ledger'})[0]);
 // New transfers use today's date, so they appear in the selected month.
 fireEvent.click(screen.getByRole('button',{name:/Withdraw from savings.*Savings → Cash/}));fireEvent.click(screen.getByRole('button',{name:'Edit',exact:true}));
 change('Transfer amount','10000');fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(store.records[0].amount).toBe(10000);
 fireEvent.click(screen.getAllByRole('button',{name:'Insights'})[0]);expect(screen.getByText('Total Savings').closest('.running-bal').textContent).toContain('90,000');
});
it('a rejected or stale save never reports success or displays an unsaved balance',async()=>{
 await mount();await entry('Money lent');change('Borrower name','Failed');change('Amount lent','1000');store.fail=true;
 fireEvent.click(screen.getByRole('button',{name:'Record',exact:true}));await screen.findByRole('heading',{name:'Refresh your saved records'});expect(store.records).toHaveLength(0);
});
