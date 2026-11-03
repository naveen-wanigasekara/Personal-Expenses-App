import test from 'node:test';
import assert from 'node:assert/strict';
import merge from '../vendor/deepmerge/index.cjs';

test('local build merge rejects prototype control keys from source and target', () => {
  const payload = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"prototype":{"polluted":true},"safe":1}');
  for (const target of [{}, Object.create(null), payload]) {
    for (const source of [payload, Object.assign(Object.create(null), payload), {nested:payload}]) {
      const result=merge(target,source);
      assert.equal(Object.getPrototypeOf(result),Object.prototype);
      assert.equal(result.polluted,undefined);
      assert.equal(Object.hasOwn(result,'__proto__'),false);
      assert.equal(Object.hasOwn(result,'constructor'),false);
      assert.equal(Object.hasOwn(result,'prototype'),false);
      if(result.nested) {
        assert.equal(Object.getPrototypeOf(result.nested),Object.prototype);
        assert.equal(result.nested.polluted,undefined);
      }
      assert.equal({}.polluted,undefined);
    }
  }
});

test('local build merge preserves configuration merging, symbols and clone behavior', () => {
  const symbol=Symbol('config');
  const first={extensions:['.js'],resolve:{browser:true},[symbol]:{one:1}};
  const second={extensions:['.jsx'],resolve:{preferBuiltins:false},[symbol]:{two:2}};
  const result=merge(first,second);
  assert.deepEqual(result.extensions,['.js','.jsx']);
  assert.deepEqual(result.resolve,{browser:true,preferBuiltins:false});
  assert.deepEqual(result[symbol],{one:1,two:2});
  assert.deepEqual(first.extensions,['.js']);
  assert.notEqual(result.resolve,first.resolve);
  const date=new Date('2026-01-01'); const regex=/config/i;
  assert.equal(merge({}, {date,regex}).date,date);
  assert.equal(merge({}, {date,regex}).regex,regex);
  assert.deepEqual(merge.all([{a:1},{b:2},{nested:{c:3}}]),{a:1,b:2,nested:{c:3}});
});

test('local build merge retains custom array/custom property merge contracts', () => {
  assert.deepEqual(merge({a:[1]},{a:[2]},{arrayMerge:(_a,b)=>b}),{a:[2]});
  assert.deepEqual(merge({options:{a:1}},{options:{b:2}},{customMerge:key=>key==='options'?(_a,b)=>b:undefined}),{options:{b:2}});
  const value={nested:{a:1}};
  assert.equal(merge({},value,{clone:false}).nested,value.nested);
});
