const assert = require('assert/strict');
const test = require('node:test');

const { createOrderSubmission, isDefinitiveRejection, orderIntentFromCheckout, orderIntentValidation, paymentMethodForUser, requiresRequote } = require('../miniapp/modules/order-submission');

test('submission keeps one idempotency key and exposes unknown result', async () => {
  const calls = [];
  const session = createOrderSubmission({
    createKey: () => 'stable-key',
    createOrder: async payload => {
      calls.push(payload);
      return { ok: false, error: { code: 'REQUEST_TIMEOUT', message: '请求超时' } };
    },
    resolveOrder: async () => ({ ok: true, data: { found: false, order: null } })
  });
  const result = await session.submit({ warehouseId: 'warehouse-1' });
  assert.equal(result.kind, 'unknown');
  assert.equal(result.idempotencyKey, 'stable-key');
  assert.equal(calls[0].idempotencyKey, 'stable-key');
  assert.equal(session.currentKey(), 'stable-key');
});

test('unknown submission resolves the original order before any retry', async () => {
  const resolveCalls = [];
  const session = createOrderSubmission({
    createKey: () => 'stable-key',
    createOrder: async () => ({ ok: false, error: { code: 'REQUEST_FAILED' } }),
    resolveOrder: async payload => {
      resolveCalls.push(payload);
      return { ok: true, data: { found: true, order: { _id: 'order-1', paymentMethod: 'demo' } } };
    }
  });
  await session.submit({});
  const result = await session.resolve();
  assert.equal(result.kind, 'created');
  assert.equal(result.order._id, 'order-1');
  assert.deepEqual(resolveCalls, [{ idempotencyKey: 'stable-key' }]);
  assert.equal(session.currentKey(), '');
});

test('confirmed not-created result permits a safe retry with the same key', async () => {
  let createCount = 0;
  const keys = [];
  const session = createOrderSubmission({
    createKey: () => 'stable-key',
    createOrder: async payload => {
      createCount += 1;
      keys.push(payload.idempotencyKey);
      return createCount === 1
        ? { ok: false, error: { code: 'REQUEST_FAILED' } }
        : { ok: true, data: { order: { _id: 'order-1' } } };
    },
    resolveOrder: async () => ({ ok: true, data: { found: false, order: null } })
  });
  assert.equal((await session.submit({})).kind, 'unknown');
  assert.equal((await session.resolve()).kind, 'not_found');
  assert.equal((await session.submit({})).kind, 'created');
  assert.deepEqual(keys, ['stable-key', 'stable-key']);
});

test('definitive rejection clears the attempt while concurrent submit stays locked', async () => {
  let release;
  let createCount = 0;
  const session = createOrderSubmission({
    createKey: () => `key-${createCount + 1}`,
    createOrder: async () => {
      createCount += 1;
      return new Promise(resolve => { release = resolve; });
    },
    resolveOrder: async () => ({ ok: true, data: { found: false } })
  });
  const first = session.submit({});
  const second = await session.submit({});
  assert.equal(second.kind, 'busy');
  assert.equal(createCount, 1);
  release({ ok: false, error: { code: 'QUOTE_CHANGED', message: '报价已变化' } });
  const rejected = await first;
  assert.equal(rejected.kind, 'rejected');
  assert.equal(session.currentKey(), '');
});

test('unrecognized errors stay unknown and cannot clear the idempotency key', async () => {
  const session = createOrderSubmission({
    createKey: () => 'stable-key',
    createOrder: async () => ({ ok: false, error: { code: 'FUTURE_GATEWAY_FAILURE' } }),
    resolveOrder: async () => ({ ok: true, data: { found: false } })
  });
  assert.equal((await session.submit({})).kind, 'unknown');
  assert.equal(session.currentKey(), 'stable-key');
  assert.equal(isDefinitiveRejection('FUTURE_GATEWAY_FAILURE'), false);
});

test('key generation failures never leave the session locked', async () => {
  const session = createOrderSubmission({
    createKey: () => { throw new Error('entropy unavailable'); },
    createOrder: async () => ({ ok: true }),
    resolveOrder: async () => ({ ok: true, data: { found: false } })
  });
  await assert.rejects(() => session.submit({}), /entropy unavailable/);
  assert.equal(session.isBusy(), false);
});

test('late recovery response keeps all new submissions locked until it resolves', async () => {
  let releaseResolve;
  const session = createOrderSubmission({
    createKey: () => 'stable-key',
    createOrder: async () => ({ ok: false, error: { code: 'REQUEST_TIMEOUT' } }),
    resolveOrder: async () => new Promise(resolve => { releaseResolve = resolve; })
  });
  await session.submit({});
  const resolving = session.resolve();
  assert.equal((await session.submit({})).kind, 'busy');
  releaseResolve({ ok: true, data: { found: true, order: { _id: 'order-late' } } });
  assert.equal((await resolving).order._id, 'order-late');
});

test('checkout intent and payment method are domain decisions outside the page shell', () => {
  assert.equal(paymentMethodForUser({ user: { userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' } }), 'offline');
  assert.equal(paymentMethodForUser({ user: { userType: 'c' }, capabilities: { paymentPrepare: true, paymentNotify: true } }), 'wechat');
  assert.equal(paymentMethodForUser({ user: { userType: 'c' }, capabilities: { demoOrder: true } }), 'demo');
  assert.equal(paymentMethodForUser({ user: { userType: 'c' } }), '', 'ordinary checkout must not invent a payment method when the server exposes none');
  assert.equal(paymentMethodForUser({ groupMode: true, user: { userType: 'b' }, capabilities: { paymentPrepare: true, paymentNotify: true } }), 'wechat');
  assert.equal(paymentMethodForUser({ groupMode: true, user: { userType: 'b' }, capabilities: { demoOrder: true } }), '', 'group checkout requires real WeChat payment capability');
  const input = { fulfillmentType: 'pickup', pickupSiteId: 'p1', warehouseId: 'w1', cartItems: [{ skuId: 's1', qty: 2 }] };
  assert.equal(orderIntentValidation(input).ok, true);
  assert.equal(orderIntentValidation({ ...input, pickupSiteId: '' }).message, '当前仓库暂无可用自提点');
  assert.deepEqual(orderIntentFromCheckout({ input, paymentMethod: 'offline' }), {
    fulfillmentType: 'pickup', pickupSiteId: 'p1', warehouseId: 'w1', items: [{ skuId: 's1', quantity: 2 }], paymentMethod: 'offline'
  });
  assert.equal(requiresRequote('QUOTE_CHANGED'), true);
});
