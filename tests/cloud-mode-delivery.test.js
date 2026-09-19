const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageWxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.wxml'), 'utf8');
const pageDefinition = {};
let deliveryFails = false;

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  cart: { get: async () => ({ ok: true, data: { rows: [] } }), addItem: async () => ({ ok: true, data: { item: {} } }), updateItem: async () => ({ ok: true, data: { item: {} } }), removeItem: async () => ({ ok: true, data: {} }) },
  delivery: {
    options: async () => deliveryFails ? { ok: false, error: { code: 'DELIVERY_FAILED' } } : ({
      ok: true,
      data: {
        warehouses: [{ _id: 'wh-remote-1', code: 'WH-1', name: '测试仓', sort: 1 }, { _id: 'wh-remote-2', code: 'WH-2', name: '南山仓', sort: 2 }],
        areas: [{ warehouseIds: ['wh-remote-2'], regionCodes: ['深圳市/南山区'] }],
        slots: []
      }
    })
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
  assert(pageWxml.includes('bindtap="retryWarehouses"') && pageWxml.includes('重新读取配送仓'), 'recoverable warehouse failures must expose an explicit retry action');
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
  assert.equal(typeof page.loadRemoteQuote, 'undefined', 'the main page must not retain a duplicate checkout quote implementation');
  page.triggerPageMotion = function (patch, callback) { this.setData(patch, callback); };
  await page.selectWarehouse({ currentTarget: { dataset: { id: 'wh-remote-2' } } });
  assert.equal(page.data.warehouse.id, 'wh-remote-2', 'warehouse switch must use the server id instead of a display name');
  assert.equal(page.data.warehouseAreaText, '深圳市/南山区');
  assert.equal(Object.hasOwn(page.data, 'checkoutQuoteState'), false, 'warehouse switching must not own trade-page quote state');
  deliveryFails = true;
  await page.selectWarehouse({ currentTarget: { dataset: { id: 'wh-remote-1' } } });
  assert.equal(page.data.warehouse.id, 'wh-remote-2', 'failed server revalidation must retain the current warehouse');
  console.log('cloud mode delivery test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
