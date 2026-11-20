import { useRef, useState } from 'react';
import Sheet from './Sheet.jsx';
import AmountInput from './AmountInput.jsx';
import { accountLabel, loanSummary, todayLocal } from '../utils/money.js';

export default function MoneyForm({ kind, editing, cards, records, initialLoanId, onClose, onSave }) {
  const [draft,setDraft]=useState(()=>({kind,borrower:'',amount:'',account:'cash',cardId:cards[0]?.id||'',rate:0,ratePeriod:'monthly',interestBasis:'original',arrangement:'flexible',installmentMonths:12,dueDate:'',date:todayLocal(),note:'',loanId:initialLoanId||records.find(r=>r.kind==='loan')?.id||'',principal:'',interest:'',from:kind==='withdrawal'?'savings':'cash',to:'cash',...editing,kind:kind==='withdrawal'?'transfer':kind}));
  const [saving,setSaving]=useState(false), [error,setError]=useState('');
  const lock=useRef(false);
  const set=(key,value)=>setDraft(p=>({...p,[key]:value}));
  const field=(key,label,type='text',props={})=><label className="money-field"><span>{label}</span><input className="text-input" aria-label={label} type={type} value={draft[key]} onChange={e=>set(key,e.target.value)} {...props}/></label>;
  const amount=(key,label)=><label className="money-field"><span>{label}</span><AmountInput aria-label={label} className="text-input" value={draft[key]} onChange={v=>set(key,v)} placeholder="0.00"/></label>;
  const select=(key,label,options)=><label className="money-field"><span>{label}</span><select className="text-input" aria-label={label} value={draft[key]} onChange={e=>set(key,e.target.value)}>{options.map(([id,text])=><option key={id} value={id}>{text}</option>)}</select></label>;
  const accounts=['cash','bank','savings'].map(id=>[id,accountLabel(id)]);
  const selected=records.find(r=>r.kind==='loan'&&r.id===draft.loanId);
  const summary=selected?loanSummary(selected,records.filter(r=>r.id!==editing?.id),draft.date):null;
  const title=kind==='loan'?'Money lent':kind==='repayment'?'Loan repayment':kind==='withdrawal'?'Withdraw from savings':'Transfer money';
  const submit=async e=>{
    e.preventDefault();if(lock.current) return;lock.current=true;setSaving(true);setError('');
    try {await onSave({...draft,amount:Number(draft.amount),principal:Number(draft.principal),interest:Number(draft.interest),rate:Number(draft.rate),installmentMonths:Number(draft.installmentMonths)});}
    catch(err){setError(err.message||'Could not save. Please try again.');}
    finally{lock.current=false;setSaving(false);}
  };
  return <Sheet title={`${editing?'Edit: ':''}${title}`} className="sheet-wide money-sheet" onClose={()=>{if(!lock.current) onClose();}}>
    <form onSubmit={submit} className="money-form">
      <fieldset disabled={saving}>
      {draft.kind==='loan'&&<>
        {field('borrower','Borrower name','text',{required:true,maxLength:120})}
        {amount('amount','Amount lent')}
        {select('account','Funding source',[...accounts,...(cards.length?[['card','Credit card']]:[])])}
        {draft.account==='card'&&select('cardId','Credit card',[...cards.map(c=>[c.id,c.name]),...(draft.cardId&&!cards.some(c=>c.id===draft.cardId)?[[draft.cardId,'Previously selected card (deleted)']]:[])])}
        <div className="money-fields">{field('rate','Interest rate (%)','number',{min:0,max:100,step:'0.01',required:true})}{select('ratePeriod','Rate period',[['monthly','Per month'],['yearly','Per year']])}</div>
        {Number(draft.rate)>0&&select('interestBasis','Interest calculation',[['original','On original amount'],['remaining','On remaining principal']])}
        {select('arrangement','Repayment arrangement',[['flexible','Flexible'],['single','Single payment'],['interest-only','Interest only; principal separately'],['installments','Monthly principal installments']])}
        {draft.arrangement==='installments'&&field('installmentMonths','Number of monthly installments','number',{min:1,max:120,step:1,required:true})}
        {field('dueDate','Principal due date (optional)','date')}
        <p className="money-hint">0% means interest-free. Interest is simple, due on each completed {draft.ratePeriod==='yearly'?'year':'month'} from the lending date. No automatic compounding or partial-period interest. Bank/card fees are recorded separately.</p>
      </>}
      {draft.kind==='repayment'&&<>
        {select('loanId','Loan',records.filter(r=>r.kind==='loan').map(r=>[r.id,`${r.borrower} · ${r.amount.toLocaleString()}`]))}
        {summary&&<p className="money-hint">Principal outstanding: {summary.outstanding.toLocaleString()}. Interest due: {summary.interestDue.toLocaleString()}.</p>}
        <div className="money-fields">{amount('principal','Principal returned')}{amount('interest','Interest received')}</div>
        {select('account','Received into',accounts)}
        <p className="money-hint">Only interest counts as income. Receiving cash does not pay your credit card. Record a separate Card Payment when you pay the bank.</p>
      </>}
      {draft.kind==='transfer'&&<>
        {amount('amount','Transfer amount')}
        {select('from','From account',accounts)}
        {select('to','To account',accounts)}
        <p className="money-hint">Moves your own money between balances. Does not count as income or spending.</p>
      </>}
      {field('date',draft.kind==='loan'?'Date lent':'Date','date',{required:true,max:todayLocal()})}
      {field('note','Note (optional)','text',{maxLength:1000})}
      </fieldset>
      {error&&<p className="money-error" role="alert">{error}</p>}
      <button type="submit" className="save-btn" disabled={saving}>{saving?'Saving…':editing?'Save changes':'Record'}</button>
    </form>
  </Sheet>;
}
