import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeTheme, readTheme, resolveTheme, applyTheme, THEME_STORAGE_KEY } from "../src/utils/theme.js";

const bootScript = readFileSync(new URL("../public/theme-init.js", import.meta.url), "utf8");
function fixture(saved, systemDark = false, blocked = false) {
  const root = { dataset: {}, style: {} };
  const metas = {};
  const document = { documentElement: root, querySelector: (selector) => ({ setAttribute: (_, value) => { metas[selector] = value; } }) };
  const localStorage = { getItem: () => { if (blocked) throw new Error("blocked"); return saved; } };
  return { root, metas, document, localStorage, matchMedia: () => ({ matches: systemDark }) };
}

test("invalid or unavailable preferences preserve the existing dark default", () => {
  assert.equal(normalizeTheme("invalid"), "dark");
  assert.equal(readTheme({ getItem: () => null }), "dark");
  assert.equal(readTheme({ getItem: () => { throw new Error("blocked"); } }), "dark");
});
test("explicit appearance overrides the system and system follows its preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
});
test("the first-paint script and runtime resolution agree for every preference", () => {
  for (const saved of [null, "invalid", "dark", "light", "system"]) {
    for (const systemDark of [true, false]) {
      const env = fixture(saved, systemDark);
      vm.runInNewContext(bootScript, env);
      assert.equal(env.root.dataset.theme, resolveTheme(normalizeTheme(saved), systemDark));
      assert.equal(env.root.style.colorScheme, env.root.dataset.theme);
      assert.equal(env.metas['meta[name="color-scheme"]'], env.root.dataset.theme);
      assert.equal(env.metas['meta[name="theme-color"]'], env.root.dataset.theme === "light" ? "#f3f7f5" : "#080f14");
    }
  }
});
test("the first-paint script works when storage is blocked", () => {
  const env = fixture("light", false, true);
  vm.runInNewContext(bootScript, env);
  assert.equal(env.root.dataset.theme, "dark");
});
test("runtime theme changes update native controls and browser chrome together", () => {
  const env = fixture("dark");
  const previousDocument = globalThis.document;
  globalThis.document = env.document;
  try {
    applyTheme("light");
    assert.equal(env.root.dataset.theme, "light");
    assert.equal(env.root.style.colorScheme, "light");
    assert.equal(env.metas['meta[name="theme-color"]'], "#f3f7f5");
    applyTheme("dark");
    assert.equal(env.metas['meta[name="theme-color"]'], "#080f14");
  } finally { globalThis.document = previousDocument; }
  assert.equal(THEME_STORAGE_KEY, "ledger-theme-v1");
});
