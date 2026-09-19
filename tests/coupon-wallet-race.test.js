const assert = require('assert/strict');
const { createCouponWallet } = require('../miniapp/modules/coupon-wallet');

const tpl = { _id: 't1', name: '竞态券', type: 'fixed', discountCent: 100, discountRateBps: null, maxDiscountCent: null, minSpendCent: 0, scopeType: 'all', scopeIds: [], validFrom: '', validTo: '2040-12-31T23:59:59.000Z', perUserLimit: 1, version: 1 };
const coupon = { _id: 'c1', templateId: 't1', status: 'available', snapshot: tpl, validFrom: '', validTo: tpl.validTo, usedOrderId: '', usedAt: '', createdAt: '2040-01-01T00:00:00.000Z', updatedAt: '2040-01-01T00:00:00.000Z' };
const ok = data => ({ ok: true, data });

(async () => {
  let state;
  let releaseTemplates;
  let releaseCoupons;
  let templateCalls = 0;
  let listCalls = 0;
  const store = new Map();
  const services = {
    templatesAll: async () => {
      templateCalls += 1;
      if (templateCalls === 1) return new Promise(resolve => { releaseTemplates = resolve; });
      return ok({ rows: [] });
    },
    listAll: async () => {
      listCalls += 1;
      if (listCalls === 1) return new Promise(resolve => { releaseCoupons = resolve; });
      return ok({ rows: [] });
    }
  };
  const wallet = createCouponWallet({
    coupons: services,
    intentStore: { get: id => store.get(id), set: (id, value) => store.set(id, value), remove: id => store.delete(id) },
    createKey: () => 'race-key',
    onChange: next => { state = next; }
  });
  const oldLoad = wallet.load({ userId: 'u1' });
  await wallet.load({ userId: 'u2' });
  assert.equal(state.status, 'empty');
  releaseTemplates(ok({ rows: [tpl] }));
  releaseCoupons(ok({ rows: [coupon] }));
  await oldLoad;
  assert.equal(state.status, 'empty', '旧账号迟到的资产不得覆盖新账号状态');
  assert.deepEqual(state.coupons, []);

  let releaseClaim;
  services.templatesAll = async () => ok({ rows: [tpl] });
  services.listAll = async () => ok({ rows: [] });
  services.claim = async () => new Promise(resolve => { releaseClaim = resolve; });
  services.resolveClaim = async () => ok({ found: false });
  await wallet.load({ userId: 'u1' });
  const pendingClaim = wallet.claim('t1');
  await wallet.load({ userId: 'u2' });
  releaseClaim(ok({ coupon, idempotent: false }));
  await pendingClaim;
  assert.equal(state.status, 'ready', '新账号页面状态不得被旧领取结果覆盖');
  assert.equal(store.has('u1'), true, '被隔离的旧领取结果仍需保留给原用户核对');
  assert.equal(store.has('u2'), false);
  wallet.dispose();
  console.log('coupon wallet race test: passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
