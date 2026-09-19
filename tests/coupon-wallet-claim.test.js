const assert = require('assert/strict');
const { createCouponWallet } = require('../miniapp/modules/coupon-wallet');

const baseTemplate = { _id: 't1', name: '满减券', type: 'fixed', discountCent: 500, discountRateBps: null, maxDiscountCent: null, minSpendCent: 3000, scopeType: 'all', scopeIds: [], validFrom: '', validTo: '2040-12-31T23:59:59.000Z', perUserLimit: 1, version: 1 };
const claimedCoupon = { _id: 'c1', templateId: 't1', status: 'available', snapshot: baseTemplate, validFrom: '', validTo: baseTemplate.validTo, usedOrderId: '', usedAt: '', createdAt: '2040-01-01T00:00:00.000Z', updatedAt: '2040-01-01T00:00:00.000Z' };
const ok = data => ({ ok: true, data });

(async () => {
  let state;
  let claimed = false;
  let writes = 0;
  const store = new Map();
  const coupons = {
    templatesAll: async () => ok({ rows: [baseTemplate] }),
    listAll: async () => ok({ rows: claimed ? [claimedCoupon] : [] }),
    claim: async payload => {
      writes += 1;
      assert.deepEqual(store.get('u1'), { userId: 'u1', templateId: 't1', idempotencyKey: payload.idempotencyKey }, '领取意图必须在写请求前持久化');
      claimed = true;
      return ok({ coupon: claimedCoupon, idempotent: false });
    },
    resolveClaim: async () => ok({ found: false })
  };
  const wallet = createCouponWallet({
    coupons,
    intentStore: { get: id => store.get(id), set: (id, value) => store.set(id, value), remove: id => store.delete(id) },
    createKey: () => 'stable-key',
    onChange: next => { state = next; }
  });

  await wallet.load({ userId: 'u1' });
  await wallet.claim('t1');
  assert.equal(writes, 1);
  assert.equal(store.has('u1'), false, '确认领取后必须清除本地意图');
  assert.equal(state.claimState, 'confirmed');
  assert.equal(state.coupons.length, 1);
  assert.equal(state.templates[0].canClaim, false);
  await wallet.claim('t1');
  assert.equal(writes, 1, '达到限领数量后不得再次写领取请求');
  console.log('coupon wallet claim test: passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
