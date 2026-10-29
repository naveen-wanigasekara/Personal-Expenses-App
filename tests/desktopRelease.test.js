import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import postcss from 'postcss';

const baseline = '59c0689f7fd924db9ac2a5b65e8ad40de3a39c11';
const css = readFileSync('src/styles/desktop.css', 'utf8');
const tree = postcss.parse(css);
const live = path => execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8' });
const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', baseline], { encoding: 'utf8' }).trim().split('\n');

test('existing application, database, dependencies and PWA files remain byte-identical to production', () => {
  for (const path of paths) {
    if (path === 'src/main.jsx') continue;
    assert.deepEqual(readFileSync(path), execFileSync('git', ['show', `${baseline}:${path}`]), `${path} differs from live production`);
  }
  assert.equal(readFileSync('src/main.jsx', 'utf8'), live('src/main.jsx').replace('import "./styles/app.css";', 'import "./styles/app.css";\nimport "./styles/desktop.css";'));
});

test('every added style is scoped to desktop, including variables and pseudo-elements', () => {
  const nodes = tree.nodes.filter(n => n.type !== 'comment');
  assert.equal(nodes.length, 3);
  for (const node of nodes) {
    assert.equal(node.type, 'atrule');
    assert.equal(node.name, 'media');
    assert.match(node.params, /^\(min-width: (1024|1280|1600)px\)$/);
  }
  tree.walkDecls(decl => {
    let parent = decl.parent;
    while (parent && parent.type !== 'root' && !(parent.type === 'atrule' && parent.name === 'media')) parent = parent.parent;
    assert.ok(parent && /min-width: (1024|1280|1600)px/.test(parent.params), decl.toString());
  });
  tree.walkAtRules(rule => assert.equal(rule.name, 'media', 'no imports, keyframes or external resources may leak outside desktop'));
  assert.doesNotMatch(css, /url\s*\(/i);
  for (const width of [320, 360, 390, 412, 768, 1023]) {
    const active = nodes.filter(n => width >= Number(/\d+/.exec(n.params)[0]));
    assert.equal(active.length, 0, `added styles active at mobile/tablet width ${width}`);
  }
});

test('Customize stacking escapes the sticky header only while its dialog is open', () => {
  const z = selector => {
    let value;
    tree.walkRules(selector, rule => rule.walkDecls('z-index', decl => { value = +decl.value; }));
    return value;
  };
  assert.equal(z('.content:has(.backdrop)'), 100);
  const base = postcss.parse(live('src/styles/app.css'));
  const baseZ = selector => {
    let value;
    base.walkRules(selector, rule => rule.walkDecls('z-index', decl => { value = +decl.value; }));
    return value;
  };
  assert.ok(z('.content:has(.backdrop)') > baseZ('.app-topbar'));
  assert.ok(z('.content:has(.backdrop)') > baseZ('.nav-rail'));
  assert.equal(baseZ('.content'), 1);
  assert.equal(z('.content'), undefined, 'closed content keeps the live stacking level');
});

test('desktop dialogs and charts have bounded, usable presentation', () => {
  const declarations = selector => {
    const result = {};
    tree.walkRules(selector, rule => rule.walkDecls(decl => { result[decl.prop] = decl.value; }));
    return result;
  };
  assert.equal(declarations('.sheet')['max-height'], 'calc(100dvh - 64px)');
  assert.equal(declarations('.dash-sections')['grid-template-columns'], 'repeat(12, minmax(0, 1fr))');
  assert.equal(declarations('.dash-sections > *')['min-width'], '0');
  assert.ok(parseInt(declarations('.card .chart').height) >= 210);
});
