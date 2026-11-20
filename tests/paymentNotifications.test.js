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
test('limits remaining installments to 20 days and retains the correct sequence',()=>{
 const rows=build({cards:[card()],installmentPlans:[plan({startMonth:'2026-10'}),plan({id:'future',startMonth:'2027-01',totalMonths:2}),plan({id:'cancelled',active:false}),plan({id:'finished',startMonth:'2025-01'})]});
 const installments=rows.filter(r=>r.type==='installment');assert.deepEqual(installments.map(r=>r.month),['2026-11','2026-12']);assert.match(installments[0].detail,/Installment 2\/3/);assert.equal(installments[0].date,'2026-11-01');assert.equal(installments[1].date,'2026-12-01');
});
test('uses legacy recorded first-of-month schedules while preserving unknown card deadlines',()=>{
 const rows=build({cards:[card({paymentDueDate:''})],installmentPlans:[plan()]});
 assert.equal(rows.find(r=>r.type==='card').status,'date-needed');assert.equal(rows.find(r=>r.type==='installment'&&r.month==='2026-11').status,'overdue');assert.equal(rows.find(r=>r.month==='2026-12').status,'upcoming');assert.equal(paymentNotificationSections(rows)[0].rows.length,1);
});
test('uses month-specific completion IDs so completing a current installment does not hide future occurrences',()=>{
 const rows=build({installmentPlans:[plan()],recurringReminders:[reminder()],isCompleted:(month,id)=>month==='2026-11'&&['inst:plan','rec:rent'].includes(id)});
 assert.equal(rows.filter(r=>r.type==='installment').length,1);assert.equal(rows.filter(r=>r.type==='other').length,1);
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
 assert.equal(rows.filter(r=>r.type==='card').length,1);assert.equal(rows.find(r=>r.type==='card').amount,100000);assert.equal(rows.filter(r=>r.type==='installment').length,2);
});
test('uses the recorded installment amount when that occurrence was edited',()=>{
 const rows=build({installmentPlans:[plan()],transactions:[{id:'ptx_plan_0',type:'card-purchase',installmentId:'plan',date:'2026-11-01',amount:8000},{id:'ptx_plan_1',type:'card-purchase',installmentId:'plan',date:'2026-12-01',amount:10000}]});
 assert.equal(rows.find(r=>r.month==='2026-11').amount,8000);assert.equal(rows.find(r=>r.month==='2026-12').amount,10000);
});
test('a settled card retains its installment reminder without falsely calling it overdue',()=>{
 const rows=build({cards:[card({currentBalance:0,paymentDueDate:'2026-11-10'})],installmentPlans:[plan()]});
 assert.equal(rows.filter(r=>r.type==='card').length,0);assert.equal(rows.find(r=>r.month==='2026-11').status,'scheduled');assert.match(rows.find(r=>r.month==='2026-11').detail,/Card balance settled/);assert.equal(paymentNotificationSections(rows)[0].rows.length,0);
});
test('a recurring bill without a valid day is shown without an invented deadline',()=>{
 const rows=build({recurringReminders:[reminder({dayOfMonth:undefined})]});assert.equal(rows.length,2);assert.ok(rows.every(row=>row.date===null));assert.equal(paymentNotificationSections(rows)[0].rows.length,0);
});

test('includes today and exactly 20 days away, excludes day 21 regardless of card deadline',()=>{
 const rows=build({cards:[card({paymentDueDate:'2026-11-21'})],installmentPlans:[
  plan({id:'today',startDate:'2026-11-20'}),
  plan({id:'boundary',startMonth:'2026-12',startDate:'2026-12-10'}),
  plan({id:'outside',startMonth:'2026-12',startDate:'2026-12-11'}),
 ]}).filter(r=>r.type==='installment');
 assert.deepEqual(rows.map(r=>[r.sourceId,r.date,r.status]),[['today','2026-11-20','due'],['boundary','2026-12-10','upcoming']]);
});
test('uses edited transaction dates rather than bank deadlines or original plan dates',()=>{
 const rows=build({cards:[card({paymentDueDate:'2026-11-21'})],installmentPlans:[plan({startMonth:'2026-12',startDate:'2026-12-15'})],transactions:[{type:'card-purchase',installmentId:'plan',date:'2026-12-05',amount:7500}]});
 const installments=rows.filter(r=>r.type==='installment');assert.equal(installments.length,1);assert.equal(installments[0].date,'2026-12-05');assert.equal(installments[0].amount,7500);
});
test('20-day window crosses leap-year February and clamps month-end schedules',()=>{
 const rows=build({today:'2028-02-10',installmentPlans:[plan({startMonth:'2028-01',startDate:'2028-01-31'})]});
 assert.deepEqual(rows.map(r=>r.date),['2028-02-29']);
 assert.equal(build({today:'2028-02-08',installmentPlans:[plan({startMonth:'2028-01',startDate:'2028-01-31'})]}).length,0);
});
test('keeps current-month overdue reminders, completion and cancelled-plan filtering',()=>{
 const rows=build({installmentPlans:[plan({startDate:'2026-11-10'}),plan({id:'off',active:false})],isCompleted:(month,id)=>month==='2026-12'&&id==='inst:plan'});
 assert.deepEqual(rows.map(r=>[r.date,r.status]),[['2026-11-10','overdue']]);
});

test('moved installment dates cannot create phantom months or include charges outside the window',()=>{
 const rows=build({installmentPlans:[plan({id:'shift',startDate:'2026-11-25',totalMonths:2,monthlyAmount:1000})],transactions:[
 {id:'ptx_shift_0',type:'card-purchase',installmentId:'shift',date:'2026-12-05',amount:1000},
 {id:'ptx_shift_1',type:'card-purchase',installmentId:'shift',date:'2026-12-25',amount:1000}]});
 assert.deepEqual(rows.map(r=>[r.date,r.amount,r.sequence]),[['2026-12-05',1000,1]]);
});
test('two installments in one month retain independent amounts, dates and completion identities',()=>{
 const config={installmentPlans:[plan({startDate:'2026-11-25',totalMonths:2})],transactions:[
 {id:'ptx_plan_0',type:'card-purchase',installmentId:'plan',date:'2026-12-01',amount:8000},
 {id:'ptx_plan_1',type:'card-purchase',installmentId:'plan',date:'2026-12-05',amount:10000}]};
 const rows=build(config);assert.equal(rows.length,2);assert.equal(new Set(rows.map(r=>r.id)).size,2);
 assert.deepEqual(rows.map(r=>r.amount),[8000,10000]);
 const remaining=build({...config,isCompleted:(month,id)=>month===rows[0].completionMonth&&id===rows[0].completionId});
 assert.equal(remaining.length,1);assert.equal(remaining[0].occurrenceId,'ptx_plan_1');
});
test('explicit empty or partially deleted transaction schedules are not regenerated',()=>{
 assert.equal(build({installmentPlans:[plan()],transactions:[]}).length,0);
 const rows=build({installmentPlans:[plan()],transactions:[{id:'ptx_plan_1',type:'card-purchase',installmentId:'plan',date:'2026-12-01',amount:10000}]});
 assert.deepEqual(rows.map(r=>r.date),['2026-12-01']);
});
test('legacy completed keys still dismiss their original occurrence after a date move',()=>{
 const rows=build({installmentPlans:[plan({totalMonths:2})],transactions:[{id:'ptx_plan_0',type:'card-purchase',installmentId:'plan',date:'2026-12-05',amount:10000}],isCompleted:(month,id)=>month==='2026-11'&&id==='inst:plan'});
 assert.equal(rows.length,0);
});
