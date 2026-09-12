const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const holder = {};
const createCalls = [];
let currentIdentity = { ok: false, error: { code: 'AUTH_REQUIRED' } };

const services = {
  config: { provider: 'cloudbase' },
  address: {},
  auth: { getMe: async () => currentIdentity },
  cart: { removeItem: async () => ({ ok: true }) },
  delivery: {},
  checkout: {
    createOrder: async payload => {
      createCalls.push(payload);
      return { ok: true, data: { order: { _id: `order-${createCalls.length}`, paymentMethod: payload.paymentMethod } } };
    }
  },
  bundles: {},
  groups: {}
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services/index' || request === '../../../services') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => { holder.value = definition; };
global.wx = { showToast: () => {}, redirectTo: () => {} };
try { require(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.js')); } finally { Module._load = originalLoad; delete global.Page; }

function makePage() {
  const page = Object.assign({}, holder.value, {
    data: JSON.parse(JSON.stringify(holder.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
  page.data.address = { id: 'address-1', regionCode: '4403' };
  page.data.warehouse = { id: 'warehouse-1' };
  page.data.cartItems = [{ id: 'cart-1', skuId: 'sku-1', qty: 1 }];
  page.data.quoteState = 'ready';
  return page;
}

async function submitAs(user) {
  currentIdentity = user ? { ok: true, data: { user } } : { ok: false, error: { code: 'AUTH_REQUIRED' } };
  const before = createCalls.length;
  await makePage().submitOrder();
  return createCalls.length === before ? null : createCalls.at(-1);
}

async function run() {
  assert.equal(await submitAs(null), null, '游客不得提交订单');
  const deniedBusinessUsers = [
    { userType: 'c', businessStatus: '', organizationId: '', status: 'active' },
    { userType: 'b', businessStatus: 'pending', organizationId: 'org-1', status: 'active' },
    { userType: 'b', businessStatus: 'rejected', organizationId: 'org-1', status: 'active' },
    { userType: 'b', businessStatus: 'approved', organizationId: '', status: 'active' },
    { userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'disabled' }
  ];
  for (const user of deniedBusinessUsers) {
    const payload = await submitAs(user);
    assert(payload, '已登录非合法 B 身份仍应按普通结算路径提交');
    assert.equal(payload.paymentMethod, 'demo', '非完整合法 B 身份不得选择线下结算');
  }
  const approved = await submitAs({ userType: 'b', businessStatus: 'approved', organizationId: 'org-1', status: 'active' });
  assert.equal(approved.paymentMethod, 'offline', '完整合法 B 身份应选择线下结算');
  console.log('checkout business identity matrix test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
