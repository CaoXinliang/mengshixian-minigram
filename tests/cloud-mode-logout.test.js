const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
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

const page = Object.assign({}, pageDefinition.value, {
  data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
  setData(patch) {
    Object.assign(this.data, patch);
  }
});
page.data.loggedIn = true;
page.data.cartItems = [{ id: 'product-1', skuId: 'sku-1', qty: 1 }];
page.data.cartCount = 1;
page.data.orderRows = [{ id: 'order-1' }];
page.data.lastOrder = { id: 'order-1' };
page.data.address = { id: 'address-1', name: '测试用户', detail: '测试路 1 号' };
page.data.couponCount = 2;
page.data.points = 268;
page.data.checkedIn = true;
page.data.userType = 'b';
page.data.profileTitle = '梦食鲜商家';

page.logout();
assert.equal(page.data.loggedIn, false);
assert.equal(page.data.cartItems.length, 0);
assert.equal(page.data.cartCount, 0);
assert.equal(page.data.orderRows.length, 0);
assert.equal(page.data.lastOrder, null);
assert.equal(page.data.address.detail, '');
assert.equal(page.data.couponCount, 0);
assert.equal(page.data.points, 0);
assert.equal(page.data.checkedIn, false);
assert.equal(page.data.userType, '');
assert.equal(page.data.profileTitle, '梦食鲜顾客');
console.log('cloud mode logout test: passed');
