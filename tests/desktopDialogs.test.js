import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const base = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const desktop = readFileSync(new URL('../src/styles/desktop.css', import.meta.url), 'utf8');
const relevant = new Set(['.content', '.content:has(.backdrop)', '.app-topbar', '.nav-rail', '.backdrop']);

// jsdom does not evaluate viewport media queries. Select the actual stacking
// rules for a width, then let its selector engine/style cascade resolve :has.
function workspace(width, includeDesktop = true) {
  const dom = new JSDOM('<div class="app"><header class="app-topbar"></header><main class="content"><div class="view view-dashboard"><div class="backdrop"><div class="sheet" role="dialog">Customize</div></div></div></main><nav class="nav-rail"></nav></div>');
  const document = dom.window.document;
  const source = document.createElement('style');
  source.textContent = base + (includeDesktop ? desktop : '');
  document.head.append(source);
  const selected = [];
  function visit(rules) {
    for (const rule of rules) {
      if (rule.type === 1 && rule.selectorText.split(',').some(s => relevant.has(s.trim()))) selected.push(rule.cssText);
      else if (rule.type === 4) {
        const min = /min-width:\s*(\d+)px/.exec(rule.conditionText);
        const max = /max-width:\s*(\d+)px/.exec(rule.conditionText);
        if ((min || max) && (!min || width >= +min[1]) && (!max || width <= +max[1])) visit(rule.cssRules);
      }
    }
  }
  visit(source.sheet.cssRules);
  source.remove();
  const active = document.createElement('style');
  active.textContent = selected.join('\n');
  document.head.append(active);
  return { dom, document, z: selector => Number(dom.window.getComputedStyle(document.querySelector(selector)).zIndex) };
}

test('desktop Customize escapes the content stacking context above header and rail, then restores it on close', () => {
  for (const width of [1024, 1366, 1920]) {
    const { dom, document, z } = workspace(width);
    assert.ok(z('.content') > z('.app-topbar'), `header overlaps dialog at ${width}`);
    assert.ok(z('.content') > z('.nav-rail'), `sidebar overlaps dialog at ${width}`);
    document.querySelector('.backdrop').remove();
    assert.equal(z('.content'), 1, 'normal header layering must return after close');
    dom.window.close();
  }
});

test('desktop dialog fix leaves mobile and tablet stacking unchanged', () => {
  for (const width of [390, 768, 1023]) {
    const original = workspace(width, false);
    const updated = workspace(width);
    for (const selector of ['.content', '.backdrop', '.app-topbar', '.nav-rail']) assert.equal(updated.z(selector), original.z(selector));
    original.dom.window.close(); updated.dom.window.close();
  }
});
