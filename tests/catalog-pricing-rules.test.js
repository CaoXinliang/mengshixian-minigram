const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const cartAdds = [];
const cartUpdates = [];
const toasts = [];
const priceRows = [
  {
    skuId: 'sku-tiered',
    amountCent: 1000,
    minOrderQuantity: 5,
    orderMultiple: 2,
    quantityTiers: [
      { minQuantity: 6, maxQuantity: 9, amountCent: 900 },
      { minQuantity: 10, maxQuantity: null, amountCent: 800 }
    ]
  },
  { skuId: 'sku-defaults', amountCent: 1200, quantityTiers: [] },
  { skuId: 'sku-impossible', amountCent: 1500, minOrderQuantity: 700, orderMultiple: 600, quantityTiers: [] }
];
const products = [
  {
    id: 'product-tiered', name: '阶梯价鱼丸', unit: '箱', specLabel: '整箱', specs: ['整箱'],
    skuOptions: [{ id: 'sku-tiered', label: '整箱', packageUnit: '箱', minOrderQuantity: 3, orderMultiple: 1 }]
  },
  {
    id: 'product-defaults', name: 'SKU 默认规则虾滑', unit: '箱', specLabel: '整箱', specs: ['整箱'],
    skuOptions: [{ id: 'sku-defaults', label: '整箱', packageUnit: '箱', minOrderQuantity: 3, orderMultiple: 2 }]
  },
  {
    id: 'product-impossible', name: '异常规则商品', unit: '箱', specLabel: '整箱', specs: ['整箱'],
    skuOptions: [{ id: 'sku-impossible', label: '整箱', packageUnit: '箱', minOrderQuantity: 1, orderMultiple: 1 }]
  }
];
const okRows = (rows) => ({ ok: true, data: { rows } });

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => okRows([]), getMe: async () => okRows([]), applyBusiness: async () => okRows([]) },
  catalog: {
    listPrices: async () => okRows(priceRows),
    getProduct: async () => ({ ok: true, data: { product: {}, skus: [], media: [] } }),
    listProducts: async () => okRows([]), listCategories: async () => okRows([])
  },
  content: { getBanners: async () => okRows([]), getHomeSections: async () => okRows([]), resolveMedia: async () => okRows([]) },
  address: { list: async () => okRows([]), save: async () => okRows([]), remove: async () => okRows([]) },
  cart: {
    get: async () => okRows([]), getAll: async () => okRows([]),
    addItem: async (payload) => {
      cartAdds.push(payload);
      return { ok: true, data: { item: { _id: `cart-${cartAdds.length}` } } };
    },
    updateItem: async (payload) => { cartUpdates.push(payload); return { ok: true, data: { item: {} } }; },
    removeItem: async () => ({ ok: true, data: {} })
  },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [], areas: [], slots: [] } }) },
  checkout: { quote: async () => okRows([]), createOrder: async () => okRows([]), preparePayment: async () => okRows([]) },
  orders: { list: async () => okRows([]), get: async () => okRows([]), cancel: async () => okRows([]), confirm: async () => okRows([]) },
  refunds: { request: async () => okRows([]) },
  groups: { campaigns: async () => okRows([]), quote: async () => okRows([]), create: async () => okRows([]), join: async () => okRows([]), get: async () => okRows([]) }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = {
  showToast: (payload) => toasts.push(payload),
  getStorageSync: () => '',
  setStorageSync: () => {}
};
try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function makePage() {
  return Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
}

async function run() {
  const page = makePage();
  page.data.loggedIn = true;
  page.data.products = products;
  page.data.specials = products;
  page.data.frequent = products;
  await page.loadRemoteCatalogPrices(products);

  page.openQuantityPickerById('product-tiered');
  assert.equal(page.data.quantityPickerQty, 6, 'price rule must override the lower SKU minimum and round to a valid multiple');
  assert.equal(page.data.quantityPickerProduct.priceText, '¥9.00', 'the initial valid quantity must use its matching tier and keep two decimals');
  assert.equal(page.data.quantityPickerProduct.purchaseRuleText, '5 箱起购 · 按 2 箱倍数购买');
  page.changeQuantityPicker({ detail: { delta: 1 } });
  assert.equal(page.data.quantityPickerQty, 8, 'the quantity picker must step by orderMultiple');
  page.changeQuantityPicker({ detail: { delta: 1 } });
  assert.equal(page.data.quantityPickerQty, 10);
  assert.equal(page.data.quantityPickerProduct.priceText, '¥8.00', 'display price must follow the active quantity tier and keep two decimals');

  page.data.quantityPickerQty = 7;
  const addCountBeforeInvalid = cartAdds.length;
  await page.addQuantityPicker();
  assert.equal(cartAdds.length, addCountBeforeInvalid, 'invalid quantities must be rejected before the cart API call');
  assert.match(toasts.at(-1).title, /2 箱倍数/);

  page.data.quantityPickerQty = 6;
  await page.addQuantityPicker();
  assert.equal(cartAdds.at(-1).quantity, 6);
  assert.equal(page.data.cartItems[0].priceText, '¥9.00');
  assert.equal(page.data.cartItems[0].activeTierText, '当前已享 6 箱阶梯价');

  await page.applyChangeQuantity({ currentTarget: { dataset: { id: 'product-tiered', spec: '整箱', delta: 1 } } });
  assert.equal(cartUpdates.at(-1).quantity, 8);
  await page.applyChangeQuantity({ currentTarget: { dataset: { id: 'product-tiered', spec: '整箱', delta: 1 } } });
  assert.equal(page.data.cartItems[0].qty, 10);
  assert.equal(page.data.cartItems[0].priceText, '¥8.00', 'cart price must be recomputed when quantity crosses a tier and keep two decimals');

  page.openQuantityPickerById('product-defaults');
  assert.equal(page.data.quantityPickerQty, 4, 'SKU minimum and multiple must apply when the price row omits rule overrides');
  assert.equal(page.data.quantityPickerProduct.purchaseRuleText, '3 箱起购 · 按 2 箱倍数购买');

  page.openQuantityPickerById('product-impossible');
  assert.equal(page.data.quantityPickerQty, 0, 'an impossible rule must not manufacture an invalid quantity below 999');
  const addCountBeforeImpossible = cartAdds.length;
  await page.addQuantityPicker();
  assert.equal(cartAdds.length, addCountBeforeImpossible);
  assert.equal(toasts.at(-1).title, '当前规格购买规则不可用');
  console.log('catalog pricing rules test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
