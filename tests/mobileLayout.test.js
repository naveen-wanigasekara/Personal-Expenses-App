import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
import {JSDOM} from 'jsdom';
const css=postcss.parse(readFileSync('src/styles/mobile-ux.css','utf8'));
function stylesAt(width,height) {
 return css.nodes.flatMap(node=>{
  if(node.type!=='atrule')return node.toString();
  const applicable=[...node.params.matchAll(/(min|max)-(width|height):\s*(\d+)px/g)].every(([,bound,axis,value])=>bound==='max'?(axis==='width'?width:height)<=+value:(axis==='width'?width:height)>=+value);
  return applicable?node.nodes.map(rule=>rule.toString()):[];
 }).join('\n');
}
// CSS contract checks complement actual browser/device QA; JSDOM has no layout engine.
test('phone controls retain generous hit areas and readable inputs in portrait and short views',()=>{
 for(const [width,height] of [[340,234],[390,844],[412,915],[454,312]]) {
  const dom=new JSDOM('<style></style><div class="app"><button class="icon-btn"></button><div class="month-pill"><button></button></div><div class="cb-input"><input></div><div class="nav-btn"><span>Ledger</span></div></div>');
  dom.window.document.querySelector('style').textContent=stylesAt(width,height);
  const get=selector=>dom.window.getComputedStyle(dom.window.document.querySelector(selector));
  assert.equal(get('.icon-btn').minHeight,'44px');assert.equal(get('.month-pill button').minWidth,'44px');assert.equal(get('.cb-input input').fontSize,'16px');assert.equal(get('.nav-btn span').fontSize,'11px');dom.window.close();
 }
});
test('mobile presentation rules preserve desktop cards and hit areas',()=>{
 for(const width of [1024,1366,1920]) {
  const dom=new JSDOM('<style>.card {display:block}.icon-btn {min-width:28px}</style><div class="dash-sections"><div class="card">Report</div></div><button class="icon-btn"></button>');
  dom.window.document.querySelector('style').textContent+='\n'+stylesAt(width,900);
  assert.equal(dom.window.getComputedStyle(dom.window.document.querySelector('.card')).display,'block');assert.equal(dom.window.getComputedStyle(dom.window.document.querySelector('.icon-btn')).minWidth,'28px');dom.window.close();
 }
});
test('short-view keyboard rules keep navigation visible for theme radios and hide it for text entry',()=>{
 const dom=new JSDOM('<style>.nav {display:flex}</style><div class="app"><input type="radio"><input type="text"><nav class="nav">Navigation</nav></div>',{pretendToBeVisual:true});
 dom.window.document.querySelector('style').textContent+='\n'+stylesAt(454,312);
 const nav=dom.window.document.querySelector('.nav');
 dom.window.document.querySelector('[type=radio]').focus();assert.equal(dom.window.getComputedStyle(nav).display,'flex');
 dom.window.document.querySelector('[type=text]').focus();assert.equal(dom.window.getComputedStyle(nav).display,'none');dom.window.close();
});

test('mobile savings action gets a separate row and loan filters have card clearance',()=>{
 for(const width of [340,390,412,454]) {
  const dom=new JSDOM('<style></style><div class="savings-summary"><span class="running-bal-label">Total Savings</span><span class="running-bal-amt">+Rs. 77,000.00</span><button>View savings activity</button></div><div class="lending-filters"></div><div class="view-dashboard"><div class="dash-topbar"></div><div class="dash-scroll"></div></div>');
  dom.window.document.querySelector('style').textContent=stylesAt(width,844);
  const get=selector=>dom.window.getComputedStyle(dom.window.document.querySelector(selector));
  assert.equal(get('.savings-summary').display,'grid');
  assert.equal(get('.savings-summary > button').gridColumn,'1 / -1');
  assert.equal(get('.running-bal-amt').whiteSpace,'nowrap');
  assert.equal(get('.lending-filters').marginBottom,'20px');
  assert.equal(get('.dash-scroll').minHeight,'0px');
  assert.equal(get('.dash-topbar').position,'relative');
  dom.window.close();
 }
});
