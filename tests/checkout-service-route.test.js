const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const checkoutPath = path.resolve(__dirname, '../miniapp/services/checkout.js');
const originalLoad = Module._load;
const calls = [];

Module._load = function loadWithRequestStub(request, parent, isMain) {
  if (request === './request' && parent && parent.filename === checkoutPath) {
    return { request: (action, payload) => { calls.push({ action, payload }); return Promise.resolve({ ok: true, data: {} }); } };
  }
  return originalLoad.call(this, request, parent, isMain);
};

try {
  delete require.cache[checkoutPath];
  const checkout = require(checkoutPath);
  checkout.createOrder({ idempotencyKey: 'order-key' });
} finally {
  Module._load = originalLoad;
  delete require.cache[checkoutPath];
}

assert.deepStrictEqual(calls, [{ action: 'orders.create', payload: { idempotencyKey: 'order-key' } }]);
console.log('checkout service route test: passed');
