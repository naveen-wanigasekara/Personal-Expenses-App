import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import MoneyLentView from '../src/components/MoneyLentView.jsx';
const loan=(id,borrower,date,extra={})=>({id,kind:'loan',borrower,date,amount:1000,account:'cash',rate:0,ratePeriod:'monthly',interestBasis:'original',arrangement:'flexible',note:id,...extra});
const a1=loan('a1','Person A','2026-01-01'),a2=loan('a2','Person A','2026-02-01'),b=loan('b','Person B','2026-01-15');
const archived=loan('archived','Person B','2026-03-01',{archived:true});
const settled=loan('settled','Person C','2026-01-01');
const paid={id:'paid',kind:'repayment',loanId:'settled',date:'2026-02-01',principal:1000,interest:0,account:'cash'};
const records=[a1,a2,b,archived,settled,paid];
const mount=(props={})=>render(<MoneyLentView records={records} cards={[]} onRepay={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onArchive={vi.fn()} {...props}/>);
afterEach(cleanup);
it('shows a single flat active-loan list across borrowers and excludes settled and manually archived loans',()=>{
 mount();const cards=screen.getAllByRole('article');expect(cards).toHaveLength(3);expect(cards.every(card=>card.classList.contains('money-loan'))).toBe(true);
 expect(cards.map(card=>card.querySelector('.lending-note').textContent)).toEqual(['a2','b','a1']);
 expect(within(cards[0]).getByText('Person A',{exact:true})).toBeTruthy();expect(within(cards[1]).getByText('Person B',{exact:true})).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Open Person A'})).toBeNull();expect(screen.getByRole('button',{name:'Active loans',exact:true}).getAttribute('aria-pressed')).toBe('true');
});
it('shows only borrower cards in Borrowers and reuses the exact active-loan card content in borrower details',()=>{
 mount();const original=screen.getAllByRole('article').find(card=>card.querySelector('.lending-note').textContent==='a1');const content=original.textContent,classes=original.className;
 fireEvent.click(screen.getByRole('button',{name:'Borrowers',exact:true}));
 expect(screen.getAllByRole('article')).toHaveLength(3);expect(document.querySelector('.money-loan')).toBeNull();expect(screen.queryByRole('button',{name:'Record repayment'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Open Person A'}));const detail=screen.getAllByRole('article').find(card=>card.querySelector('.lending-note').textContent==='a1');expect(detail.className).toBe(classes);expect(detail.textContent).toBe(content);
 expect(screen.getAllByRole('article')).toHaveLength(2);expect(screen.getByText('Complete transaction history (2)')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Back to borrowers'}));fireEvent.click(screen.getByRole('button',{name:'Active loans',exact:true}));expect(screen.getAllByRole('article')).toHaveLength(3);
});
it('retains repayment and secondary actions on flat loan entries and filters by borrower name',()=>{
 const onRepay=vi.fn(),onEdit=vi.fn(),onDelete=vi.fn();mount({onRepay,onEdit,onDelete});
 fireEvent.change(screen.getByLabelText('Find a borrower'),{target:{value:'Person A'}});const cards=screen.getAllByRole('article');expect(cards).toHaveLength(2);
 fireEvent.click(within(cards[0]).getByRole('button',{name:'Record repayment'}));expect(onRepay).toHaveBeenCalledWith(a2.id,expect.any(String));
 const trigger=within(cards[0]).getByLabelText(/^Loan actions:/);fireEvent.click(trigger);fireEvent.click(within(cards[0]).getByRole('button',{name:'Edit loan'}));expect(onEdit).toHaveBeenCalledWith(a2);
 fireEvent.click(trigger);fireEvent.click(within(cards[0]).getByRole('button',{name:'Delete loan'}));expect(onDelete).toHaveBeenCalledWith(a2);
 fireEvent.change(screen.getByLabelText('Find a borrower'),{target:{value:''}});fireEvent.click(screen.getByRole('button',{name:'Archive'}));expect(screen.getAllByRole('button',{name:/^Open Person/})).toHaveLength(2);expect(screen.queryByRole('button',{name:'Record repayment'})).toBeNull();
});
