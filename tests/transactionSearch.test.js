import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesTransactionAmount} from '../src/utils/transactionSearch.js';
test('formatted monetary queries match exact amounts without treating arbitrary text as numbers',()=>{
 for(const amount of [0,0.5,19.19,1919,1000000.25]) {
  const formatted=amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  assert.equal(matchesTransactionAmount(amount,formatted,'Rs.'),true);
  assert.equal(matchesTransactionAmount(amount,`Rs. ${formatted}`,'Rs.'),true);
  assert.equal(matchesTransactionAmount(amount+.01,formatted,'Rs.'),false);
 }
 for(const query of ['', 'Rs.', 'lunch 1919', 'not-here', 'NaN', 'Infinity', '1e3']) assert.equal(matchesTransactionAmount(1919,query,'Rs.'),false);
});
