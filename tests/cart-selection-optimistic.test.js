const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
let releaseUpdate;
let updateResult = { ok: true };

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: {}, catalog: {}, content: {}, address: {}, delivery: {}, checkout: {}, orders: {}, refunds: {}, groups: {},
  cart: {
    updateItem: async () => {
      await new Promise((resolve) => { releaseUpdate = resolve; });
      return updateResult;
    }
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
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
  page.data.cartItems = [{ id: 'product-1', skuId: 'sku-1', selectedSpec: '6袋/件', qty: 1, price: 50, priceText: '¥50', selected: true }];
  page.syncCart(page.data.cartItems);
  const pending = page.toggleCartSelection({ currentTarget: { dataset: { id: 'product-1', skuId: 'sku-1', spec: '6袋/件' } }, detail: { value: [] } });
  assert.equal(page.data.cartItems[0].selected, false, 'unchecking must update local selection immediately');
  assert.equal(page.data.selectedCartCount, 0, 'unchecking must immediately clear selected quantity');
  assert.equal(page.data.selectedCartTotal, '0', 'unchecking must immediately clear selected total');
  await new Promise((resolve) => setTimeout(resolve, 0));
  updateResult = { ok: false, error: { message: '网络失败' } };
  releaseUpdate();
  await pending;
  assert.equal(page.data.cartItems[0].selected, true, 'failed remote selection update must roll back the local state');
  assert.equal(page.data.selectedCartCount, 1, 'rollback must restore selected quantity');
  console.log('cart selection optimistic test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
