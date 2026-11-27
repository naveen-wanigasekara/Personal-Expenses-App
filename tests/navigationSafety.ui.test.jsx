import {useState} from 'react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,within,waitFor} from '@testing-library/react';
import {useAppBack,useBackLayer} from '../src/hooks/useAppBack.js';
import Sheet from '../src/components/Sheet.jsx';
import BudgetView from '../src/components/BudgetView.jsx';
import {hasBlockingDrafts} from '../src/utils/draftGuard.js';
const plan={income:{total:100,categories:{}},expense:{total:90,categories:{}}};
beforeEach(()=>{window.confirm=vi.fn(()=>false);window.scrollTo=vi.fn();});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function Detail({onBack}) {useBackLayer(onBack);return <h2>Detail view</h2>;}
function Harness() {
 const [tab,setTab]=useState('Home'),[sheet,setSheet]=useState(false),[child,setChild]=useState(false),[detail,setDetail]=useState(false);
 const navigate=useAppBack(tab,setTab);
 return <><h1>{tab}</h1><button onClick={()=>navigate('Other')}>Navigate</button><button onClick={()=>setSheet(true)}>Open sheet</button><button onClick={()=>setDetail(true)}>Open detail</button>
 {detail&&<Detail onBack={()=>setDetail(false)}/>}
 {sheet&&<Sheet title="Parent" protectDraft onClose={()=>setSheet(false)}><input aria-label="Draft"/><button onClick={()=>setChild(true)}>Open child</button>{child&&<Sheet title="Child" onClose={()=>setChild(false)}>Nested content</Sheet>}</Sheet>}
 {tab==='Other'&&<BudgetView fixedPlan={plan} monthPlans={{}} viewMonth="2026-10" setViewMonth={vi.fn()} stats={{byIncCat:{},byExpCat:{}}} allExpCats={[]} allIncCats={[]}/>}
 </>;
}
const back=()=>fireEvent(window,new PopStateEvent('popstate'));
it('consumes Back in the top sheet before its parent, detail or tab',()=>{
 render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Navigate'}));fireEvent.click(screen.getByRole('button',{name:'Open detail'}));fireEvent.click(screen.getByRole('button',{name:'Open sheet'}));fireEvent.click(screen.getByRole('button',{name:'Open child'}));
 back();expect(screen.queryByRole('dialog',{name:'Child'})).toBeNull();expect(screen.getByRole('dialog',{name:'Parent'})).toBeTruthy();
 back();expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByRole('heading',{name:'Detail view'})).toBeTruthy();
 back();expect(screen.queryByRole('heading',{name:'Detail view'})).toBeNull();expect(screen.getByRole('heading',{name:'Other'})).toBeTruthy();
 back();expect(screen.getByRole('heading',{name:'Home'})).toBeTruthy();
});
it('cancels and confirms draft discard through system Back without losing the tab',()=>{
 render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Open sheet'}));fireEvent.change(screen.getByLabelText('Draft'),{target:{value:'Keep me'}});
 back();expect(window.confirm).toHaveBeenCalledOnce();expect(screen.getByLabelText('Draft').value).toBe('Keep me');
 window.confirm.mockReturnValue(true);back();expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByRole('heading',{name:'Home'})).toBeTruthy();expect(hasBlockingDrafts()).toBe(false);
});
it('keeps a dirty budget when Back is cancelled and releases its guard after leaving',()=>{
 render(<Harness/>);fireEvent.click(screen.getByRole('button',{name:'Navigate'}));fireEvent.change(screen.getByLabelText('Fixed monthly expense budget'),{target:{value:'95'}});
 back();expect(screen.getByRole('heading',{name:'Other'})).toBeTruthy();expect(screen.getByLabelText('Fixed monthly expense budget').value).toContain('95');
 window.confirm.mockReturnValue(true);back();expect(screen.queryByRole('heading',{name:'Other'})).toBeNull();expect(hasBlockingDrafts()).toBe(false);
});
it('exits at the root and removes the Back listener on unmount',()=>{
 const goBack=vi.spyOn(window.history,'back').mockImplementation(()=>{});const result=render(<Harness/>);back();expect(goBack).toHaveBeenCalledOnce();result.unmount();back();expect(goBack).toHaveBeenCalledOnce();
});
it('does not overwrite a dirty monthly budget when fixed-plan props refresh',()=>{
 const props={fixedPlan:plan,monthPlans:{},viewMonth:'2026-10',stats:{byIncCat:{},byExpCat:{}},allExpCats:[],allIncCats:[]};
 const {rerender}=render(<BudgetView {...props}/>);fireEvent.click(screen.getByRole('button',{name:'Selected month'}));fireEvent.change(screen.getByLabelText('October 2026 expense budget'),{target:{value:'95'}});
 rerender(<BudgetView {...props} fixedPlan={{...plan,expense:{total:80,categories:{}}}}/>);
 expect(Number(screen.getByLabelText('October 2026 expense budget').value.replaceAll(',',''))).toBe(95);
});
it('asks before replacing a changed monthly budget with the fixed plan',()=>{
 render(<BudgetView fixedPlan={plan} monthPlans={{}} viewMonth="2026-10" stats={{byIncCat:{},byExpCat:{}}} allExpCats={[]} allIncCats={[]}/>);fireEvent.click(screen.getByRole('button',{name:'Selected month'}));fireEvent.change(screen.getByLabelText('October 2026 expense budget'),{target:{value:'95'}});
 fireEvent.click(screen.getByRole('button',{name:/Copy from fixed plan/}));expect(window.confirm).toHaveBeenCalledOnce();expect(Number(screen.getByLabelText('October 2026 expense budget').value.replaceAll(',',''))).toBe(95);
});
