const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const definitions = [];
const calls = Object.create(null);
let currentUser = null;
const activeUser = { _id: 'u1', userType: 'c', status: 'active' };
const spy = (name, implementation) => async (...args) => {
  calls[name] = Number(calls[name] || 0) + 1;
  return implementation(...args);
};
const services = {
  auth: { getMe: spy('auth.getMe', async () => currentUser ? { ok: true, data: { user: currentUser } } : { ok: false, error: { code: 'UNAUTHORIZED' } }) },
  storedValue: {
    account: spy('storedValue.account', async () => ({ ok: true, data: { account: { balanceCent: 100, status: 'active', realRechargeEnabled: true } } })),
    ledger: spy('storedValue.ledger', async () => ({ ok: true, data: { rows: [{ _id: 'sv1', amountCent: 100, description: '账户调整' }] } })),
    topupIntent: async () => ({ ok: true, data: {} })
  },
  membership: {
    pointsAccount: spy('membership.pointsAccount', async () => ({ ok: true, data: { account: { balance: 12, lifetimeEarned: 20 } } })),
    profile: spy('membership.profile', async () => ({ ok: true, data: { profile: {}, level: { name: '普通会员', benefits: [] } } })),
    pointsLedger: spy('membership.pointsLedger', async () => ({ ok: true, data: { rows: [
      { _id: 'p1', action: 'daily_sign_in', change: 1 },
      { _id: 'p2', action: 'order_reward', change: 2 },
      { _id: 'p3', action: 'refund_reversal', change: -1 },
      { _id: 'p4', action: 'admin_adjust', change: 3 },
      { _id: 'p5', action: 'future_internal_code', change: 1 }
    ] } })),
    signIn: async () => ({ ok: true, data: {} })
  },
  invoices: {
    titles: spy('invoices.titles', async () => ({ ok: true, data: { rows: [{ _id: 't1', type: 'personal', name: '个人' }] } })),
    list: spy('invoices.list', async () => ({ ok: true, data: { rows: [] } })),
    saveTitle: async () => ({ ok: true, data: {} }), deleteTitle: async () => ({ ok: true, data: {} }), request: async () => ({ ok: true, data: {} })
  },
  orders: { list: spy('orders.list', async () => ({ ok: true, data: { rows: [{ _id: 'o1', orderNo: 'LONG-ORDER-12345678', status: 'completed', paymentStatus: 'paid', totalAmountCent: 1000 }] } })) },
  reviews: {
    eligible: spy('reviews.eligible', async () => ({ ok: true, data: { rows: [{ orderId: 'order-internal-12345678', orderNo: 'LONG-ORDER-12345678', orderItemId: 'i1', skuId: 's1', productNameSnapshot: '鱼丸' }] } })),
    mine: spy('reviews.mine', async () => ({ ok: true, data: { rows: [{ _id: 'r1', content: '很好', rating: 5 }] } })),
    create: async () => ({ ok: true, data: {} }), uploadMedia: async () => ({ ok: true, data: {} })
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => definitions.push(definition);
global.wx = { navigateBack() {}, showToast() {}, showModal() {}, chooseMedia() {}, getFileSystemManager() { return { readFile() {} }; } };
const pageNames = ['stored-value', 'points', 'invoices', 'reviews'];
try {
  for (const name of pageNames) require(path.resolve(__dirname, `../miniapp/package-member/pages/${name}/index.js`));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function makePage(definition) {
  return Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch) { Object.assign(this.data, patch); }
  });
}
const cases = [
  { name: 'stored-value', calls: ['storedValue.account', 'storedValue.ledger'], cleared: { account: null, ledger: [], amount: '', intent: null } },
  { name: 'points', calls: ['membership.pointsAccount', 'membership.profile', 'membership.pointsLedger'], cleared: { account: null, profile: null, ledger: [] } },
  { name: 'invoices', calls: ['invoices.titles', 'invoices.list', 'orders.list'], cleared: { titles: [], records: [], orders: [], invoiceEmail: '', formVisible: false } },
  { name: 'reviews', calls: ['reviews.eligible', 'reviews.mine'], cleared: { orders: [], mine: [], current: null, content: '', media: [] } }
];
const count = names => names.reduce((total, name) => total + Number(calls[name] || 0), 0);

async function run() {
  assert.equal(definitions.length, cases.length);
  for (let index = 0; index < cases.length; index += 1) {
    const item = cases[index];
    const page = makePage(definitions[index]);
    const authBeforeLoad = Number(calls['auth.getMe'] || 0);
    await page.onLoad({ orderId: 'o1' });
    assert.equal(Number(calls['auth.getMe'] || 0), authBeforeLoad, `${item.name} onLoad must not duplicate onShow authentication`);
    for (const revoked of [null, { _id: 'u1', userType: 'c', status: 'disabled' }]) {
      currentUser = activeUser;
      const privateBefore = count(item.calls);
      await page.onShow();
      assert.notEqual(page.data.status, 'forbidden', `${item.name} must load for an active member`);
      assert(count(item.calls) > privateBefore, `${item.name} must call private services after authentication`);
      if (item.name === 'points') assert.deepEqual(page.data.ledger.map(row => row.label), ['每日签到', '订单奖励', '退款扣回', '后台调整', '积分变动']);
      if (item.name === 'reviews') assert.equal(page.data.orders[0].orderLabel, '订单尾号 5678');

      currentUser = revoked;
      const beforeRevoked = count(item.calls);
      await page.onShow();
      assert.equal(page.data.status, 'forbidden', `${item.name} must reject a revoked member`);
      assert.equal(count(item.calls), beforeRevoked, `${item.name} must not call private services after revocation`);
      for (const [field, expected] of Object.entries(item.cleared)) assert.deepEqual(page.data[field], expected, `${item.name} must clear ${field}`);
    }
  }

  const stored = makePage(definitions[0]);
  let releaseAccount;
  let markStarted;
  const started = new Promise(resolve => { markStarted = resolve; });
  services.storedValue.account = async () => {
    markStarted();
    return new Promise(resolve => { releaseAccount = resolve; });
  };
  currentUser = activeUser;
  const staleLoad = stored.onShow();
  await started;
  currentUser = null;
  await stored.onShow();
  releaseAccount({ ok: true, data: { account: { balanceCent: 999999, status: 'active', realRechargeEnabled: true } } });
  await staleLoad;
  assert.equal(stored.data.status, 'forbidden', 'an older member response must not replace revoked state');
  assert.equal(stored.data.account, null, 'an older member response must not restore sensitive data');
  console.log('member auth refresh matrix test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
