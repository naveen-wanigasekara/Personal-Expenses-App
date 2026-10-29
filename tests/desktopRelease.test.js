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

test('existing application, database and PWA identity files remain byte-identical to production', () => {
  for (const path of paths) {
    if (['src/main.jsx', 'package.json', 'package-lock.json', 'vite.config.js'].includes(path)) continue;
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


test('client package versions remain production-identical; only the audited Node WebSocket dependency is patched', () => {
  const oldLock = JSON.parse(live('package-lock.json'));
  const newLock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const oldPkg = JSON.parse(live('package.json'));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), Object.keys(oldPkg.dependencies).sort());
  for (const [path, entry] of Object.entries(oldLock.packages)) {
    if (!path || entry.dev) continue;
    if (path === 'node_modules/ws') {
      assert.equal(newLock.packages[path].version, '8.22.0', 'only the reviewed ws patch is permitted');
      continue;
    }
    assert.equal(newLock.packages[path]?.version, entry.version, `${path} runtime version changed`);
    assert.equal(newLock.packages[path]?.integrity, entry.integrity, `${path} runtime integrity changed`);
  }
  for (const name of Object.keys(pkg.dependencies)) {
    assert.equal(pkg.dependencies[name], oldLock.packages[`node_modules/${name}`].version, `${name} must be pinned to live version`);
  }
});

test('PWA settings are identical; Vite changes only the JSX compiler and removes the old React build plugin', () => {
  const expected = live('vite.config.js')
    .replace('import react from "@vitejs/plugin-react";\n', '')
    .replace('    react(),\n', '')
    .replace('export default defineConfig({', 'export default defineConfig({\n  oxc: { jsx: { runtime: "automatic" } },');
  assert.equal(readFileSync('vite.config.js', 'utf8'), expected);
});

test('old and candidate encryption round-trip saved values in both directions with synthetic keys', async () => {
  const loadCrypto = (source, version) => import(`data:text/javascript;base64,${Buffer.from(source.replace('import.meta.env.VITE_ENCRYPTION_SECRET', '"synthetic-release-test-only"') + `\n// ${version}`).toString('base64')}`);
  const previous = await loadCrypto(live('src/lib/crypto.js'), 'previous');
  const candidate = await loadCrypto(readFileSync('src/lib/crypto.js', 'utf8'), 'candidate');
  await previous.initCrypto('synthetic-user');
  await candidate.initCrypto('synthetic-user');
  const values = [0, 55000.25, 'Saved expense note', ['income', 'savings'], { visible: true, sections: ['net_this_month', 'cash_in_hand'] }];
  for (const value of values) {
    const oldCiphertext = await previous.encryptValue(value);
    assert.match(oldCiphertext, /^enc:/);
    assert.deepEqual(await candidate.decryptValue(oldCiphertext), value);
    assert.deepEqual(await previous.decryptValue(await candidate.encryptValue(value)), value);
  }
  previous.clearCrypto(); candidate.clearCrypto();
});


test('built PWA retains its exact production install identity and settings', () => {
  const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
  assert.equal(manifest.name, 'Personal Expenses Tracker');
  assert.equal(manifest.short_name, 'Expensetracker');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'portrait');
  assert.equal(manifest.theme_color, '#0d1117');
  assert.equal(manifest.background_color, '#0d1117');
  assert.equal(manifest.icons.length, 4);
  const sw = readFileSync('dist/sw.js', 'utf8');
  assert.match(sw, /skipWaiting/);
  assert.match(sw, /clientsClaim/);
  for (const name of ['google-fonts-stylesheets', 'google-fonts-webfonts', 'supabase-api']) assert.ok(sw.includes(name));
});
