const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const idempotencyKeys = [];
let createCount = 0;

const servicesStub = {
  config: { provider: 'cloudbase' },
  address: {},
  auth: { getMe: async () => ({ ok: true, data: { user: { userType: 'c', businessStatus: '' } } }) },
  cart: { removeItem: async () => ({ ok: true }) },
  delivery: {},
  checkout: {
    quote: async () => ({ ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, totalAmountCent: 5800 } } }),
    createOrder: async (payload) => {
      createCount += 1;
      idempotencyKeys.push(payload.idempotencyKey);
      if (createCount === 1) return { ok: false, error: { message: '网络暂时不可用' } };
      return { ok: true, data: { order: { _id: 'order-1', orderNo: 'MSX-1', paymentMethod: 'demo', totalAmountCent: 5800, items: [] } } };
    }
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = { showToast: () => {}, redirectTo: () => {} };

try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.js'));
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
  page.data.address = { id: 'address-1', name: '收货人', detail: '测试地址' };
  page.data.warehouse = { id: 'warehouse-1', name: '南山仓', eta: '预计送达' };
  page.data.cartItems = [{ id: 'cart-1', skuId: 'sku-1', name: '测试冻品', unit: '500g装', qty: 1 }];
  page.data.quoteState = 'ready';

  await page.submitOrder();
  assert.equal(createCount, 1, 'first order request must be sent once');
  assert.ok(idempotencyKeys[0], 'first request must carry an idempotency key');
  await page.submitOrder();
  assert.equal(createCount, 2, 'retry after a failed response must send one new request');
  assert.equal(idempotencyKeys[1], idempotencyKeys[0], 'checkout retry must reuse the original idempotency key');
  assert.equal(page._orderIdempotencyKey, '', 'idempotency key must clear after the order is created');
  console.log('checkout idempotency retry test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
