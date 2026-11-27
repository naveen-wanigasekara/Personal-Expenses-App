import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,act,waitFor} from '@testing-library/react';
import {usePWA} from '../src/hooks/usePWA.js';
import {registerDraftGuard,canLeaveDrafts} from '../src/utils/draftGuard.js';
import {BankDetailsForm} from '../src/components/BankDetailsView.jsx';
vi.mock('../src/lib/bankDetails.js',()=>({bankDetailsStore:{}}));
let priorWorker,worker,registration;
function UpdateHarness(){const pwa=usePWA();return <><button onClick={pwa.updateApp}>Update</button><p>{pwa.needsRefresh?'Update available':'Current'}</p></>;}
beforeEach(()=>{
 window.matchMedia=vi.fn(()=>({matches:false}));window.confirm=vi.fn(()=>false);
 priorWorker=Object.getOwnPropertyDescriptor(navigator,'serviceWorker');worker=new EventTarget();registration={update:vi.fn().mockResolvedValue(),addEventListener:vi.fn(),removeEventListener:vi.fn()};
 Object.assign(worker,{controller:{},ready:Promise.resolve(registration),getRegistration:vi.fn().mockResolvedValue(registration)});
 Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:worker});
});
afterEach(()=>{cleanup();if(priorWorker)Object.defineProperty(navigator,'serviceWorker',priorWorker);else delete navigator.serviceWorker;vi.restoreAllMocks();});
it('does not check or activate an update when discard is cancelled',async()=>{
 const release=registerDraftGuard({dirty:()=>true});try{
 render(<UpdateHarness/>);await waitFor(()=>expect(registration.update).toHaveBeenCalled());const before=registration.update.mock.calls.length;
 fireEvent.click(screen.getByRole('button',{name:'Update'}));expect(window.confirm).toHaveBeenCalledOnce();expect(registration.update.mock.calls.length).toBe(before);
 }finally{release();}
});
it('defers another-tab worker activation without prompting or reloading a dirty draft',async()=>{
 const release=registerDraftGuard({dirty:()=>true});try{
 render(<UpdateHarness/>);await act(async()=>{});fireEvent(worker,new Event('controllerchange'));
 expect(screen.getByText('Update available')).toBeTruthy();expect(window.confirm).not.toHaveBeenCalled();
 }finally{release();}
});
it('blocks Close and refresh during a pending bank write even without a fieldset',()=>{
 const onClose=vi.fn();render(<BankDetailsForm account={{bank:'QA',branch:'QA',accountName:'Synthetic',accountNumber:'001'}} saving onSave={vi.fn()} onClose={onClose}/>);
 fireEvent.click(screen.getByRole('button',{name:'Close'}));expect(onClose).not.toHaveBeenCalled();expect(canLeaveDrafts()).toBe(false);expect(window.confirm).not.toHaveBeenCalled();
});
