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
  const product = {
    id: 'product-1', name: '测试保鲜膜', unit: '1卷', specLabel: '1卷', specs: ['1卷', '6卷/件'],
    skuOptions: [{ id: 'sku-1', label: '1卷', packageUnit: '1卷' }, { id: 'sku-6', label: '6卷/件', packageUnit: '6卷/件' }],
    img: '/assets/products/placeholder.svg'
  };
  page.data.products = [product];
  page.data.page = 'category';
  page.triggerPageMotion = (patch, callback) => { page.setData(patch, callback); };
  page.loadRemoteProductDetail = () => {};

  page.openQuantityPicker({ currentTarget: { dataset: { id: product.id } } });
  assert.equal(page.data.quantityPickerVisible, true);
  assert.equal(page.data.quantityPickerQty, 1);
  assert.equal(page.data.quantityPickerSpec, '1卷');
  page.changeQuantityPicker({ detail: { delta: 2 } });
  assert.equal(page.data.quantityPickerQty, 3);
  page.selectQuantityPickerSpec({ currentTarget: { dataset: { spec: '6卷/件' } } });
  assert.equal(page.data.quantityPickerSpec, '6卷/件');
  assert.equal(page.data.quantityPickerProduct.specLabel, '6卷/件');

  let quickAddArgs = null;
  page.addProduct = (id, spec, callback, quantity) => {
    quickAddArgs = { id, spec, quantity };
    if (callback) callback();
  };
  page.addQuantityPicker();
  assert.deepEqual(quickAddArgs, { id: product.id, spec: '6卷/件', quantity: 3 });
  assert.equal(page.data.quantityPickerVisible, false);

  page.openQuantityPicker({ currentTarget: { dataset: { id: product.id } } });
  page.changeQuantityPicker({ detail: { delta: 2 } });
  page.selectQuantityPickerSpec({ currentTarget: { dataset: { spec: '6卷/件' } } });
  page.openDetailFromQuantityPicker();
  assert.equal(page.data.page, 'detail');
  assert.equal(page.data.detailDraftQty, 3);
  assert.equal(page.data.quantityPickerVisible, false);

  page.data.cartItems = [];
  page.syncCart = (items) => { page.data.cartItems = items; };
  await page.applyAddProduct(product.id, '6卷/件', undefined, page.data.detailDraftQty);
  assert.equal(page.data.cartItems[0].selectedSpec, '6卷/件');
  assert.equal(page.data.cartItems[0].qty, 3);
  console.log('quantity-first spec flow test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
