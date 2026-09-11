const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const cartCalls = [];

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: {
    getHome: async () => ({ ok: true, data: { rows: [] } }),
    listCategories: async () => ({ ok: true, data: { rows: [] } }),
    listProducts: async () => ({ ok: true, data: { rows: [] } }),
    getProduct: async () => ({ ok: true, data: { skus: [{ _id: 'sku-1', specName: '500克', packageUnit: '1件/10包' }] } })
  },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  cart: {
    get: async () => ({ ok: true, data: { rows: [] } }),
    addItem: async (payload) => {
      cartCalls.push(payload);
      return { ok: true, data: { item: { _id: `cart-${cartCalls.length}` } } };
    },
    updateItem: async (payload) => ({ ok: true, data: { item: {} } }),
    removeItem: async () => ({ ok: true, data: {} })
  },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [], areas: [], slots: [] } }) },
  checkout: { quote: async () => ({ ok: true, data: {} }), createOrder: async () => ({ ok: true, data: {} }), preparePayment: async () => ({ ok: true, data: {} }) },
  orders: { list: async () => ({ ok: true, data: { rows: [] } }), get: async () => ({ ok: true, data: {} }), cancel: async () => ({ ok: true, data: {} }), confirm: async () => ({ ok: true, data: {} }) },
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
  page.data.loggedIn = true;
  page.data.frequent = [{ id: 'product-1', name: '测试鱼丸', unit: '规格待补充' }];
  await page.addFrequent();
  assert.equal(cartCalls.length, 1, 'cloudbase addFrequent must call the server cart once');
  assert.deepStrictEqual(cartCalls[0], { skuId: 'sku-1', quantity: 1, selected: true });
  assert.equal(page.data.cartItems.length, 1);
  assert.equal(page.data.cartItems[0].skuId, 'sku-1');
  assert.equal(page.data.cartItems[0].remoteCartItemId, 'cart-1');
  assert.equal(page.data.cartItems[0].selectedSpec, '500克');
  page.data.products = [{ id: 'product-1', name: '测试鱼丸', unit: '1件/10包', specLabel: '500克', skuOptions: [{ id: 'sku-1', label: '500克' }] }];
  page.data.cartItems[0].selected = false;
  await page.addProduct('product-1');
  assert.equal(page.data.cartItems[0].selected, true, 'adding an existing unselected SKU must select it again');
  await Promise.all([page.addProduct('product-1'), page.addProduct('product-1')]);
  assert.equal(page.data.cartItems[0].qty, 4, 'rapid adds must each increment quantity');
  assert.deepStrictEqual(cartCalls.slice(1).map(call => call.quantity), [2, 3, 4]);
  const updates = [];
  servicesStub.cart.updateItem = async payload => { updates.push(payload.quantity); return { ok: true }; };
  const event = { currentTarget: { dataset: { id: 'product-1', spec: '500克', delta: 1 } } };
  await Promise.all([page.changeQuantity(event), page.changeQuantity(event)]);
  assert.deepStrictEqual(updates, [5, 6]);
  assert.equal(page.data.cartItems[0].qty, 6);
  const originalAdd = servicesStub.cart.addItem;
  servicesStub.cart.addItem = async () => { throw new Error('network unavailable'); };
  await page.addProduct('product-1');
  assert.equal(page.data.cartItems[0].qty, 6, 'failed request must not change local quantity');
  servicesStub.cart.addItem = originalAdd;
  await page.addProduct('product-1');
  assert.equal(page.data.cartItems[0].qty, 7, 'queue must remain usable after rejection');
  await Promise.all([page.addFrequent(), page.addProduct('product-1')]);
  assert.equal(page.data.cartItems[0].qty, 9, 'frequent and individual additions must not overwrite each other');
  console.log('cloud mode cart test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
