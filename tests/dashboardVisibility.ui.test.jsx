import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import DashView from '../src/components/DashView.jsx';
import {getDefaultUserCats} from '../src/constants/categories.js';
const cats=getDefaultUserCats();
const plan={income:{total:10000,categories:{fixed:10000}},expense:{total:5000,categories:{groceries:5000}}};
const props={transactions:[{id:'salary',type:'income',category:'fixed',amount:10000,date:'2026-11-01'}],getEffectivePlan:()=>plan,cards:[],investments:[],viewMonth:'2026-11',setViewMonth:vi.fn(),user:{id:'qa'},allExpCats:cats.expense,allIncCats:cats.income,customCharts:[],onInsightsLayoutChange:vi.fn()};
beforeEach(()=>{window.matchMedia=vi.fn(()=>({matches:true}));});
afterEach(cleanup);
it('renders enabled mobile reports immediately and after returning to Insights',()=>{
 const check=()=>{
  for(const title of ['Cash Balance Trend','Plan vs. Actual','Income earned & Spending','Where it came from','Where it went']) expect(screen.getByRole('heading',{name:title,exact:true})).toBeTruthy();
  expect(document.querySelector('.mobile-detail-hidden')).toBeNull();
  expect(screen.queryByRole('button',{name:/Show reports/})).toBeNull();
 };
 const view=render(<DashView {...props}/>);check();view.unmount();render(<DashView {...props}/>);check();
});
it('respects Customize visibility and order without a second mobile override',()=>{
 const onInsightsLayoutChange=vi.fn();
 const layout=[{id:'cashflow',visible:true},{id:'net_worth',visible:false}];
 const view=render(<DashView {...props} insightsLayout={layout} onInsightsLayoutChange={onInsightsLayoutChange}/>);
 expect(screen.queryByRole('heading',{name:'Cash Balance Trend'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Customize sections'}));fireEvent.click(screen.getByRole('button',{name:'Show Cash Balance Trend section'}));
 const next=onInsightsLayoutChange.mock.calls[0][0];expect(next.find(s=>s.id==='net_worth').visible).toBe(true);
 view.rerender(<DashView {...props} insightsLayout={next} onInsightsLayoutChange={onInsightsLayoutChange}/>);
 fireEvent.click(screen.getByRole('button',{name:'Close'}));
 expect(screen.getByRole('heading',{name:'Cash Balance Trend'})).toBeTruthy();
 const headings=[...document.querySelectorAll('.dash-sections h3')].map(e=>e.textContent);
 expect(headings.indexOf('Income earned & Spending')).toBeLessThan(headings.indexOf('Cash Balance Trend'));
});
it('shows explanatory empty states for enabled reports without data',()=>{
 render(<DashView {...props} transactions={[]} getEffectivePlan={()=>null}/>);
 for(const title of ['Cash Balance Trend','Card Debt','Budget Progress','Plan vs. Actual','Income Breakdown']) expect(screen.getByRole('heading',{name:title,exact:true})).toBeTruthy();
 expect(screen.getByText('No cash balance history yet.')).toBeTruthy();
 expect(screen.getByText('No outstanding credit card balance.')).toBeTruthy();
});
