import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
import {JSDOM} from 'jsdom';
const css=postcss.parse(readFileSync('src/styles/desktop.css','utf8'));
test('desktop summary cards retain half-width tracks and their own height beside long reports',()=>{
 for(const width of [1024,1366,1920]) {
  const dom=new JSDOM('<div class="dash-sections"><div class="running-bal">Cash</div><div class="debt-banner">Debt</div><div class="card">Long report</div></div>');
  const style=dom.window.document.createElement('style');
  style.textContent=css.nodes.filter(n=>n.type==='atrule'&&width>=+n.params.match(/\d+/)[0]).map(n=>n.nodes.map(r=>r.toString()).join('\n')).join('\n');
  dom.window.document.head.append(style);
  const get=selector=>dom.window.getComputedStyle(dom.window.document.querySelector(selector));
  assert.equal(get('.dash-sections').alignItems,'start');
  for(const selector of ['.running-bal','.debt-banner']) assert.equal(get(selector).gridColumn,'span 6');
  dom.window.close();
 }
});
test('desktop refinements remain scoped above the existing mobile/tablet breakpoint',()=>{
 for(const rule of css.nodes.filter(n=>n.type!=='comment')) {assert.equal(rule.type,'atrule');assert.equal(rule.name,'media');assert.match(rule.params,/^\(min-width: (1024|1280|1600)px\)$/);}
});
test('desktop investment labels retain readable contrast on both gradient endpoints',()=>{
 let background;css.walkRules('.inv-visual',r=>r.walkDecls('background',d=>{background=d.value}));
 assert.equal(background,'linear-gradient(135deg, #143c35, #1c5a47)');
 const lum=hex=>{const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
 for(const text of ['#f1f8f5','#b7e4d1'])for(const bg of ['#143c35','#1c5a47'])assert.ok((lum(text)+.05)/(lum(bg)+.05)>=4.5);
});
