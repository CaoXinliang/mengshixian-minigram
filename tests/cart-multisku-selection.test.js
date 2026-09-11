const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const servicesStub = {
  config: { provider: 'mock', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: {}, catalog: {}, content: {}, address: {}, delivery: {}, checkout: {}, orders: {}, refunds: {}, cart: {}, groups: {}
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = { showToast: () => {}, getStorageSync: () => '', getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667, screenHeight: 667, statusBarHeight: 20 }) };

try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function createPage() {
  return Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
}

async function run() {
  const page = createPage();
  const cartItems = [
    { id: 'product-1', name: '测试商品', selectedSpec: '1袋/件', qty: 1, price: 10, selected: true },
    { id: 'product-1', name: '测试商品', selectedSpec: '6袋/件', qty: 2, price: 50, selected: true }
  ];
  page.syncCart(cartItems);
  assert.notEqual(page.data.cartItems[0].cartKey, page.data.cartItems[1].cartKey);
  const event = { currentTarget: { dataset: { id: 'product-1', spec: '6袋/件' } }, detail: { value: [] } };
  page.toggleCartSelection(event);
  assert.equal(page.data.cartItems[0].selected, true);
  assert.equal(page.data.cartItems[1].selected, false);
  assert.equal(page.data.selectedCartCount, 1);
  console.log('cart multi-sku selection test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
