import { useContext, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { CurrencyCtx } from '../context.js';
import { accountLabel, loanSummary, todayLocal } from '../utils/money.js';
import { fmt } from '../utils/format.js';

export default function MoneyLentView({records,cards,onNew,onRepay,onEdit,onDelete,onOpenMenu}) {
  const currency=useContext(CurrencyCtx), [filter,setFilter]=useState('all');
  const loans=records.filter(r=>r.kind==='loan').sort((a,b)=>b.date.localeCompare(a.date));
  return <div className="view money-view">
    <div className="money-heading"><button className="icon-btn" aria-label="Menu" onClick={onOpenMenu}><Menu size={18}/></button><h1>Money Lent</h1><button className="text-btn" onClick={onNew}><Plus size={16}/> Lend money</button></div>
    <p className="money-hint">Who owes you, what they have paid, and what is due. Balances as of {todayLocal()}.</p>
    <label className="money-field"><span>Show loans</span><select className="text-input" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All loans</option><option value="active">Outstanding</option><option value="settled">Settled</option><option value="due">Payment due</option></select></label>
    {!loans.length&&<div className="card"><p>No loans recorded yet.</p><p className="money-hint">Record each loan once. Funding and repayments automatically update Insights and the Ledger.</p></div>}
    {loans.map(loan=>{
      const s=loanSummary(loan,records);
      if(filter==='active'&&s.status==='Settled'||filter==='settled'&&s.status!=='Settled'||filter==='due'&&s.status!=='Payment due') return null;
      const card=cards.find(c=>c.id===loan.cardId)?.name||'Deleted credit card';
      return <article className="card money-loan" key={loan.id}>
        <div className="money-heading"><h2>{loan.borrower}</h2><span className={`money-status ${s.status==='Payment due'?'due':''}`}>{s.status}</span></div>
        <p className="money-hint">{loan.date} · {loan.account==='card'?card:accountLabel(loan.account)} · {Number(loan.rate)===0?'Interest-free':`${loan.rate}% ${loan.ratePeriod} · ${loan.interestBasis==='remaining'?'remaining principal':'original amount'}`}</p>
        <dl className="money-stats"><div><dt>Originally lent</dt><dd>{currency} {fmt(loan.amount)}</dd></div><div><dt>Principal outstanding</dt><dd>{currency} {fmt(s.outstanding)}</dd></div><div><dt>Principal returned</dt><dd>{currency} {fmt(s.principalReturned)}</dd></div><div><dt>Interest received</dt><dd>{currency} {fmt(s.interestReceived)}</dd></div><div><dt>Unpaid interest</dt><dd>{currency} {fmt(s.interestDue)}</dd></div>{s.interestCredit>0&&<div><dt>Interest paid in advance</dt><dd>{currency} {fmt(s.interestCredit)}</dd></div>}</dl>
        <p className="money-hint">{loan.arrangement==='installments'?`${loan.installmentMonths} monthly principal installments`:`Repayment: ${loan.arrangement.replace('-',' ')}`}{loan.dueDate?` · Principal due ${loan.dueDate}`:''}{s.nextInterestDate?` · Next interest ${s.nextInterestDate}`:''}{s.nextPrincipalDate?` · Next principal ${s.nextPrincipalDate}`:''}</p>
        {s.principalDue>0&&<p className="money-error">Principal due: {currency} {fmt(s.principalDue)}</p>}
        {loan.note&&<p>{loan.note}</p>}
        <div className="money-actions"><button className="text-btn" onClick={()=>onRepay(loan.id)}>Record repayment</button><button className="text-btn" onClick={()=>onEdit(loan)}>Edit loan</button><button className="text-btn" onClick={()=>onDelete(loan)}>Delete loan</button></div>
        <details><summary>Repayment history ({s.payments.length})</summary>{s.payments.length?s.payments.map(p=><div className="money-payment" key={p.id}><p>{p.date} · {accountLabel(p.account)} · Principal {currency} {fmt(p.principal)} · Interest {currency} {fmt(p.interest)}</p>{p.note&&<p>{p.note}</p>}<div className="money-actions"><button className="text-btn" onClick={()=>onEdit(p)}>Edit repayment</button><button className="text-btn" onClick={()=>onDelete(p)}>Delete repayment</button></div></div>):<p className="money-hint">No repayments yet.</p>}</details>
      </article>;
    })}
  </div>;
}
