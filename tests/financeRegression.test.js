import test from 'node:test';
import assert from 'node:assert/strict';
import {getFdInfo} from '../src/utils/investmentCalc.js';
import {getCat,NEW_SIGNUP_EXPENSE_CATEGORIES,INCOME_CATEGORIES} from '../src/constants/categories.js';
import {isValidMoneyDraft} from '../src/utils/moneyInput.js';
const fd=(overrides={},today=new Date(2026,1,28))=>getFdInfo({initialAmount:1000,interestRate:12,tenureMonths:1,payoutFrequency:'monthly',startDate:'2026-01-31',...overrides},today);
test('month-end FD maturity clamps to February and completes its monthly interest',()=>{
 const result=fd();assert.equal(result.maturityDate,'2026-02-28');assert.equal(result.isMatured,true);assert.equal(result.totalEarned,10);assert.equal(result.nextPayoutDate,null);
});
test('FD maturity handles leap years and December rollover',()=>{
 assert.equal(fd({startDate:'2024-01-31'}).maturityDate,'2024-02-29');assert.equal(fd({startDate:'2025-12-31',tenureMonths:2}).maturityDate,'2026-02-28');
});
test('quarterly FD includes a partial final period and shows the correct next payout',()=>{
 const config={startDate:'2026-01-01',tenureMonths:5,payoutFrequency:'quarterly'};
 const before=fd(config,new Date(2026,3,2));assert.equal(before.totalEarned,30);assert.equal(before.totalAtMaturity,50);assert.equal(before.nextPayoutDate,'2026-06-01');assert.equal(before.nextPayoutAmount,20);
 assert.equal(fd(config,new Date(2026,5,1)).totalEarned,50);
});
test('at-maturity FD next payout is interest instead of zero',()=>{
 const result=fd({payoutFrequency:'maturity',startDate:'2026-01-01',tenureMonths:12},new Date(2026,1,1));assert.equal(result.nextPayoutAmount,120);assert.equal(result.totalEarned,0);
});
test('no FD payouts accrue before start; shorter-than-frequency term pays at maturity',()=>{
 const result=fd({startDate:'2026-03-01',tenureMonths:1,payoutFrequency:'quarterly'},new Date(2026,1,1));assert.equal(result.totalEarned,0);assert.equal(result.nextPayoutDate,'2026-04-01');assert.equal(result.nextPayoutAmount,10);
});
test('orphaned categories stay in a catch-all after custom categories are appended',()=>{
 const custom={id:'custom-qa',label:'QA custom'};const expenses=[...NEW_SIGNUP_EXPENSE_CATEGORIES,custom];
 assert.equal(getCat('old-deleted','expense',expenses,INCOME_CATEGORIES).id,'misc');
 assert.equal(getCat('old-deleted','income',expenses,[...INCOME_CATEGORIES,custom]).id,'other-income');
 assert.equal(getCat('custom-qa','expense',expenses,INCOME_CATEGORIES),custom);
});
test('empty or catch-all-deleted category lists retain a safe fallback',()=>{
 assert.equal(getCat('missing','expense',[],[]).id,'other');
 assert.equal(getCat('missing','expense',[{id:'savings-investments'}],[]).id,'other');
});
test('amount input accepts cents and rejects invisible precision or non-finite values',()=>{
 for(const value of ['', '.', '0','0.00','0.01','1234567.89'])assert.equal(isValidMoneyDraft(value),true,value);
 for(const value of ['1.234','Infinity','NaN','-1','1e5','1,000','9'.repeat(400)])assert.equal(isValidMoneyDraft(value),false,value);
});


import {elapsedInstallments, validInstallmentMonths} from '../src/utils/installments.js';
test('future installment plans have zero billed months when edited',()=>{
 assert.equal(elapsedInstallments({startMonth:'2026-12',totalMonths:3},'2026-10'),0);
 assert.equal(elapsedInstallments({startMonth:'2026-10',totalMonths:3},'2026-10'),1);
 assert.equal(elapsedInstallments({startMonth:'2025-10',totalMonths:3},'2026-10'),3);
});
test('installment durations enforce UI limits while preserving existing long plans',()=>{
 for(const n of [0,1,1.5,121,Infinity])assert.equal(validInstallmentMonths(n),false);
 assert.equal(validInstallmentMonths(120),true);
 assert.equal(validInstallmentMonths(1,1,3),true);
 assert.equal(validInstallmentMonths(2,3,4),false);
 assert.equal(validInstallmentMonths(150,20,150),true);
 assert.equal(validInstallmentMonths(151,20,150),false);
});

import {validDate,validMonth} from '../src/utils/dateInput.js';
test('date and month inputs reject empty or impossible values before recording money',()=>{
 for(const date of ['', '2026-02-30','2026-13-01','0000-01-01',undefined])assert.equal(validDate(date),false);
 for(const date of ['2024-02-29','2026-10-29'])assert.equal(validDate(date),true);
 for(const month of ['', '2026-00','2026-13','0000-01'])assert.equal(validMonth(month),false);
 assert.equal(validMonth('2026-12'),true);
});
