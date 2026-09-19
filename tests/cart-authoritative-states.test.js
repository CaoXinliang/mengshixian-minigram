const assert = require('node:assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
let cartResult;
const navigations = [];
const toasts = [];
const cartUpdates = [];

const services = {
  config: { provider: 'cloudbase', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: {},
  catalog: { listPrices: async () => ({ ok: true, data: { rows: [] } }) },
  content: { resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: {}, delivery: {}, checkout: {}, orders: {}, refunds: {}, groups: {}, favorites: {}, reviews: {},
  cart: {
    getAll: async () => cartResult,
    updateItem: async payload => { cartUpdates.push(payload); return { ok: true }; },
    removeItem: async () => ({ ok: true })
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = definition => { pageDefinition.value = definition; };
global.wx = {
  showToast: ({ title }) => toasts.push(title),
  navigateTo: ({ url }) => navigations.push(url),
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
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    },
    _remoteUser: { _id: 'user-1' },
    _remotePriceBySku: {
      'sku-ok': { skuId: 'sku-ok', amountCent: 2500, availability: 'available' },
      'sku-sold': { skuId: 'sku-sold', amountCent: 1800, availability: 'sold_out', availabilityReason: 'out_of_stock' }
    }
  });
  page.data.loggedIn = true;
  return page;
}

async function run() {
  const page = createPage();
  cartResult = {
    ok: true,
    data: {
      rows: [
        { _id: 'cart-ok', skuId: 'sku-ok', quantity: 2, selected: true, sku: { specName: '500克装', packageUnit: '袋' }, product: { _id: 'product-ok', name: '有效商品' } },
        { _id: 'cart-sold', skuId: 'sku-sold', quantity: 1, selected: true, sku: { specName: '1袋', packageUnit: '袋' }, product: { _id: 'product-sold', name: '缺货商品' } },
        { _id: 'cart-gone', skuId: 'sku-gone', quantity: 1, selected: true, sku: null, product: null, unavailable: true, unavailableReason: 'sku_off_sale' }
      ]
    }
  };

  await page.loadRemoteCart();
  assert.equal(page.data.cartStatus, 'ready', 'successful cart read must expose ready state');
  assert.equal(page.data.cartItems.length, 3, 'unavailable rows must remain visible instead of disappearing');
  assert.equal(page.data.cartItems[1].cartAvailability, 'sold_out');
  assert.equal(page.data.cartItems[1].cartUnavailableText, '暂时缺货');
  assert.equal(page.data.cartItems[1].selected, false, 'an unavailable row cannot remain selected for checkout');
  assert.equal(page.data.cartItems[2].cartAvailability, 'unavailable');
  assert.equal(page.data.cartItems[2].cartUnavailableText, '商品规格已下架');
  assert.equal(page.data.selectedCartCount, 2, 'only selected actionable rows contribute to checkout quantity');
  assert.equal(page.data.selectedCartPriceReady, true);

  await page.toggleCartSelectAll({ detail: { value: [] } });
  assert.equal(page.data.allCartSelected, false);
  assert.equal(page.data.selectedCartCount, 0);
  assert.deepEqual(cartUpdates.map(item => item.skuId), ['sku-ok'], 'select-all writes only actionable rows');
  await page.toggleCartSelectAll({ detail: { value: ['all'] } });
  assert.equal(page.data.allCartSelected, true);
  assert.equal(page.data.selectedCartCount, 2);

  page.goCheckout();
  assert.deepEqual(navigations, ['/package-trade/pages/checkout/index?source=cart']);

  const failed = createPage();
  failed.syncCart([{ id: 'old', skuId: 'sku-ok', selectedSpec: '袋', qty: 2, selected: true, price: 25 }]);
  cartResult = { ok: false, error: { message: '网络暂不可用' }, data: { rows: [] } };
  await failed.loadRemoteCart();
  assert.equal(failed.data.cartStatus, 'error', 'read failure must not be presented as an empty cart');
  assert.equal(failed.data.cartErrorText, '网络暂不可用');
  assert.equal(failed.data.cartItems.length, 1, 'read failure must retain the last confirmed cart rows');

  failed.syncCart([{ id: 'invalid', skuId: 'sku-sold', selectedSpec: '袋', qty: 1, selected: true, price: 18, cartAvailability: 'sold_out' }]);
  failed.goCheckout();
  assert.equal(navigations.length, 1, 'a cart with no actionable selected row must not navigate to checkout');
  assert.equal(toasts.at(-1), '购物车暂无可结算商品');

  const repriced = createPage();
  repriced.data.cartItems = [{ id: 'product-ok', skuId: 'sku-ok', selectedSpec: '500克装', qty: 1, selected: true, price: 20, cartAvailability: 'available' }];
  repriced.applyRemotePriceLabels();
  assert.equal(repriced.data.cartItems[0].cartPriceChanged, true, 'a changed server price must require explicit reconfirmation');
  assert.equal(repriced.data.cartItems[0].selected, false);
  assert.equal(repriced.data.cartItems[0].cartChangeText, '价格已更新，请重新选择');
  await repriced.toggleCartSelection({ currentTarget: { dataset: { id: 'product-ok', skuId: 'sku-ok', spec: '500克装' } }, detail: { value: ['selected'] } });
  assert.equal(repriced.data.cartItems[0].cartPriceChanged, false, 'selecting the row again confirms the latest displayed price');
  assert.equal(repriced.data.cartItems[0].selected, true);

  repriced._remotePriceBySku['sku-ok'] = { skuId: 'sku-ok', amountCent: 2500, availability: 'available', minOrderQuantity: 2, orderMultiple: 2 };
  repriced.applyRemotePriceLabels();
  assert.equal(repriced.data.cartItems[0].cartRuleChanged, true, 'a changed purchase rule must require the quantity to be corrected');
  assert.equal(repriced.data.cartItems[0].selected, false, 'a quantity that violates the latest purchase rule cannot remain selected');
  assert.equal(repriced.data.cartItems[0].cartChangeText, '购买规则已变化，请调整数量');
  const navigationCountBeforeInvalidRule = navigations.length;
  repriced.goCheckout();
  assert.equal(navigations.length, navigationCountBeforeInvalidRule, 'a row that violates the latest purchase rule cannot enter checkout');

  let resolveOlder;
  let resolveNewer;
  const olderResult = new Promise(resolve => { resolveOlder = resolve; });
  const newerResult = new Promise(resolve => { resolveNewer = resolve; });
  const raced = createPage();
  cartResult = olderResult;
  const olderLoad = raced.loadRemoteCart();
  cartResult = newerResult;
  const newerLoad = raced.loadRemoteCart();
  resolveNewer({ ok: true, data: { rows: [{ _id: 'cart-new', skuId: 'sku-ok', quantity: 3, selected: true, sku: { specName: '新规格', packageUnit: '袋' }, product: { _id: 'product-new', name: '新购物车商品' } }] } });
  await newerLoad;
  resolveOlder({ ok: true, data: { rows: [{ _id: 'cart-old', skuId: 'sku-ok', quantity: 1, selected: true, sku: { specName: '旧规格', packageUnit: '袋' }, product: { _id: 'product-old', name: '旧购物车商品' } }] } });
  await olderLoad;
  assert.equal(raced.data.cartItems[0].remoteCartItemId, 'cart-new', 'a late older cart response must not overwrite the newest cart');

  console.log('cart authoritative states test: passed');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
