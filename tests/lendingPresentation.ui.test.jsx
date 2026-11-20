import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import MoneyLentView from '../src/components/MoneyLentView.jsx';
const loan=(extra={})=>({id:'loan',kind:'loan',borrower:'Person',date:'2026-01-01',amount:1000,account:'cash',rate:0,ratePeriod:'monthly',interestBasis:'original',arrangement:'flexible',...extra});
const payment=(extra={})=>({id:'pay',kind:'repayment',loanId:'loan',date:'2026-02-01',principal:200,interest:0,account:'cash',...extra});
function mount(records,props={}){render(<MoneyLentView records={records} cards={[]} onNew={vi.fn()} onRepay={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} {...props}/>);fireEvent.click(screen.getByRole('button',{name:'Open Person'}));}
afterEach(cleanup);
it('shows only relevant principal fields for interest-free loans and their repayments',()=>{
 mount([loan(),payment()]);
 const card=screen.getByRole('article');expect(within(card).getByText('Interest-free')).toBeTruthy();expect(within(card).getByText('Principal outstanding').closest('div').textContent).toContain('800');
 for(const label of ['Interest received','Unpaid interest','Interest paid in advance'])expect(within(card).queryByText(label,{exact:true})).toBeNull();
 expect(within(card).queryByText(/Interest on|Next interest/)).toBeNull();
 fireEvent.click(screen.getByText('Repayment history (1)'));
 const received=card.querySelector('.money-payment');expect(received.textContent).toContain('Principal');expect(received.textContent).not.toContain('Interest');
});
it('retains interest terms and actual received and due values for interest-bearing loans',()=>{
 mount([loan({rate:5}),payment({principal:0,interest:25})]);
 const card=screen.getByRole('article');expect(within(card).getByText('5% monthly')).toBeTruthy();expect(within(card).getByText('Interest on original amount')).toBeTruthy();expect(within(card).getByText('Interest received')).toBeTruthy();expect(within(card).getByText('Unpaid interest')).toBeTruthy();
 expect(within(card).queryByText('Principal returned',{exact:true})).toBeNull();
 fireEvent.click(screen.getByText('Repayment history (1)'));const received=card.querySelector('.money-payment');expect(received.textContent).toContain('Interest');expect(received.textContent).not.toContain('Principal');
});
it('groups secondary loan and repayment actions while retaining exact callbacks',()=>{
 const a=loan(),p=payment(),onEdit=vi.fn(),onDelete=vi.fn(),onArchive=vi.fn();mount([a,p],{onEdit,onDelete,onArchive});
 const trigger=screen.getByLabelText(/^Loan actions:/);fireEvent.click(trigger);fireEvent.click(screen.getByRole('button',{name:'Edit loan'}));expect(onEdit).toHaveBeenCalledWith(a);expect(trigger.closest('details').open).toBe(false);
 fireEvent.click(screen.getByText('Repayment history (1)'));fireEvent.click(screen.getByLabelText(/^Repayment actions:/));fireEvent.click(screen.getByRole('button',{name:'Delete repayment'}));expect(onDelete).toHaveBeenCalledWith(p);
});
it('closes action disclosures on Escape and outside input and restores keyboard focus',()=>{
 mount([loan()]);const trigger=screen.getByLabelText(/^Loan actions:/);fireEvent.click(trigger);expect(trigger.closest('details').open).toBe(true);
 fireEvent.keyDown(trigger,{key:'Escape'});expect(trigger.closest('details').open).toBe(false);expect(document.activeElement).toBe(trigger);
 fireEvent.click(trigger);fireEvent.pointerDown(screen.getByRole('heading',{name:'Person',exact:true}));expect(trigger.closest('details').open).toBe(false);
});
it('uses shared notifications, refresh and a back control outside the mobile-only header',()=>{
 const onOpenNotifications=vi.fn(),onQuickRefresh=vi.fn();mount([loan()],{onOpenNotifications,onQuickRefresh,showQuickRefresh:true,notifCount:2});
 fireEvent.click(screen.getByRole('button',{name:'Notifications'}));expect(onOpenNotifications).toHaveBeenCalledOnce();fireEvent.click(screen.getByRole('button',{name:'Refresh'}));expect(onQuickRefresh).toHaveBeenCalledOnce();
 const back=screen.getByRole('button',{name:'Back to borrowers'});expect(back.closest('.dash-topbar')).toBeNull();fireEvent.click(back);expect(screen.getByRole('button',{name:'Open Person'})).toBeTruthy();
});
