const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const pendingUpdates = [];

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: {}, catalog: {}, content: {}, address: {}, delivery: {}, checkout: {}, orders: {}, refunds: {}, groups: {},
  cart: {
    updateItem: payload => new Promise(resolve => pendingUpdates.push({ payload, resolve }))
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = definition => { pageDefinition.value = definition; };
global.wx = {
  showToast: () => {},
  getStorageSync: () => '',
  getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667, screenHeight: 667, statusBarHeight: 20 })
};

try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

async function run() {
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
  page.data.loggedIn = true;
  page.data.cartItems = [
    { id: 'product-a', skuId: 'sku-a', selectedSpec: '500g', qty: 1, price: 10, priceText: '¥10', selected: true },
    { id: 'product-b', skuId: 'sku-b', selectedSpec: '1kg', qty: 1, price: 20, priceText: '¥20', selected: true }
  ];
  page.syncCart(page.data.cartItems);

  const writeA = page.toggleCartSelection({ currentTarget: { dataset: { id: 'product-a', skuId: 'sku-a', spec: '500g' } }, detail: { value: [] } });
  await new Promise(resolve => setImmediate(resolve));
  const writeB = page.toggleCartSelection({ currentTarget: { dataset: { id: 'product-b', skuId: 'sku-b', spec: '1kg' } }, detail: { value: [] } });
  assert.equal(page.data.cartItems[0].selected, false);
  assert.equal(page.data.cartItems[1].selected, false);

  pendingUpdates[0].resolve({ ok: false, error: { message: 'A 写入失败' } });
  await writeA;
  assert.equal(page.data.cartItems[0].selected, true, 'A row must roll back even when B has a newer pending selection');
  assert.equal(page.data.cartItems[1].selected, false, 'A rollback must not overwrite B row intent');
  await new Promise(resolve => setImmediate(resolve));
  pendingUpdates[1].resolve({ ok: true });
  await writeB;
  assert.equal(page.data.cartItems[1].selected, false);
  console.log('cart selection row isolation test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
