const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const orderCalls = [];
let releaseOrder;

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: {
    login: async () => ({ ok: true, data: {} }),
    getMe: async () => ({ ok: true, data: { user: { userType: 'b' } } }),
    applyBusiness: async () => ({ ok: true, data: {} })
  },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  cart: { get: async () => ({ ok: true, data: { rows: [] } }), addItem: async () => ({ ok: true, data: { item: {} } }), updateItem: async () => ({ ok: true, data: { item: {} } }), removeItem: async () => ({ ok: true, data: {} }) },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [], areas: [], slots: [] } }) },
  checkout: {
    quote: async () => ({ ok: true, data: {} }),
    createOrder: async (payload) => {
      orderCalls.push(payload);
      return new Promise((resolve) => {
        releaseOrder = () => resolve({ ok: true, data: { order: { _id: `order-${orderCalls.length}`, status: 'pending_confirmation', totalAmountCent: 5800 } } });
      });
    },
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
  page.data.address = { id: 'address-1', name: '测试用户', detail: '测试路 1 号', regionCode: '440300' };
  page.data.warehouse = { id: 'wh-1', name: '测试仓', eta: '' };
  page.data.cartItems = [{ id: 'product-1', name: '测试鱼丸', skuId: 'sku-1', qty: 1, selectedSpec: '500克' }];

  const first = page.placeRemoteOrder();
  await Promise.resolve();
  const second = page.placeRemoteOrder();
  assert.equal(orderCalls.length, 1, 'double submit must not create a second createOrder request');
  releaseOrder();
  await Promise.all([first, second]);
  assert.equal(orderCalls.length, 1);
  assert.equal(page.data.cartItems.length, 0, 'successful order must clear the cart');
  console.log('cloud mode order idempotency test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
