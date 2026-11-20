import test from 'node:test';
import assert from 'node:assert/strict';
import {moneyTransactions,moneyBalances,loanSummary,validateMoneyRecords,validateSavingsChange,anniversary} from '../src/utils/money.js';
import {isSpendableExpense} from '../src/constants/categories.js';

const savings={id:'saving',type:'expense',category:'savings-investments',amount:100000,date:'2026-01-01'};
const salary={id:'salary',type:'income',category:'fixed',amount:200000,date:'2026-01-01'};
const base=[salary,savings];
const loan=(extra={})=>({id:'l1',kind:'loan',borrower:'Person',amount:50000,account:'savings',date:'2026-01-02',rate:0,ratePeriod:'monthly',interestBasis:'original',arrangement:'flexible',...extra});
const pay=(extra={})=>({id:'p1',kind:'repayment',loanId:'l1',principal:50000,interest:0,account:'cash',date:'2026-02-02',...extra});
const balances=records=>moneyBalances([...base,...moneyTransactions(records)]);
test('example 1: savings-funded 0% loan and repayment to savings, once each',()=>{
 const l=loan();validateMoneyRecords([l],base,[],[]);
 assert.deepEqual(balances([l]),{cash:100000,bank:0,savings:50000,available:100000});
 const repayment=pay({account:'savings'});
 assert.equal(balances([l,repayment]).savings,100000);
 assert.equal(loanSummary(l,[l,repayment]).outstanding,0);
 assert.equal(moneyTransactions([l,repayment]).filter(t=>t.type==='income').length,0);
});
test('example 2: HNB credit loan, cash repayment, then separate card payment',()=>{
 const l=loan({amount:100000,account:'card',cardId:'hnb'}),r=pay({principal:100000});
 const projected=moneyTransactions([l,r]);
 assert.equal(projected.filter(t=>t.cardId==='hnb'&&t.type==='card-purchase').reduce((s,t)=>s+t.amount,0),100000);
 assert.equal(balances([l,r]).cash,200000);
 assert.equal(balances([l,r]).savings,100000);
 assert.equal(isSpendableExpense(projected[0]),false);
 assert.equal(moneyBalances([...base,...projected,{type:'card-payment',cardId:'hnb',account:'cash',amount:100000,date:'2026-02-03'}]).cash,100000);
 assert.equal(loanSummary(l,[l,r]).outstanding,0);
});
test('example 3: 5% monthly interest-only payments retain 100k principal',()=>{
 const l=loan({amount:100000,account:'bank',rate:5,arrangement:'interest-only'});
 const payments=[1,2,3].map(i=>pay({id:`p${i}`,date:anniversary(l.date,i),principal:0,interest:5000,account:'bank'}));
 const s=loanSummary(l,[l,...payments],'2026-04-02');
 assert.equal(s.outstanding,100000);assert.equal(s.interestReceived,15000);assert.equal(s.interestDue,0);
 const rows=moneyTransactions([l,...payments]);
 assert.equal(rows.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),15000);
 assert.equal(moneyBalances(rows).bank,-85000);
 assert.equal(loanSummary(l,[l],'2026-04-02').interestDue,15000);
});
test('withdrawals, bank transfers and repayment destinations reconcile without income',()=>{
 const transfer={id:'t',kind:'transfer',from:'savings',to:'bank',amount:20000,date:'2026-02-01'};
 assert.deepEqual(balances([transfer]),{cash:100000,bank:20000,savings:80000,available:120000});
 validateMoneyRecords([transfer],base,[],[]);
 const edited={...transfer,amount:30000};validateMoneyRecords([edited],base,[],[transfer]);assert.equal(balances([edited]).savings,70000);
 assert.equal(balances([]).savings,100000);
 assert.equal(moneyTransactions([transfer]).filter(t=>t.type==='income').length,0);
});
test('rejects overdrawn savings and backdated edits/deletion of a supporting contribution',()=>{
 const transfer={id:'t',kind:'transfer',from:'savings',to:'cash',amount:90000,date:'2026-02-01'};
 assert.throws(()=>validateMoneyRecords([{...transfer,amount:100001}],base,[],[]),/Insufficient savings/);
 assert.throws(()=>validateMoneyRecords([{...transfer,date:'2025-12-01'}],base,[],[]),/Insufficient savings/);
 const rows=[...base,...moneyTransactions([transfer])];
 assert.throws(()=>validateSavingsChange(rows,rows.filter(t=>t.id!=='saving')),/insufficient savings/);
 assert.throws(()=>validateMoneyRecords([transfer,loan({date:'2026-03-01'})],base,[],[transfer]),/Insufficient savings/);
});
test('rejects excess principal, deleting loans with repayments and dates before lending',()=>{
 const l=loan(),r=pay();
 assert.throws(()=>validateMoneyRecords([l,{...r,principal:50000.01}],base,[],[l]),/exceed/);
 assert.throws(()=>validateMoneyRecords([r],base,[],[l,r]),/Remove the repayments/);
 assert.throws(()=>validateMoneyRecords([l,{...r,date:'2026-01-01'}],base,[],[l]),/before its loan/);
 assert.throws(()=>validateMoneyRecords([l,{...r,interest:1}],base,[],[l]),/interest-free/);
});
test('remaining principal interest uses period-start balance, handles missed payments and stops after payoff',()=>{
 const l=loan({amount:100000,rate:5,interestBasis:'remaining',account:'cash'});
 const r=pay({principal:20000,interest:5000});
 assert.equal(loanSummary(l,[l,r],'2026-03-02').interestAccrued,9000);
 assert.equal(loanSummary(l,[l,r],'2026-03-02').interestDue,4000);
 const final=pay({id:'final',date:'2026-03-02',principal:80000,interest:4000});
 const s=loanSummary(l,[l,r,final],'2026-11-20');assert.equal(s.interestAccrued,9000);assert.equal(s.status,'Settled');assert.equal(s.nextInterestDate,null);
});
test('anniversaries clamp month end, annual terms accrue yearly, advances stay separate',()=>{
 assert.equal(anniversary('2024-01-31',1),'2024-02-29');assert.equal(anniversary('2026-01-31',2),'2026-03-31');
 const l=loan({date:'2025-01-02',rate:12,ratePeriod:'yearly',account:'cash'});
 assert.equal(loanSummary(l,[l],'2025-12-31').interestAccrued,0);
 assert.equal(loanSummary(l,[l],'2026-01-02').interestAccrued,6000);
 const advance=pay({date:'2025-02-01',principal:0,interest:6000});assert.equal(loanSummary(l,[l,advance],'2025-02-01').interestCredit,6000);
});
test('principal installment dues and historical balances use selected dates',()=>{
 const l=loan({amount:100000,account:'cash',arrangement:'installments',installmentMonths:4});
 assert.equal(loanSummary(l,[l],'2026-03-02').principalDue,50000);
 assert.equal(loanSummary(l,[l,pay({principal:25000})],'2026-03-02').principalDue,25000);
 assert.equal(moneyBalances([...base,...moneyTransactions([l])],'2026-01-01').cash,100000);
});
test('new card loans require a valid card, and legacy unlabeled entries stay Cash',()=>{
 assert.throws(()=>validateMoneyRecords([loan({account:'card',cardId:'missing'})],base,[],[]),/existing credit card/);
 const l=loan({account:'card',cardId:'hnb'});validateMoneyRecords([l],base,[{id:'hnb'}],[]);
 assert.equal(moneyBalances([salary]).cash,200000);
 assert.equal(moneyBalances([{...salary,account:'bank'}]).bank,200000);
});
