const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const quoteCalls = [];

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  cart: { get: async () => ({ ok: true, data: { rows: [] } }), addItem: async () => ({ ok: true, data: { item: {} } }), updateItem: async () => ({ ok: true, data: { item: {} } }), removeItem: async () => ({ ok: true, data: {} }) },
  delivery: {
    options: async () => ({
      ok: true,
      data: {
        warehouses: [{ _id: 'wh-remote-1', code: 'WH-1', name: '测试仓', sort: 1 }],
        areas: [],
        slots: []
      }
    })
  },
  checkout: {
    quote: async (payload) => {
      quoteCalls.push(payload);
      return { ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, totalAmountCent: 5800 } } };
    },
    createOrder: async () => ({ ok: true, data: {} }),
    preparePayment: async () => ({ ok: true, data: {} })
  },
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
  await page.loadRemoteDeliveryOptions();
  assert.equal(page.data.warehouse.id, 'wh-remote-1', 'remote delivery options must expose the server warehouse id');
  assert.equal(page.data.warehouses[0].id, 'wh-remote-1');
  page.data.address = { id: 'address-remote-1', detail: '测试路 1 号', regionCode: '440300' };
  page.data.cartItems = [{ id: 'product-1', skuId: 'sku-1', qty: 1 }];
  await page.loadRemoteQuote();
  assert.equal(quoteCalls.length, 1);
  assert.equal(page.data.cartTotal, '50.00');
  assert.equal(page.data.freightTotal, '8.00');
  assert.equal(page.data.orderTotal, '58.00', 'checkout total must use the backend payableAmountCent field and keep two decimals');
  assert.deepStrictEqual(quoteCalls[0], {
    addressId: 'address-remote-1',
    warehouseId: 'wh-remote-1',
    items: [{ skuId: 'sku-1', quantity: 1 }]
  });
  console.log('cloud mode delivery test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
