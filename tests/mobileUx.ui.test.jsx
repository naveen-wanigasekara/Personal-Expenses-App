import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import AddModal from '../src/components/AddModal.jsx';
import HomeView from '../src/components/HomeView.jsx';
import BudgetView from '../src/components/BudgetView.jsx';
import NotificationsPanel from '../src/components/NotificationsPanel.jsx';
import MoneyLentView from '../src/components/MoneyLentView.jsx';
import NavDrawer from '../src/components/NavDrawer.jsx';
import ConnectionStatus from '../src/components/ConnectionStatus.jsx';
import {canLeaveDrafts, hasBlockingDrafts, registerDraftGuard} from '../src/utils/draftGuard.js';
import {EXPENSE_CATEGORIES,INCOME_CATEGORIES} from '../src/constants/categories.js';

beforeEach(()=>{window.confirm=vi.fn(()=>false);window.scrollTo=vi.fn();});
afterEach(cleanup);
const categories={allExpCats:EXPENSE_CATEGORIES,allIncCats:INCOME_CATEGORIES};
const change=(label,value)=>fireEvent.change(screen.getByLabelText(label),{target:{value}});
it.each(['Close','Escape','backdrop'])('retains an unfinished expense when %s dismissal is cancelled',way=>{
 const onClose=vi.fn();render(<AddModal cards={[]} {...categories} onClose={onClose} onSave={vi.fn()}/>);
 change('Amount','1250');
 if(way==='Close')fireEvent.click(screen.getByRole('button',{name:'Close'}));
 else if(way==='Escape')fireEvent.keyDown(document,{key:'Escape'});
 else fireEvent.click(document.querySelector('.backdrop'));
 expect(window.confirm).toHaveBeenCalledOnce();expect(onClose).not.toHaveBeenCalled();expect(Number(screen.getByLabelText('Amount').value.replaceAll(',',''))).toBe(1250);
 window.confirm.mockReturnValue(true);fireEvent.click(screen.getByRole('button',{name:'Close'}));expect(onClose).toHaveBeenCalledOnce();
});
it('closes a pristine expense without a discard prompt',()=>{
 const onClose=vi.fn();render(<AddModal cards={[]} {...categories} onClose={onClose} onSave={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:'Close'}));expect(onClose).toHaveBeenCalledOnce();expect(window.confirm).not.toHaveBeenCalled();
});
it.each(['1919','1919.00','1,919','1,919.00','Rs. 1,919.00'])('finds the same transaction with amount query %s',q=>{
 render(<HomeView {...categories} viewMonth="2026-11" transactions={[{id:'one',type:'expense',amount:1919,category:'other',date:'2026-11-20',note:'Synthetic lunch'}]} cards={[]} installmentPlans={[]} onEdit={vi.fn()} onDelete={vi.fn()}/>);
 change('Search transactions',q);expect(screen.queryByText('No matches')).toBeNull();expect(screen.getByRole('button',{name:/Synthetic lunch/})).toBeTruthy();
});
it('keeps ordinary note searching distinct from numeric amount searching',()=>{
 render(<HomeView {...categories} viewMonth="2026-11" transactions={[{id:'one',type:'expense',amount:1919,category:'other',date:'2026-11-20',note:'Synthetic lunch'}]} cards={[]} installmentPlans={[]}/>);
 change('Search transactions','not-here');expect(screen.getByText('No matches')).toBeTruthy();change('Search transactions','lunch');expect(screen.queryByText('No matches')).toBeNull();
});
it('labels the selected historical budget month on inputs and saving',()=>{
 render(<BudgetView {...categories} fixedPlan={{income:{total:100,categories:{}},expense:{total:90,categories:{}}}} monthPlans={{}} viewMonth="2026-10" stats={{byIncCat:{},byExpCat:{}}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Selected month'}));expect(screen.getByLabelText('October 2026 expense budget')).toBeTruthy();expect(screen.getByRole('button',{name:'Save for October 2026'})).toBeTruthy();expect(screen.queryByText('This month')).toBeNull();
});
it('explains reminder dismissal before any reminder and never records a payment',()=>{
 const onComplete=vi.fn();render(<NotificationsPanel notifications={[{id:'row',completionId:'rem:one',month:'2026-11',type:'other',title:'Synthetic rent',status:'due',date:'2026-11-27',amount:100,amountLabel:'Amount'}]} onComplete={onComplete} onClose={vi.fn()}/>);
 const explanation=screen.getByText(/Dismiss only hides/);const row=screen.getByRole('article');expect(explanation.compareDocumentPosition(row)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Dismiss Synthetic rent/}));expect(onComplete).toHaveBeenCalledWith('rem:one','2026-11');
});
it('filters overdue loans without hiding their borrower identities or altering history',()=>{
 const base={kind:'loan',amount:1000,account:'cash',rate:0,ratePeriod:'monthly',interestBasis:'original',arrangement:'single'};
 const records=[{...base,id:'old',borrower:'Due person',date:'2020-01-01',dueDate:'2020-02-01'},{...base,id:'new',borrower:'Future person',date:'2020-01-02',dueDate:'2099-01-01'}];
 render(<MoneyLentView records={records} cards={[]} onRepay={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()}/>);
 fireEvent.change(screen.getByLabelText('Loan status'),{target:{value:'overdue'}});expect(screen.getAllByRole('article')).toHaveLength(1);expect(within(screen.getByRole('article')).getByText('Due person')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Loan status'),{target:{value:'all'}});expect(screen.getAllByRole('article')).toHaveLength(2);expect(records).toHaveLength(2);
});
it('marks the current secondary screen in the menu',()=>{
 render(<NavDrawer activeTab="budget" moneyEnabled onClose={vi.fn()} onNavigate={vi.fn()}/>);
 expect(screen.getByRole('button',{name:'Budget'}).getAttribute('aria-current')).toBe('page');expect(screen.getByRole('button',{name:'Investments'}).getAttribute('aria-current')).toBeNull();
});
it('protects changed entry details when changing subtype or returning to the chooser',()=>{
 const onBack=vi.fn(),onSubtypeChange=vi.fn();render(<AddModal cards={[]} {...categories} entryGroup="expense" entryTask="expense" moneyEnabled onClose={vi.fn()} onSave={vi.fn()} onBack={onBack} onSubtypeChange={onSubtypeChange}/>);
 change('Amount','800');fireEvent.click(screen.getByRole('button',{name:'Income / Expenses'}));expect(onBack).not.toHaveBeenCalled();
 change('Expense type','savings');expect(onSubtypeChange).not.toHaveBeenCalled();expect(screen.getByLabelText('Expense type').value).toBe('expense');
 window.confirm.mockReturnValue(true);fireEvent.click(screen.getByRole('button',{name:'Income / Expenses'}));expect(onBack).toHaveBeenCalledOnce();
});
it('removes refresh guards on unmount and blocks browser reload with a changed draft',()=>{
 const result=render(<AddModal cards={[]} {...categories} onClose={vi.fn()} onSave={vi.fn()}/>);change('Amount','800');
 const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);expect(event.defaultPrevented).toBe(true);expect(hasBlockingDrafts()).toBe(true);expect(canLeaveDrafts()).toBe(false);
 result.unmount();expect(hasBlockingDrafts()).toBe(false);expect(canLeaveDrafts()).toBe(true);
});
it('never allows refresh while a registered write is pending',()=>{
 const release=registerDraftGuard({dirty:()=>true,busy:()=>true});try{expect(canLeaveDrafts()).toBe(false);expect(window.confirm).not.toHaveBeenCalled();}finally{release();}
});
it('shows explicit offline guidance and clears it after reconnection',()=>{
 const previous=Object.getOwnPropertyDescriptor(navigator,'onLine');
 try {
  Object.defineProperty(navigator,'onLine',{configurable:true,value:false});render(<ConnectionStatus/>);expect(screen.getByRole('status').textContent).toContain('Unsaved entries are not queued');
  Object.defineProperty(navigator,'onLine',{configurable:true,value:true});fireEvent(window,new Event('online'));expect(screen.queryByRole('status')).toBeNull();
  Object.defineProperty(navigator,'onLine',{configurable:true,value:false});fireEvent(window,new Event('offline'));expect(screen.getByRole('status').textContent).toContain('Offline');
 } finally {if(previous)Object.defineProperty(navigator,'onLine',previous);else delete navigator.onLine;}
});
it('protects type-only changes in an existing entry',()=>{
 const onClose=vi.fn();render(<AddModal {...categories} cards={[{id:'qa',name:'QA'}]} editing={{id:'old',type:'expense',amount:20,category:'other',date:'2026-11-01'}} onClose={onClose} onSave={vi.fn()}/>);
 change('Expense type','card-interest');fireEvent.click(screen.getByRole('button',{name:'Close'}));expect(window.confirm).toHaveBeenCalledOnce();expect(onClose).not.toHaveBeenCalled();
});
it('keeps an offline expense draft and retries only after reconnection',async()=>{
 const previous=Object.getOwnPropertyDescriptor(navigator,'onLine');const onSave=vi.fn().mockResolvedValue();
 try{
  Object.defineProperty(navigator,'onLine',{configurable:true,value:false});render(<AddModal {...categories} cards={[]} onClose={vi.fn()} onSave={onSave}/>);change('Amount','800');
  fireEvent.click(screen.getByRole('button',{name:'Record'}));expect(screen.getByRole('alert').textContent).toContain('Reconnect');expect(onSave).not.toHaveBeenCalled();expect(Number(screen.getByLabelText('Amount').value.replaceAll(',',''))).toBe(800);
  Object.defineProperty(navigator,'onLine',{configurable:true,value:true});fireEvent.click(screen.getByRole('button',{name:'Record'}));expect(onSave).toHaveBeenCalledOnce();
 }finally{if(previous)Object.defineProperty(navigator,'onLine',previous);else delete navigator.onLine;}
});
