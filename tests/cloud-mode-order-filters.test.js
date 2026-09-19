const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const rows = [
  { _id: 'order-pending', orderNo: 'P1', status: 'pending_payment', refundStatus: '', totalAmountCent: 1000 },
  { _id: 'order-demo-confirmation', orderNo: 'T1', status: 'pending_confirmation', paymentStatus: 'demo_not_required', refundStatus: '', totalAmountCent: 1500 },
  { _id: 'order-paid-confirmation', orderNo: 'T2', status: 'pending_confirmation', paymentStatus: 'paid', refundStatus: '', totalAmountCent: 1800 },
  { _id: 'order-picking', orderNo: 'P2', status: 'picking', paymentStatus: 'paid', refundStatus: '', totalAmountCent: 2000 },
  { _id: 'order-delivered', orderNo: 'D1', status: 'delivered', paymentStatus: 'paid', refundStatus: '', totalAmountCent: 3000 },
  { _id: 'order-completed', orderNo: 'C1', status: 'completed', paymentStatus: 'paid', refundStatus: '', totalAmountCent: 4000 },
  { _id: 'order-refunded', orderNo: 'R1', status: 'delivered', paymentStatus: 'paid', refundStatus: 'requested', totalAmountCent: 5000 },
  { _id: 'order-unknown', orderNo: 'U1', status: 'future_internal_status', paymentStatus: '', refundStatus: '', totalAmountCent: 6000 }
];

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  cart: { get: async () => ({ ok: true, data: { rows: [] } }), addItem: async () => ({ ok: true, data: { item: {} } }), updateItem: async () => ({ ok: true, data: { item: {} } }), removeItem: async () => ({ ok: true, data: {} }) },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [], areas: [], slots: [] } }) },
  checkout: { quote: async () => ({ ok: true, data: {} }), createOrder: async () => ({ ok: true, data: {} }), preparePayment: async () => ({ ok: true, data: {} }) },
  orders: { list: async () => ({ ok: true, data: { rows } }), get: async () => ({ ok: true, data: {} }), cancel: async () => ({ ok: true, data: {} }), confirm: async () => ({ ok: true, data: {} }) },
  refunds: { request: async () => ({ ok: true, data: {} }) },
  groups: { campaigns: async () => ({ ok: true, data: { rows: [] } }), quote: async () => ({ ok: true, data: {} }), create: async () => ({ ok: true, data: {} }), join: async () => ({ ok: true, data: {} }), get: async () => ({ ok: true, data: {} }) }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => {
  pageDefinition.value = definition;
};
global.wx = { showToast: () => {} };

try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

async function run() {
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
  page.data.orderFilter = '待付款';
  await page.loadRemoteOrders();
  assert.deepStrictEqual(page.data.orderRows.map((item) => item.id), ['order-pending']);
  assert.strictEqual(page.data.orderEmptyTitle, '暂无待付款订单');

  page.data.orderFilter = '待收货';
  await page.loadRemoteOrders();
  assert.deepStrictEqual(page.data.orderRows.map((item) => item.id), ['order-picking', 'order-delivered']);
  assert.strictEqual(page.data.orderEmptyTitle, '暂无待收货订单');

  page.data.orderFilter = '售后/退款';
  await page.loadRemoteOrders();
  assert.deepStrictEqual(page.data.orderRows.map((item) => item.id), ['order-refunded']);
  assert.strictEqual(page.data.orderEmptyTitle, '暂无售后申请');

  page.data.orderFilter = '全部订单';
  await page.loadRemoteOrders();
  assert.strictEqual(page.data.orderRows.length, 8);
  assert.strictEqual(page.data.orderEmptyTitle, '暂无订单记录');
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-pending').status, '待付款');
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-refunded').status, '售后申请中');
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-unknown').status, '处理中');
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-delivered').canConfirm, true);
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-refunded').canConfirm, false);
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-delivered').canRefund, true);
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-demo-confirmation').canCancel, true);
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-demo-confirmation').canRefund, false);
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-paid-confirmation').canCancel, false);
  assert.equal(page.data.orderRows.find((row) => row.id === 'order-paid-confirmation').canRefund, true);
  console.log('cloud mode order filters test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
