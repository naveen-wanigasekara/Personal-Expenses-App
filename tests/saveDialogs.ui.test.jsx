import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,act,cleanup} from '@testing-library/react';
import CardFormModal from '../src/components/CardFormModal.jsx';
import InvestmentValueModal from '../src/components/InvestmentValueModal.jsx';
afterEach(cleanup);
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
