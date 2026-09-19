const assert = require('assert/strict');
const { createCouponWallet } = require('../miniapp/modules/coupon-wallet');

const tpl = { _id: 't1', name: '恢复券', type: 'fixed', discountCent: 100, discountRateBps: null, maxDiscountCent: null, minSpendCent: 0, scopeType: 'all', scopeIds: [], validFrom: '', validTo: '2040-12-31T23:59:59.000Z', perUserLimit: 1, version: 1 };
const coupon = { _id: 'c1', templateId: 't1', status: 'available', snapshot: tpl, validFrom: '', validTo: tpl.validTo, usedOrderId: '', usedAt: '', createdAt: '2040-01-01T00:00:00.000Z', updatedAt: '2040-01-01T00:00:00.000Z' };
const ok = data => ({ ok: true, data });
const intentStore = map => ({ get: id => map.get(id), set: (id, value) => map.set(id, value), remove: id => map.delete(id) });

(async () => {
  {
    let state;
    let writes = 0;
    let claimed = false;
    const store = new Map([['u1', { userId: 'u1', templateId: 't1', idempotencyKey: 'persisted-key' }]]);
    const wallet = createCouponWallet({
      coupons: {
        templatesAll: async () => ok({ rows: [tpl] }),
        listAll: async () => ok({ rows: claimed ? [coupon] : [] }),
        resolveClaim: async payload => { assert.equal(payload.idempotencyKey, 'persisted-key'); return ok({ found: false }); },
        claim: async payload => { writes += 1; assert.equal(payload.idempotencyKey, 'persisted-key'); claimed = true; return ok({ coupon, idempotent: false }); }
      },
      intentStore: intentStore(store),
      createKey: () => 'must-not-replace-persisted-key',
      onChange: next => { state = next; }
    });
    await wallet.load({ userId: 'u1' });
    assert.equal(state.claimState, 'retry');
    assert.equal(writes, 0, '页面重开必须先查询，不能直接再写');
    await wallet.claim('t1');
    assert.equal(writes, 1);
    assert.equal(state.claimState, 'confirmed');
    assert.equal(store.has('u1'), false);
  }

  {
    let state;
    let writes = 0;
    let resolves = 0;
    const store = new Map();
    const wallet = createCouponWallet({
      coupons: {
        templatesAll: async () => ok({ rows: [tpl] }),
        listAll: async () => ok({ rows: [] }),
        claim: async () => { writes += 1; return { ok: false, error: { code: 'REQUEST_TIMEOUT' } }; },
        resolveClaim: async () => { resolves += 1; return { ok: false, error: { code: 'REQUEST_TIMEOUT' } }; }
      },
      intentStore: intentStore(store),
      createKey: () => 'unknown-key',
      onChange: next => { state = next; }
    });
    await wallet.load({ userId: 'u1' });
    await wallet.claim('t1');
    assert.equal(writes, 1);
    assert.equal(resolves, 1);
    assert.equal(state.claimState, 'unknown');
    assert.equal(store.has('u1'), true);
    await wallet.claim('t1');
    assert.equal(writes, 1, '未知结果再次操作只能查询，不能重复写');
    assert.equal(resolves, 2);
  }

  {
    let state;
    let resolves = 0;
    const store = new Map();
    const wallet = createCouponWallet({
      coupons: {
        templatesAll: async () => ok({ rows: [tpl] }),
        listAll: async () => ok({ rows: [] }),
        claim: async () => ({ ok: false, error: { code: 'COUPON_SOLD_OUT', message: '优惠券已领完' } }),
        resolveClaim: async () => { resolves += 1; return ok({ found: false }); }
      },
      intentStore: intentStore(store),
      createKey: () => 'rejected-key',
      onChange: next => { state = next; }
    });
    await wallet.load({ userId: 'u1' });
    await wallet.claim('t1');
    assert.equal(state.claimState, 'error');
    assert.equal(state.claimText, '优惠券已领完');
    assert.equal(store.has('u1'), false, '服务端明确拒绝后必须清除未决意图');
    assert.equal(resolves, 0, '明确拒绝不需要结果核对');
  }

  {
    let state;
    const store = new Map();
    const wallet = createCouponWallet({
      coupons: {
        templatesAll: async () => ok({ rows: [tpl] }),
        listAll: async () => ok({ rows: [] }),
        claim: async () => ({ ok: false, error: { code: 'REQUEST_TIMEOUT' } }),
        resolveClaim: async () => ({ ok: false, error: { code: 'AUTH_ACCOUNT_DISABLED' } })
      },
      intentStore: intentStore(store),
      createKey: () => 'revoked-key',
      onChange: next => { state = next; }
    });
    await wallet.load({ userId: 'u1' });
    await wallet.claim('t1');
    assert.equal(state.status, 'forbidden');
    assert.equal(store.has('u1'), true, '会话失效只清页面资产，原用户未决意图必须保留');
  }

  {
    let state;
    let resolves = 0;
    const store = new Map();
    const wallet = createCouponWallet({
      coupons: {
        templatesAll: async () => ok({ rows: [{ ...tpl, perUserLimit: 2 }] }),
        listAll: async () => ok({ rows: [coupon] }),
        claim: async () => ({ ok: false, error: { code: 'AUTH_ACCOUNT_DISABLED' } }),
        resolveClaim: async () => { resolves += 1; return { ok: false, error: { code: 'REQUEST_TIMEOUT' } }; }
      },
      intentStore: intentStore(store),
      createKey: () => 'revoked-direct-key',
      onChange: next => { state = next; }
    });
    await wallet.load({ userId: 'u1' });
    await wallet.claim('t1');
    assert.equal(state.status, 'forbidden', '领取请求明确返回账号失效时必须立刻清空资产');
    assert.deepEqual(state.coupons, []);
    assert.equal(resolves, 0, '明确的身份失效不应继续查询私有资产');
    assert.equal(store.has('u1'), true, '会话失效必须保留原用户待核对意图');
  }

  {
    let state;
    let resolveCalls = 0;
    let writes = 0;
    const store = new Map([['u1', { userId: 'u1', templateId: 't1', idempotencyKey: 'confirmed-but-stored' }]]);
    const wallet = createCouponWallet({
      coupons: {
        templatesAll: async () => ok({ rows: [tpl] }),
        listAll: async () => ok({ rows: [coupon] }),
        claim: async () => { writes += 1; return ok({ coupon, idempotent: true }); },
        resolveClaim: async () => { resolveCalls += 1; if (resolveCalls > 3) return { ok: false, error: { code: 'REQUEST_TIMEOUT' } }; return ok({ found: true, coupon, idempotent: true }); }
      },
      intentStore: { get: id => store.get(id), set: (id, value) => store.set(id, value), remove: () => { throw new Error('storage unavailable'); } },
      createKey: () => 'new-key-must-not-be-used',
      onChange: next => { state = next; }
    });
    await wallet.load({ userId: 'u1' });
    assert.equal(resolveCalls, 1, '已确认的未清理意图在同一实例中只核对一次，不得无界递归');
    assert.equal(state.claimState, 'confirmed');
    assert.match(state.claimText, /领取已确认/);
    await wallet.claim('t1');
    assert.equal(writes, 0, '持久意图未能清理前不可发起另一笔领取');
    assert.equal(store.has('u1'), true, '失败的本地清理不能伪装成已删除');
  }

  {
    let state;
    const writes = [];
    const secondTemplate = { ...tpl, _id: 't2', name: '另一张券' };
    const store = new Map([['u1', { userId: 'u1', templateId: 't1', idempotencyKey: 'original-key' }]]);
    const wallet = createCouponWallet({
      coupons: {
        templatesAll: async () => ok({ rows: [tpl, secondTemplate] }),
        listAll: async () => ok({ rows: [] }),
        claim: async payload => { writes.push(payload); return { ok: false, error: { code: 'COUPON_SOLD_OUT' } }; },
        resolveClaim: async () => ok({ found: false })
      },
      intentStore: intentStore(store),
      createKey: () => 'new-key-must-not-replace-old',
      onChange: next => { state = next; }
    });
    await wallet.load({ userId: 'u1' });
    await wallet.claim('t2');
    assert.equal(writes.length, 0, '原领取待核对时不得切换模板生成新键');
    assert.equal(store.get('u1').idempotencyKey, 'original-key');
    await wallet.claim('t1');
    assert.deepEqual(writes, [{ templateId: 't1', idempotencyKey: 'original-key' }], '明确未完成后只能对原模板同键重试');
    assert.equal(state.claimState, 'error', '同键重试的明确业务拒绝应正常结束');
  }
  console.log('coupon wallet recovery test: passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
