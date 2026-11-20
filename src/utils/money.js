import { validDate } from './dateInput.js';

export const SAVINGS_ID = 'savings-investments';
export const roundMoney = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
export const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
export const accountLabel = id => ({ cash: 'Cash', bank: 'Bank', savings: 'Savings', card: 'Credit card' }[id] || id);
export const isMoneyRecord = r => ['loan','repayment','transfer'].includes(r.kind);
export function anniversary(date, months) {
  const [y,m,d] = date.split('-').map(Number);
  const last = new Date(Date.UTC(y,m-1+months+1,0)).getUTCDate();
  return new Date(Date.UTC(y,m-1+months,Math.min(d,last))).toISOString().slice(0,10);
}

// Project money records into the existing ledger. They are derived, never
// inserted again as income/expenses. Repayments have separate principal and
// interest lines so only the latter enters income reports.
export function moneyTransactions(records) {
  const loans = new Map(records.filter(r=>r.kind==='loan').map(r=>[r.id,r]));
  return records.flatMap(r => {
    const base = { id:r.id, moneyRecordId:r.id, date:r.date, account:r.account, cardId:r.kind==='loan' && r.account==='card' ? r.cardId : null, note:r.note || '' };
    if (r.kind==='loan') return [{...base, type:r.account==='card'?'card-purchase':'loan-lent', isLoan:true, category:'money-lent', amount:r.amount, note:`Lent to ${r.borrower}${r.note?` · ${r.note}`:''}` }];
    if (r.kind==='transfer') return [{...base, type:'transfer', amount:r.amount, from:r.from, to:r.to, note:`${r.from==='savings'?'Withdraw from savings':'Transfer'} · ${accountLabel(r.from)} → ${accountLabel(r.to)}${r.note?` · ${r.note}`:''}`}];
    if (r.kind!=='repayment') return [];
    const name = loans.get(r.loanId)?.borrower || 'Borrower';
    return [
      ...(r.principal>0?[{...base,id:`${r.id}:principal`,type:'loan-principal',amount:r.principal,note:`Principal received from ${name}${r.note?` · ${r.note}`:''}`}]:[]),
      ...(r.interest>0?[{...base,id:`${r.id}:interest`,type:'income',category:'loan-interest',isLoanInterest:true,amount:r.interest,note:`Interest received from ${name}${r.note?` · ${r.note}`:''}`}]:[]),
    ];
  });
}

export function moneyBalances(transactions, through='9999-12-31') {
  const b = {cash:0,bank:0,savings:0};
  const add = (account,amount) => { if (Object.hasOwn(b,account)) b[account] += Number(amount); };
  for (const t of transactions) {
    if (t.date>through) continue;
    const amount = Number(t.amount), account=t.account || 'cash';
    if (t.type==='income' || t.type==='loan-principal') add(account,amount);
    else if (t.type==='loan-lent') add(account,-amount);
    else if (t.type==='transfer') { add(t.from,-amount); add(t.to,amount); }
    else if (t.type==='expense') {
      add(account,-amount);
      if (t.category===SAVINGS_ID) add('savings',amount);
    } else if (t.type==='card-payment') add(account,-amount);
  }
  for (const k of Object.keys(b)) b[k]=roundMoney(b[k]);
  return {...b,available:roundMoney(b.cash+b.bank)};
}

export function loanSummary(loan, records, through=todayLocal()) {
  const payments=records.filter(r=>r.kind==='repayment'&&r.loanId===loan.id&&r.date<=through).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  const principalReturned=roundMoney(payments.reduce((s,r)=>s+Number(r.principal),0));
  const interestReceived=roundMoney(payments.reduce((s,r)=>s+Number(r.interest),0));
  const outstanding=roundMoney(Number(loan.amount)-principalReturned);
  let interestAccrued=0, nextInterestDate=null;
  const step=loan.ratePeriod==='yearly'?12:1;
  // Interest is simple, charged on completed monthly/yearly anniversaries.
  // Principal paid on a due date reduces the NEXT period's interest.
  if (Number(loan.rate)>0) for(let i=1;i<=12000;i++) {
    const start=anniversary(loan.date,(i-1)*step), due=anniversary(loan.date,i*step);
    const returned=payments.filter(p=>p.date<=start).reduce((s,p)=>s+Number(p.principal),0);
    const remaining=Math.max(0,Number(loan.amount)-returned);
    if (remaining<=0) break;
    if (due>through) { nextInterestDate=due; break; }
    // A fully settled loan stops accruing at payoff; no partial-period charge.
    const paidByDue=payments.filter(p=>p.date<due).reduce((s,p)=>s+Number(p.principal),0);
    if (paidByDue>=Number(loan.amount)) break;
    const basis=loan.interestBasis==='remaining'?remaining:Number(loan.amount);
    interestAccrued=roundMoney(interestAccrued+roundMoney(basis*Number(loan.rate)/100));
  }
  const interestDue=Math.max(0,roundMoney(interestAccrued-interestReceived));
  const interestCredit=Math.max(0,roundMoney(interestReceived-interestAccrued));
  let principalDue=loan.dueDate&&loan.dueDate<=through?outstanding:0;
  let nextPrincipalDate=loan.dueDate&&loan.dueDate>through?loan.dueDate:null;
  if (loan.arrangement==='installments') {
    let scheduled=0;
    for(let i=1;i<=Number(loan.installmentMonths);i++) {
      const due=anniversary(loan.date,i);
      if(due<=through) scheduled=Math.min(Number(loan.amount),scheduled+Number(loan.amount)/Number(loan.installmentMonths));
      else {nextPrincipalDate=due;break;}
    }
    principalDue=Math.max(principalDue,roundMoney(scheduled-principalReturned),0);
  }
  if (outstanding<=0) nextPrincipalDate=null;
  return {principalReturned,interestReceived,outstanding,interestAccrued,interestDue,interestCredit,nextInterestDate:outstanding>0?nextInterestDate:null,nextPrincipalDate,principalDue,
    status:outstanding<=0&&interestDue<=0?'Settled':principalDue>0||interestDue>0?'Payment due':'Active', payments};
}

const validAmount = (value,zero=false) => Number.isFinite(Number(value)) && Number(value)>=(zero?0:0.01) && Number(value)<=1e12 && Math.abs(Number(value)*100-Math.round(Number(value)*100))<0.001;
export function validateMoneyRecords(records, transactions, cards=[], previous=[]) {
  const loans=new Map(records.filter(r=>r.kind==='loan').map(r=>[r.id,r]));
  for(const r of records.filter(isMoneyRecord)) {
    if(!validDate(r.date)||r.date>todayLocal()) throw new Error('Choose a valid date that is not in the future.');
    if((r.note||'').length>1000) throw new Error('Keep notes within 1,000 characters.');
    if(r.kind==='loan') {
      if(!r.borrower?.trim()||r.borrower.length>120||!validAmount(r.amount)) throw new Error('Enter a borrower and a valid loan amount.');
      if(!['cash','bank','savings','card'].includes(r.account)) throw new Error('Choose a funding source.');
      const old=previous.find(p=>p.id===r.id);
      if(r.account==='card'&&!cards.some(c=>c.id===r.cardId)&&!(old?.account==='card'&&old.cardId===r.cardId)) throw new Error('Choose an existing credit card.');
      if(!Number.isFinite(Number(r.rate))||Number(r.rate)<0||Number(r.rate)>100||!['monthly','yearly'].includes(r.ratePeriod)||!['original','remaining'].includes(r.interestBasis)) throw new Error('Enter valid interest terms (0–100% per period).');
      if(!['single','interest-only','installments','flexible'].includes(r.arrangement)) throw new Error('Choose a repayment arrangement.');
      if(r.dueDate&&(!validDate(r.dueDate)||r.dueDate<r.date)) throw new Error('The due date cannot be before the lending date.');
      if(r.arrangement==='installments'&&(!Number.isInteger(Number(r.installmentMonths))||r.installmentMonths<1||r.installmentMonths>120)) throw new Error('Choose 1–120 monthly principal installments.');
    } else if(r.kind==='repayment') {
      const loan=loans.get(r.loanId);
      if(!loan) throw new Error('Remove the repayments before deleting this loan.');
      if(!['cash','bank','savings'].includes(r.account)||!validAmount(r.principal,true)||!validAmount(r.interest,true)||Number(r.principal)+Number(r.interest)<=0) throw new Error('Enter principal and/or interest received, and a receiving account.');
      if(r.date<loan.date) throw new Error('A repayment cannot be dated before its loan.');
      if(Number(loan.rate)===0&&Number(r.interest)>0) throw new Error('This loan is interest-free. Record the payment as principal.');
    } else if(!validAmount(r.amount)||!['cash','bank','savings'].includes(r.from)||!['cash','bank','savings'].includes(r.to)||r.from===r.to) throw new Error('Choose different transfer accounts and a valid amount.');
  }
  for(const loan of loans.values()) if(roundMoney(records.filter(r=>r.kind==='repayment'&&r.loanId===loan.id).reduce((s,r)=>s+Number(r.principal),0))>Number(loan.amount)) throw new Error(`Principal repayments exceed the amount lent to ${loan.borrower}.`);
  // Check every affected date, including backdated edits/deletions. Preserve
  // legacy deficits without allowing a new withdrawal to deepen them.
  const nextTx=[...transactions,...moneyTransactions(records)], oldTx=[...transactions,...moneyTransactions(previous)];
  try { validateSavingsChange(oldTx,nextTx); }
  catch { throw new Error('Insufficient savings on this date, or this change would invalidate a later withdrawal.'); }
}

export function validateSavingsChange(beforeTransactions, afterTransactions) {
  // Aggregate daily deltas once; a long ledger should not require rescanning
  // every transaction for every date whenever a user records a withdrawal.
  const before=new Map(),after=new Map();
  for(const [rows,map] of [[beforeTransactions,before],[afterTransactions,after]]) {
    for(const t of rows) {
      const delta=moneyBalances([t]).savings;
      if(delta) map.set(t.date,(map.get(t.date)||0)+delta);
    }
  }
  let previous=0,next=0;
  for(const date of [...new Set([...before.keys(),...after.keys()])].sort()) {
    previous=roundMoney(previous+(before.get(date)||0));
    next=roundMoney(next+(after.get(date)||0));
    if(next<Math.min(0,previous)-0.005) throw new Error('This change would leave insufficient savings for an existing withdrawal or loan.');
  }
}
