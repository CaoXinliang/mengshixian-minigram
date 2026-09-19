const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const definitions = [];
const calls = Object.create(null);
const navigations = [];
let currentUser = null;
const approvedUser = { userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active', priceLevel: 'B1' };
const revokedUsers = [
  { name: 'customer', user: { userType: 'c', businessStatus: '', organizationId: '', status: 'active' } },
  { name: 'pending business', user: { userType: 'b', businessStatus: 'pending', organizationId: 'org-1', status: 'active' } },
  { name: 'organization removed', user: { userType: 'b', businessStatus: 'approved', organizationId: '', status: 'active' } },
  { name: 'account disabled', user: { userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'disabled' } },
  { name: 'signed out', user: null }
];

const spy = (name, implementation) => async (...args) => {
  calls[name] = (calls[name] || 0) + 1;
  return implementation(...args);
};
const services = {
  auth: { getMe: spy('auth.getMe', async () => currentUser ? { ok: true, data: { user: currentUser } } : { ok: false, error: { code: 'UNAUTHORIZED' } }) },
  procurement: {
    getAccount: spy('procurement.getAccount', async () => ({ ok: true, data: { account: { organizationName: '测试企业', creditLimitCent: 10000 } } })),
    listAllReceivables: spy('procurement.listAllReceivables', async () => ({ ok: true, data: { rows: [{ _id: 'recv-1', amountCent: 100 }] } })),
    listAllStatements: spy('procurement.listAllStatements', async () => ({ ok: true, data: { rows: [{ _id: 'stmt-1', amountCent: 100 }] } }))
  },
  frequent: {
    listAll: spy('frequent.listAll', async () => ({ ok: true, data: { rows: [{ _id: 'freq-1', skuId: 'sku-1', quantity: 1 }] } })),
    batchAddToCart: spy('frequent.batchAddToCart', async () => ({ ok: true, data: {} }))
  },
  catalog: {
    listAllProducts: spy('catalog.listAllProducts', async () => ({ ok: true, data: { rows: [{ _id: 'product-1', name: '鱼丸', skus: [{ _id: 'sku-1', specName: '500g' }] }] } })),
    listPrices: spy('catalog.listPrices', async () => ({ ok: true, data: { rows: [{ skuId: 'sku-1', amountCent: 1000 }] } }))
  },
  inquiries: {
    listAll: spy('inquiries.listAll', async () => ({ ok: true, data: { rows: [{ _id: 'inq-1', inquiryNo: 'IQ-1', status: 'submitted', itemCount: 1 }] } })),
    get: spy('inquiries.get', async () => ({ ok: true, data: { inquiry: { _id: 'inq-1', status: 'submitted' }, items: [{ skuId: 'sku-1', quantity: 1 }] } })),
    create: spy('inquiries.create', async () => ({ ok: true, data: { inquiry: { _id: 'inq-1' } } })),
    accept: spy('inquiries.accept', async () => ({ ok: true, data: {} }))
  },
  orders: {
    repurchasePreview: spy('orders.repurchasePreview', async () => ({ ok: true, data: { items: [{ skuId: 'sku-1', quantity: 1 }] } })),
    get: spy('orders.get', async () => ({ ok: true, data: { items: [{ skuId: 'sku-1', productNameSnapshot: '鱼丸' }] } })),
    repurchaseCommit: spy('orders.repurchaseCommit', async () => ({ ok: true, data: {} }))
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => definitions.push(definition);
global.wx = { showToast() {}, navigateTo({ url }) { navigations.push(url); }, redirectTo() {}, reLaunch() {}, navigateBack() {} };

const pageNames = ['center', 'frequent', 'inquiries', 'inquiry-create', 'inquiry-detail', 'repurchase'];
try {
  for (const pageName of pageNames) require(path.resolve(__dirname, '../miniapp/package-business/pages/' + pageName + '/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

const pageCases = [
  { name: 'center', query: {}, privateCalls: ['procurement.getAccount', 'procurement.listAllReceivables', 'procurement.listAllStatements'], cleared: { account: null, receivables: [], statements: [] } },
  { name: 'frequent', query: {}, privateCalls: ['frequent.listAll', 'catalog.listAllProducts', 'catalog.listPrices'], cleared: { rows: [], resultVisible: false, addedItems: [], invalidItems: [] } },
  { name: 'inquiries', query: {}, privateCalls: ['inquiries.listAll'], cleared: { rows: [] } },
  { name: 'inquiry-create', query: {}, privateCalls: ['catalog.listAllProducts'], cleared: { rows: [], query: '', description: '', submitError: '' } },
  { name: 'inquiry-detail', query: { id: 'inq-1' }, privateCalls: ['inquiries.get'], cleared: { detail: null, acceptResult: null, acceptError: '' } },
  { name: 'repurchase', query: { orderId: 'order-1' }, privateCalls: ['orders.repurchasePreview', 'orders.get'], cleared: { rows: [], invalidItems: [], addedItems: [], commitError: '' } }
];

function makePage(definition) {
  return Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch) { Object.assign(this.data, patch); }
  });
}
function callCount(names) { return names.reduce((total, name) => total + Number(calls[name] || 0), 0); }

async function run() {
  assert.equal(definitions.length, pageCases.length, 'all six business pages must be loaded by the runtime test');
  for (let index = 0; index < pageCases.length; index += 1) {
    const pageCase = pageCases[index];
    const page = makePage(definitions[index]);
    const authBeforeLoad = calls['auth.getMe'] || 0;
    const privateBeforeLoad = callCount(pageCase.privateCalls);
    await page.onLoad(pageCase.query);
    assert.equal(calls['auth.getMe'] || 0, authBeforeLoad, pageCase.name + ' onLoad must not duplicate the onShow identity request');
    assert.equal(callCount(pageCase.privateCalls), privateBeforeLoad, pageCase.name + ' onLoad must not call private services');

    for (const revoked of revokedUsers) {
      currentUser = approvedUser;
      const beforeApproved = callCount(pageCase.privateCalls);
      await page.onShow();
      assert.notEqual(page.data.status, 'forbidden', pageCase.name + ' must allow a complete approved B identity');
      assert(callCount(pageCase.privateCalls) > beforeApproved, pageCase.name + ' must load its private API after approval');
      if (pageCase.name === 'inquiries') {
        assert.equal(page.data.canCreateInquiry, true, 'approved inquiry page must expose create capability');
        const beforeCreate = navigations.length;
        page.create();
        assert.equal(navigations.length, beforeCreate + 1, 'approved inquiry page may navigate to creation');
      }

      currentUser = revoked.user;
      const beforeRevoked = callCount(pageCase.privateCalls);
      const authBeforeRevoked = calls['auth.getMe'] || 0;
      await page.onShow();
      assert.equal(calls['auth.getMe'], authBeforeRevoked + 1, pageCase.name + ' must re-check identity on every onShow (' + revoked.name + ')');
      assert.equal(page.data.status, 'forbidden', pageCase.name + ' must become forbidden after ' + revoked.name);
      assert.equal(callCount(pageCase.privateCalls), beforeRevoked, pageCase.name + ' must not call private services after ' + revoked.name);
      if (pageCase.name === 'inquiries') {
        assert.equal(page.data.canCreateInquiry, false, 'revoked inquiry page must clear create capability');
        const beforeCreate = navigations.length;
        page.create();
        assert.equal(navigations.length, beforeCreate, 'revoked inquiry page must not navigate to creation');
      }
      for (const [field, expected] of Object.entries(pageCase.cleared)) {
        assert.deepEqual(page.data[field], expected, pageCase.name + ' must clear ' + field + ' after ' + revoked.name);
      }
    }
  }

  const center = makePage(definitions[0]);
  await center.onLoad({});
  let releaseAccount;
  let markAccountStarted;
  const accountStarted = new Promise(resolve => { markAccountStarted = resolve; });
  services.procurement.getAccount = async () => {
    calls['procurement.raceAccount'] = (calls['procurement.raceAccount'] || 0) + 1;
    markAccountStarted();
    return new Promise(resolve => { releaseAccount = resolve; });
  };
  currentUser = approvedUser;
  const staleLoad = center.onShow();
  await accountStarted;
  currentUser = null;
  await center.onShow();
  assert.equal(center.data.status, 'forbidden', 'a newer revoked identity must win while an older private request is pending');
  assert.equal(calls['procurement.raceAccount'], 1, 'the revoked refresh must not start another private account request');
  releaseAccount({ ok: true, data: { account: { organizationName: '不得恢复的旧企业', creditLimitCent: 999999 } } });
  await staleLoad;
  assert.equal(center.data.account, null, 'a stale private response must not restore cleared business data');
  assert.equal(center.data.status, 'forbidden', 'a stale private response must not replace the forbidden state');
  console.log('business page dynamic auth refresh matrix test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
