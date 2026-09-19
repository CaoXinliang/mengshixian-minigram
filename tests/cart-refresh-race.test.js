const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
let cartReadCount = 0;

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }), listPrices: async () => ({ ok: true, data: { rows: [] } }) },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [], areas: [], slots: [] } }) },
  checkout: { quote: async () => ({ ok: true, data: {} }), createOrder: async () => ({ ok: true, data: {} }) },
  orders: { list: async () => ({ ok: true, data: { rows: [] } }), get: async () => ({ ok: true, data: {} }), cancel: async () => ({ ok: true }), confirm: async () => ({ ok: true }) },
  refunds: { request: async () => ({ ok: true, data: {} }) },
  cart: {
    get: async () => {
      cartReadCount += 1;
      return { ok: true, data: { rows: [{ _id: 'remote-item', skuId: 'sku-1', quantity: 2, selected: true, sku: { specName: '6卷/件', packageUnit: '6卷/件' }, product: { _id: 'product-1', name: '雷洛滋保鲜膜', categoryName: '耗材', image: '' } }] } };
    },
    getAll: async function () { const result = await this.get({ page: 1, pageSize: 100 }); return { ok: result.ok, data: { rows: result.data.rows } }; },
    addItem: async () => ({ ok: true, data: { item: { _id: 'remote-item' } } }),
    updateItem: async () => ({ ok: true, data: { item: {} } }),
    removeItem: async () => ({ ok: true, data: {} })
  },
  groups: { campaigns: async () => ({ ok: true, data: { rows: [] } }) }
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

async function run() {
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });

  let releaseWrite;
  const writeGate = new Promise((resolve) => { releaseWrite = resolve; });
  page.enqueueCartWrite(() => writeGate);
  const refresh = page.loadRemoteCart();
  await Promise.resolve();
  assert.equal(cartReadCount, 0, 'cart refresh must wait for a pending cart write');
  releaseWrite();
  await refresh;
  assert.equal(cartReadCount, 1);
  assert.equal(page.data.cartItems[0].qty, 2);
  console.log('cart refresh race test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
