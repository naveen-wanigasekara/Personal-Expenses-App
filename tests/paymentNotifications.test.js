import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPaymentNotifications, paymentNotificationSections } from '../src/utils/paymentNotifications.js';
const today='2026-11-20';
const card=(extra={})=>({id:'hnb',name:'HNB',currentBalance:100000,paymentDueDate:'2026-11-25',...extra});
const plan=(extra={})=>({id:'plan',cardId:'hnb',label:'Purchase',startMonth:'2026-11',totalMonths:3,monthlyAmount:10000,active:true,...extra});
const reminder=(extra={})=>({id:'rent',label:'Rent',amount:50000,dayOfMonth:15,active:true,...extra});
const build=(extra={})=>buildPaymentNotifications({today,...extra});
test('categorizes overdue, due-today and upcoming payments without duplicating sections',()=>{
 const rows=build({cards:[card({paymentDueDate:'2026-11-10'}),card({id:'due',paymentDueDate:today}),card({id:'soon'})],recurringReminders:[reminder()]});
 const sections=paymentNotificationSections(rows);assert.equal(sections[0].rows.length,3);assert.equal(sections[1].rows.length,1);assert.equal(sections[3].rows.length,1);
 assert.equal(sections.flatMap(s=>s.rows).length,rows.length);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 assert.equal(rows.find(r=>r.sourceId==='due').status,'due');assert.equal(rows.find(r=>r.sourceId==='soon').status,'upcoming');
});
test('includes every remaining installment, including future-start plans, and retains the correct sequence',()=>{
 const rows=build({cards:[card()],installmentPlans:[plan({startMonth:'2026-10'}),plan({id:'future',startMonth:'2027-01',totalMonths:2}),plan({id:'cancelled',active:false}),plan({id:'finished',startMonth:'2025-01'})]});
 const installments=rows.filter(r=>r.type==='installment');assert.deepEqual(installments.map(r=>r.month),['2026-11','2026-12','2027-01','2027-02']);assert.match(installments[0].detail,/Installment 2\/3/);assert.equal(installments[0].date,'2026-11-25');assert.equal(installments[1].date,null);
});
test('does not invent exact installment/card deadlines or treat a month-only schedule as overdue',()=>{
 const rows=build({cards:[card({paymentDueDate:''})],installmentPlans:[plan()]});
 assert.equal(rows.find(r=>r.type==='card').status,'date-needed');assert.equal(rows.find(r=>r.type==='installment'&&r.month==='2026-11').status,'date-needed');assert.equal(rows.find(r=>r.month==='2026-12').status,'upcoming');assert.equal(paymentNotificationSections(rows)[0].rows.length,0);
});
test('uses month-specific completion IDs so completing a current installment does not hide future occurrences',()=>{
 const rows=build({installmentPlans:[plan()],recurringReminders:[reminder()],isCompleted:(month,id)=>month==='2026-11'&&['inst:plan','rec:rent'].includes(id)});
 assert.equal(rows.filter(r=>r.type==='installment').length,2);assert.equal(rows.filter(r=>r.type==='other').length,1);
 assert.equal(rows.find(r=>r.type==='other').month,'2026-12');
});
test('preserves category-based recurring auto-dismiss per month and includes the next occurrence',()=>{
 const rows=build({recurringReminders:[reminder({category:'rent'})],transactions:[{type:'expense',date:'2026-11-01',category:'rent',amount:50000}]});
 assert.equal(rows.length,1);assert.equal(rows[0].date,'2026-12-15');
});
test('clamps reminder dates for short months and skips inactive reminders',()=>{
 const rows=build({today:'2027-02-10',recurringReminders:[reminder({dayOfMonth:31}),reminder({id:'off',active:false})]});
 assert.deepEqual(rows.map(r=>r.date),['2027-02-28','2027-03-31']);
});
test('card reminders show current outstanding balances without adding installment debt again',()=>{
 const rows=build({cards:[card(),card({id:'settled',currentBalance:0}),card({id:'credit',currentBalance:-100})],installmentPlans:[plan()]});
 assert.equal(rows.filter(r=>r.type==='card').length,1);assert.equal(rows.find(r=>r.type==='card').amount,100000);assert.equal(rows.filter(r=>r.type==='installment').length,3);
});
test('uses the recorded installment amount when that occurrence was edited',()=>{
 const rows=build({installmentPlans:[plan()],transactions:[{type:'card-purchase',installmentId:'plan',date:'2026-11-01',amount:8000}]});
 assert.equal(rows.find(r=>r.month==='2026-11').amount,8000);assert.equal(rows.find(r=>r.month==='2026-12').amount,10000);
});
test('a settled card retains its installment reminder without falsely calling it overdue',()=>{
 const rows=build({cards:[card({currentBalance:0,paymentDueDate:'2026-11-10'})],installmentPlans:[plan()]});
 assert.equal(rows.filter(r=>r.type==='card').length,0);assert.equal(rows.find(r=>r.month==='2026-11').status,'scheduled');assert.match(rows.find(r=>r.month==='2026-11').detail,/Card balance settled/);assert.equal(paymentNotificationSections(rows)[0].rows.length,0);
});
test('a recurring bill without a valid day is shown without an invented deadline',()=>{
 const rows=build({recurringReminders:[reminder({dayOfMonth:undefined})]});assert.equal(rows.length,2);assert.ok(rows.every(row=>row.date===null));assert.equal(paymentNotificationSections(rows)[0].rows.length,0);
});
