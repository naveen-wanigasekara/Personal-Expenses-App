import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import NotificationsPanel from '../src/components/NotificationsPanel.jsx';
import {buildPaymentNotifications} from '../src/utils/paymentNotifications.js';
const reminders=()=>buildPaymentNotifications({today:'2026-11-20',cards:[{id:'hnb',name:'HNB',currentBalance:50000,paymentDueDate:'2026-11-25'}],installmentPlans:[{id:'plan',label:'Laptop',cardId:'hnb',startMonth:'2026-12',startDate:'2026-12-01',totalMonths:2,monthlyAmount:10000,active:true}],recurringReminders:[{id:'rent',label:'Rent',amount:5000,dayOfMonth:10,active:true}]});
afterEach(cleanup);
it('displays categorized due and upcoming payments with amounts, dates and statuses',()=>{
 render(<NotificationsPanel notifications={reminders()} onClose={vi.fn()} onComplete={vi.fn()}/>);
 for(const name of ['Due Payments','Monthly Credit Card (CC) Payments','Installment Payments','Other Upcoming Payments'])expect(screen.getByRole('heading',{name:new RegExp(name.replace(/[()]/g,'\\$&'))})).toBeTruthy();
 const due=screen.getByRole('region',{name:/Due Payments/});expect(within(due).getByText('Overdue')).toBeTruthy();expect(within(due).getByText(/10 Nov 2026/)).toBeTruthy();
 expect(screen.getAllByText(/25 Nov 2026/,{selector:'.payment-notif-date'})).toHaveLength(1);
 expect(screen.getByText(/Due 1 Dec 2026/)).toBeTruthy();
});
it('completion targets only the selected occurrence and retains the existing close action',()=>{
 const onComplete=vi.fn(),onClose=vi.fn();render(<NotificationsPanel notifications={reminders()} onComplete={onComplete} onClose={onClose}/>);
 fireEvent.click(screen.getByRole('button',{name:'Dismiss Laptop for December 2026, installment 1 due 2026-12-01'}));expect(onComplete).toHaveBeenCalledWith('inst:plan:ptx_plan_0','2026-12');
 fireEvent.click(screen.getByRole('button',{name:'Close'}));expect(onClose).toHaveBeenCalledOnce();
});
it('shows missing dates honestly and supports an empty notification list',()=>{
 const rows=buildPaymentNotifications({today:'2026-11-20',cards:[{id:'card',name:'Card',currentBalance:1000}]});
 const {rerender}=render(<NotificationsPanel notifications={rows} onComplete={vi.fn()} onClose={vi.fn()}/>);expect(screen.getByText('Due date not set',{exact:true})).toBeTruthy();expect(screen.queryByRole('heading',{name:/Due Payments/})).toBeNull();
 rerender(<NotificationsPanel notifications={[]} onComplete={vi.fn()} onClose={vi.fn()}/>);expect(screen.getByText('No upcoming or due payment reminders.')).toBeTruthy();
});
