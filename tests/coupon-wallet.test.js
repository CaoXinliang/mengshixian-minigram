const assert = require('assert/strict');
const { createCouponWallet } = require('../miniapp/modules/coupon-wallet');

const ok = data => ({ ok: true, data });
const template = (id, patch = {}) => ({
  _id: id,
  name: `优惠券${id}`,
  type: 'fixed',
  discountCent: 500,
  discountRateBps: null,
  maxDiscountCent: null,
  minSpendCent: 3000,
  scopeType: 'all',
  scopeIds: [],
  validFrom: '',
  validTo: '2040-12-31T23:59:59.000Z',
  perUserLimit: 1,
  version: 1,
  ...patch
});
const owned = (id, templateId, status, patch = {}) => ({
  _id: id,
  templateId,
  status,
  snapshot: template(templateId),
  validFrom: '',
  validTo: '2040-12-31T23:59:59.000Z',
  usedOrderId: '',
  usedAt: '',
  createdAt: '2040-01-01T00:00:00.000Z',
  updatedAt: '2040-01-01T00:00:00.000Z',
  ...patch
});

(async () => {
  let state;
  const store = new Map();
  const coupons = {
    templatesAll: async () => ok({ rows: [template('t1', { perUserLimit: 2 }), template('t2')] }),
    listAll: async () => ok({ rows: [owned('c1', 't1', 'available'), owned('c2', 't2', 'used'), owned('c3', 't3', 'expired')] })
  };
  const wallet = createCouponWallet({
    coupons,
    intentStore: { get: id => store.get(id), set: (id, value) => store.set(id, value), remove: id => store.delete(id) },
    createKey: () => 'stable-key',
    onChange: next => { state = next; }
  });

  await wallet.load({ userId: 'u1' });
  assert.equal(state.status, 'ready');
  assert.equal(state.coupons.find(row => row.id === 'c1').statusText, '可使用');
  assert.equal(state.coupons.find(row => row.id === 'c2').statusText, '已使用');
  assert.equal(state.coupons.find(row => row.id === 'c3').statusText, '已过期');
  assert.equal(state.coupons.find(row => row.id === 'c2').usable, false);
  assert.equal(state.templates.find(row => row.id === 't1').canClaim, true, '每人可领两张时拥有一张仍可继续领取');
  assert.equal(state.templates.find(row => row.id === 't1').claimText, '继续领取');
  assert.equal(state.templates.find(row => row.id === 't2').canClaim, false);
  assert.equal(state.templates.find(row => row.id === 't2').claimText, '已达限领数量');

  for (const patch of [
    { scopeType: 'internal' },
    { scopeIds: null },
    { version: 0 },
    { maxDiscountCent: -1 },
    { validTo: 'not-a-date' }
  ]) {
    let invalidState;
    const invalidWallet = createCouponWallet({
      coupons: {
        templatesAll: async () => ok({ rows: [template('invalid', patch)] }),
        listAll: async () => ok({ rows: [] })
      },
      intentStore: { get() { return null; }, set() {}, remove() {} },
      createKey: () => 'unused',
      onChange: next => { invalidState = next; }
    });
    await invalidWallet.load({ userId: 'u1' });
    assert.equal(invalidState.status, 'error', `不完整券面必须拒绝加载：${JSON.stringify(patch)}`);
  }
  console.log('coupon wallet test: passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
