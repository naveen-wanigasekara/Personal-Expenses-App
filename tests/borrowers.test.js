import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { borrowerGroups, bindLoanBorrower, saveBorrowerProfile, mergeBorrowerProfiles, deleteBorrowerProfile, validateBorrowerProfiles } from '../src/utils/borrowers.js';
import { entryDirection, isLoanArchived, loanSummary, moneyBalances, moneyTransactions, validateMoneyRecords } from '../src/utils/money.js';
const loan = (extra = {}) => ({ id:'loan1',kind:'loan',borrower:'Saman',amount:50000,account:'cash',date:'2026-01-01',rate:0,ratePeriod:'monthly',interestBasis:'original',arrangement:'flexible',...extra });
const pay = (extra = {}) => ({id:'pay1',kind:'repayment',loanId:'loan1',principal:50000,interest:0,account:'cash',date:'2026-02-01',...extra});
const profile = (extra = {}) => ({id:'person1',kind:'borrower',name:'Saman',note:'',legacyNames:[],...extra});
const projection = rows => moneyBalances(moneyTransactions(rows));
test('legacy loans group by exact name; case and internal spacing do not silently merge', () => {
 const rows=[loan(),loan({id:'loan2',date:'2026-02-01'}),loan({id:'loan3',borrower:'saman'}),loan({id:'loan4',borrower:'Sa man'})];
 const groups=borrowerGroups(rows);
 assert.equal(groups.length,3);assert.equal(groups.find(g=>g.name==='Saman').loans.length,2);
 assert.deepEqual(rows[0],loan());
});
test('registers a borrower without any balance effects and prevents ambiguous duplicate names', () => {
 const saved=saveBorrowerProfile([],{name:'  Saman   Silva ',note:'Friend'},()=> 'person1');
 assert.equal(saved.profile.name,'Saman Silva');assert.deepEqual(projection(saved.records),projection([]));
 assert.throws(()=>saveBorrowerProfile(saved.records,{name:'saman silva'},()=> 'person2'),/already exists/);
 assert.throws(()=>saveBorrowerProfile([],{name:' '.repeat(4)},()=> 'x'),/name/);
 assert.throws(()=>saveBorrowerProfile([],{name:'A',note:'x'.repeat(1001)},()=> 'x'),/notes/);
});
test('repeated lending binds to the same identity and retains separate funding, dates and terms', () => {
 const first=bindLoanBorrower([],{borrower:'Saman'},()=> 'person1');
 const a=loan({borrowerId:first.borrowerId}),second=bindLoanBorrower([...first.records,a],{borrowerId:first.borrowerId},()=> {throw Error('Must reuse borrower');});
 const b=loan({id:'loan2',borrowerId:second.borrowerId,amount:100000,account:'card',cardId:'hnb',rate:5,date:'2026-02-01'});
 const rows=[...second.records,b];validateMoneyRecords(rows,[],[{id:'hnb'}]);
 assert.equal(borrowerGroups(rows).length,1);assert.deepEqual(borrowerGroups(rows)[0].loans,[a,b]);
 assert.equal(loanSummary(a,rows,'2026-03-01').interestDue,0);assert.equal(loanSummary(b,rows,'2026-03-01').interestDue,5000);
});
test('legacy promotion and rename update displayed names without rewriting any loan or repayment', () => {
 const a=loan(),p=pay(),original=structuredClone([a,p]);
 const legacy=borrowerGroups([a,p])[0];
 const saved=saveBorrowerProfile([a,p],{id:legacy.id,name:'Saman Silva',note:'Renamed'},()=> 'person1');
 assert.deepEqual(saved.records.slice(0,2),original);assert.equal(borrowerGroups(saved.records)[0].name,'Saman Silva');
 assert.match(moneyTransactions(saved.records)[1].note,/Saman Silva/);
 assert.deepEqual(projection(saved.records),projection(original));
});
test('explicit merges join existing profile histories while leaving all finances intact', () => {
 const rows=[profile(),profile({id:'person2',name:'S. Silva'}),loan({borrowerId:'person1'}),loan({id:'loan2',borrowerId:'person2',borrower:'S. Silva',rate:5}),pay()];
 const merged=mergeBorrowerProfiles(rows,'person2','person1',()=> 'unused');validateBorrowerProfiles(merged.records);
 assert.equal(borrowerGroups(merged.records).length,1);assert.equal(borrowerGroups(merged.records)[0].loans.length,2);
 assert.deepEqual(merged.records.filter(r=>r.kind!=='borrower'),rows.filter(r=>r.kind!=='borrower'));
 assert.deepEqual(projection(merged.records),projection(rows));
 assert.throws(()=>mergeBorrowerProfiles(rows,'person1','person1',()=>''),/different/);
});
test('explicit legacy case-variant merge is safe and remains linked after registration and rename', () => {
 const rows=[loan(),loan({id:'loan2',borrower:'saman'}),pay()];const groups=borrowerGroups(rows);
 const merged=mergeBorrowerProfiles(rows,groups.find(g=>g.name==='saman').id,groups.find(g=>g.name==='Saman').id,()=> 'person1');
 assert.equal(borrowerGroups(merged.records).length,1);validateBorrowerProfiles(merged.records);
 const renamed=saveBorrowerProfile(merged.records,{id:'person1',name:'Saman Silva'},()=> 'unused');
 assert.equal(borrowerGroups(renamed.records)[0].loans.length,2);
 assert.deepEqual(projection(renamed.records),projection(rows));
});
test('rejects invalid borrower references, merge cycles and duplicate registered profiles', () => {
 assert.throws(()=>validateBorrowerProfiles([loan({borrowerId:'missing'})]),/valid borrower/);
 assert.throws(()=>validateBorrowerProfiles([profile({mergedInto:'missing'})]),/Invalid borrower merge/);
 assert.throws(()=>validateBorrowerProfiles([profile({mergedInto:'person2'}),profile({id:'person2',name:'B',mergedInto:'person1'})]),/Invalid borrower merge/);
 assert.throws(()=>validateBorrowerProfiles([profile(),profile({id:'person2',name:'saman'})]),/Duplicate/);
});
test('archives only after principal and all accrued interest are settled', () => {
 const a=loan({rate:5});const principal=pay();const rows=[a,principal];
 assert.equal(isLoanArchived(a,rows,'2026-02-01'),false);assert.equal(loanSummary(a,rows,'2026-02-01').interestDue,2500);
 const interest=pay({id:'pay2',principal:0,interest:2500,date:'2026-02-02'});
 assert.equal(isLoanArchived(a,[...rows,interest],'2026-02-02'),true);
 assert.equal(isLoanArchived(a,[...rows,interest],'2026-01-31'),false);
});
test('manual archive and restore preserve outstanding debt and all balances', () => {
 const a=loan(),archived={...a,archived:true,archivedAt:'2026-02-01'};
 assert.equal(isLoanArchived(a,[a],'2026-02-01'),false);assert.equal(isLoanArchived(archived,[archived],'2026-02-01'),true);
 assert.deepEqual(loanSummary(a,[a],'2026-02-01'),loanSummary(archived,[archived],'2026-02-01'));
 assert.deepEqual(projection([archived]),projection([a]));
 assert.equal(isLoanArchived({...archived,archived:false},[a],'2026-02-01'),false);
});
test('entry directions cover receipts and payments without changing report classification', () => {
 const rows=moneyTransactions([loan(),pay({interest:100}),{kind:'transfer',id:'t',date:'2026-02-01',from:'savings',to:'cash',amount:1000}]);
 assert.deepEqual(rows.map(entryDirection),['expense','income','income','income']);
 assert.equal(rows.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0),100);
 assert.equal(entryDirection({type:'transfer',from:'cash',to:'savings'}),'expense');
 assert.equal(entryDirection({type:'transfer',from:'cash',to:'bank'}),'internal');
 for(const type of ['card-payment','card-purchase','card-interest','expense']) assert.equal(entryDirection({type}),'expense');
});
test('received activity palettes have readable normal text in both themes', () => {
 const css=readFileSync(new URL('../src/styles/money.css',import.meta.url),'utf8');
 const luminance=hex=>hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[0.2126,0.7152,0.0722][i],0);
 for(const [ink,bg] of [['84efb7','19372d'],['11633d','e7f5ec']]) {
   assert.ok(css.includes(`#${ink}`)&&css.includes(`#${bg}`));const a=luminance(ink),b=luminance(bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);
 }
 assert.match(css,/\.activity-status/);assert.match(css,/border-left:3px solid var\(--received-edge\)/);
});

test('deletes empty borrowers and merged aliases without changing other records or balances', () => {
 const rows=[profile(),profile({id:'alias',name:'Alias',mergedInto:'person1'}),profile({id:'alias2',name:'Alias two',mergedInto:'alias'}),profile({id:'other',name:'Other'}),loan({borrowerId:'other',borrower:'Other'})];
 const next=deleteBorrowerProfile(rows,'person1');
 validateBorrowerProfiles(next);
 assert.deepEqual(next,rows.slice(3));
 assert.deepEqual(projection(next),projection(rows));
 assert.equal(rows.length,5);
});
test('blocks borrower deletion with active, settled, archived or legacy loan history', () => {
 const base=loan({borrowerId:'person1'});
 for (const history of [[base],[base,pay()],[{...base,archived:true}],[{...loan(),borrowerId:undefined}]]) {
  const rows=[profile({legacyNames:['Saman']}),...history];
  assert.throws(()=>deleteBorrowerProfile(rows,'person1'),/loan history/);
 }
 const merged=[profile(),profile({id:'alias',name:'Alias',mergedInto:'person1'}),loan({borrowerId:'alias'})];
 assert.throws(()=>deleteBorrowerProfile(merged,'person1'),/loan history/);
 assert.throws(()=>deleteBorrowerProfile([profile()],'missing'),/not found/);
});
