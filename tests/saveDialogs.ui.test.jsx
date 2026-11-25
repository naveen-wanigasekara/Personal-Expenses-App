import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,act,cleanup} from '@testing-library/react';
import CardFormModal from '../src/components/CardFormModal.jsx';
import InvestmentValueModal from '../src/components/InvestmentValueModal.jsx';
import RecurringRemindersModal from '../src/components/RecurringRemindersModal.jsx';
import CategoriesModal from '../src/components/CategoriesModal.jsx';
import ChartFormModal from '../src/components/ChartFormModal.jsx';
import CustomChartCard from '../src/components/charts/CustomChartCard.jsx';
afterEach(cleanup);
it('retains chart settings after a rejected save and prevents duplicate pending writes',async()=>{
 let reject;const onSave=vi.fn(()=>new Promise((resolve,no)=>{reject=no;})),onClose=vi.fn();
 render(<ChartFormModal transactions={[]} allExpCats={[]} allIncCats={[]} cards={[]} onSave={onSave} onClose={onClose}/>);
 fireEvent.change(screen.getByLabelText('Chart name'),{target:{value:'Spending target'}});
 fireEvent.click(screen.getByRole('button',{name:'Progress',exact:true}));
 fireEvent.change(screen.getByLabelText('Target amount'),{target:{value:'50000'}});
 const save=screen.getByRole('button',{name:'Create chart'});fireEvent.click(save);fireEvent.click(save);
 fireEvent.click(screen.getByRole('button',{name:'Close'}));expect(onSave).toHaveBeenCalledOnce();expect(onClose).not.toHaveBeenCalled();
 await act(async()=>reject(Error('Chart failed')));
 expect(screen.getByRole('alert').textContent).toBe('Chart failed');expect(screen.getByLabelText('Chart name').value).toBe('Spending target');
 onSave.mockResolvedValueOnce();await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Create chart'})));
 expect(onSave.mock.calls[1][0]).toMatchObject({name:'Spending target',target:50000,chartType:'progress'});
});
it.each(['progress','donut','line'])('renders %s transaction counts without a currency symbol',type=>{
 render(<CustomChartCard config={{name:'Count',chartType:type,txType:'all',groupBy:'month',metric:'count',range:'all'}} transactions={[{id:'one',type:'income',amount:500,date:'2026-11-01'}]} allExpCats={[]} allIncCats={[]} cards={[]}/>);
 expect(document.body.textContent).not.toMatch(/Rs\.|undefined|NaN/);
});
it('preserves a failed reminder draft and locks saves and dismissal until completion',async()=>{
 let reject;const onSave=vi.fn(()=>new Promise((resolve,no)=>{reject=no;})),onClose=vi.fn();
 render(<RecurringRemindersModal reminders={[]} allExpCats={[]} onSave={onSave} onClose={onClose} onDelete={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:'Add reminder'}));
 fireEvent.change(screen.getByLabelText('Reminder label'),{target:{value:'Electricity'}});
 fireEvent.change(screen.getByLabelText('Estimated amount (optional)'),{target:{value:'5000'}});
 const save=screen.getByRole('button',{name:'Save Reminder'});fireEvent.click(save);fireEvent.click(save);
 fireEvent.click(screen.getByRole('button',{name:'Close'}));
 expect(onSave).toHaveBeenCalledOnce();expect(onClose).not.toHaveBeenCalled();
 await act(async()=>reject(Error('Connection failed')));
 expect(screen.getByRole('alert').textContent).toBe('Connection failed');
 expect(screen.getByLabelText('Reminder label').value).toBe('Electricity');
 expect(screen.getByLabelText('Estimated amount (optional)').value).toBe('5000');
 onSave.mockResolvedValueOnce();await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Save Reminder'})));
 expect(onSave).toHaveBeenCalledTimes(2);expect(screen.queryByLabelText('Reminder label')).toBeNull();
});
it('retains a reminder when deletion fails and allows another attempt',async()=>{
 const onDelete=vi.fn().mockRejectedValueOnce(Error('Delete failed')).mockResolvedValueOnce();
 vi.spyOn(window,'confirm').mockReturnValue(true);
 render(<RecurringRemindersModal reminders={[{id:'qa',label:'QA bill',active:true,dayOfMonth:15}]} allExpCats={[]} onSave={vi.fn()} onClose={vi.fn()} onDelete={onDelete}/>);
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Delete reminder: QA bill'})));
 expect(screen.getByRole('alert').textContent).toBe('Delete failed');expect(screen.getByText('QA bill')).toBeTruthy();
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Delete reminder: QA bill'})));expect(onDelete).toHaveBeenCalledTimes(2);
 vi.restoreAllMocks();
});
it.each(['add','edit'])('retains category %s drafts on failure and permits a retry',async mode=>{
 const onSave=vi.fn().mockRejectedValueOnce(Error('Category save failed')).mockResolvedValueOnce();
 const cats={expense:[{id:'qa',label:'QA',icon:()=>null,color:'#123456',iconName:'MoreHorizontal'}],income:[]};
 render(<CategoriesModal userCats={cats} onClose={vi.fn()} onAdd={onSave} onEdit={onSave} onDelete={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:mode==='add'?'Add category':'Edit QA'}));
 fireEvent.change(screen.getByLabelText('Category name'),{target:{value:'Preserved category'}});
 const buttons=()=>screen.getAllByRole('button',{name:mode==='add'?'Add category':'Save changes'});
 await act(async()=>fireEvent.click(buttons().at(-1)));
 expect(screen.getByRole('alert').textContent).toBe('Category save failed');
 expect(screen.getByLabelText('Category name').value).toBe('Preserved category');
 await act(async()=>fireEvent.click(buttons().at(-1)));
 expect(onSave).toHaveBeenCalledTimes(2);expect(screen.queryByLabelText('Category name')).toBeNull();
});
it('locks card save and close actions until the write completes and surfaces rejected saves',async()=>{
 let reject;const onSave=vi.fn(()=>new Promise((resolve,no)=>{reject=no;})),onClose=vi.fn();
 render(<CardFormModal card={{id:'c',name:'Test',limit:1000}} onSave={onSave} onClose={onClose}/>);
 const save=screen.getByRole('button',{name:'Update card'});fireEvent.click(save);fireEvent.click(save);fireEvent.click(screen.getByRole('button',{name:'Close'}));
 expect(onSave).toHaveBeenCalledOnce();expect(onClose).not.toHaveBeenCalled();expect(save.closest('fieldset').disabled).toBe(true);
 await act(async()=>reject(Error('Connection failed')));expect(screen.getByRole('alert').textContent).toBe('Connection failed');expect(screen.getByLabelText('Card name').value).toBe('Test');expect(save.closest('fieldset').disabled).toBe(false);
});
it('keeps valuation drafts available after a rejected save and allows a safe retry',async()=>{
 const onSave=vi.fn().mockRejectedValueOnce(Error('Try again')).mockResolvedValueOnce();
 render(<InvestmentValueModal investment={{name:'Test',currentValue:100}} onClose={vi.fn()} onSave={onSave}/>);
 fireEvent.change(screen.getByLabelText('Current value'),{target:{value:'150'}});await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Record value'})));
 expect(screen.getByRole('alert').textContent).toBe('Try again');await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Record value'})));expect(onSave).toHaveBeenCalledTimes(2);expect(onSave.mock.calls[1][0]).toBe(150);
});
