const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: {
    getBanners: async () => ({ ok: true, data: { rows: [] } }),
    getHomeSections: async () => ({ ok: true, data: { rows: [{ moduleType: 'news', title: '后台活动头条', subtitle: '后台活动副标题', linkText: '查看活动' }, { moduleType: 'special', title: '后台特价专区', subtitle: '后台特价副标题', linkText: '去选购' }] } }),
    resolveMedia: async () => ({ ok: true, data: { rows: [] } })
  },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  cart: { get: async () => ({ ok: true, data: { rows: [] } }), addItem: async () => ({ ok: true, data: { item: {} } }), updateItem: async () => ({ ok: true, data: { item: {} } }), removeItem: async () => ({ ok: true, data: {} }) },
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
  await page.loadRemoteHomeSections();
  assert.equal(page.data.homeSections.length, 2);
  assert.equal(page.data.activityTitle, '后台活动头条');
  assert.equal(page.data.activityCopy, '后台活动副标题');
  assert.equal(page.data.activityMoreText, '查看活动');
  assert.equal(page.data.specialTitle, '后台特价专区');
  assert.equal(page.data.specialSubtitle, '后台特价副标题');
  assert.equal(page.data.specialMoreText, '去选购');
  console.log('cloud mode home sections test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
