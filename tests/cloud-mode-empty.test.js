const assert = require('assert');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const okRows = (rows) => ({ ok: true, data: { rows } });
const okEmptyRows = () => okRows([]);

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => okRows([]), getMe: async () => okRows([]), applyBusiness: async () => okRows([]) },
  catalog: { getHome: async () => okRows([]), listCategories: async () => okRows([]), listProducts: async () => okRows([]), getProduct: async () => okRows([]) },
  content: { getBanners: async () => okRows([]), getHomeSections: async () => okRows([]), resolveMedia: async () => okRows([]) },
  address: { list: async () => okRows([]), save: async () => okRows([]), remove: async () => okRows([]) },
  cart: { get: async () => okRows([]), addItem: async () => okRows([]), updateItem: async () => okRows([]), removeItem: async () => okRows([]) },
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

global.Page = (definition) => {
  pageDefinition.value = definition;
};

try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

const initial = pageDefinition.value && pageDefinition.value.data;
assert(initial, 'cloudbase mode should register a page definition');
assert.strictEqual(initial.products.length, 0, 'cloudbase mode must not seed demo products');
assert.strictEqual(initial.bannerItems.length, 0, 'cloudbase mode must not seed demo banners');
assert.strictEqual(initial.specials.length, 0, 'cloudbase mode must not seed demo special products');
assert.strictEqual(initial.frequent.length, 0, 'cloudbase mode must not seed demo frequent products');
assert.strictEqual(initial.groupDeals.length, 0, 'cloudbase mode must not seed demo group deals');
assert.strictEqual(initial.warehouses.length, 0, 'cloudbase mode must not seed demo warehouses');
assert.strictEqual(initial.cartItems.length, 0, 'cloudbase mode must not seed demo cart items');
assert.strictEqual(initial.cartCount, 0, 'cloudbase mode cart count must start at zero');
assert.strictEqual(initial.homeCategories.length, 0, 'cloudbase mode must not seed demo home categories');
assert.deepStrictEqual(initial.subCategories, ['全部'], 'cloudbase mode without data must only offer the all filter');
assert.strictEqual(initial.couponCount, 0, 'cloudbase mode must not seed demo coupon count');
assert.strictEqual(initial.points, 0, 'cloudbase mode must not seed demo points');

async function runEmptyLoaders() {
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(initial)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
  await page.loadRemoteCatalog();
  assert.strictEqual(page.data.products.length, 0, 'empty catalog response must keep product list empty');
  await page.loadRemoteBanners();
  assert.strictEqual(page.data.bannerItems.length, 0, 'empty banner response must keep banner list empty');
  await page.loadRemoteDeliveryOptions();
  assert.strictEqual(page.data.warehouses.length, 0, 'empty delivery options response must keep warehouse list empty');
  await page.loadRemoteAddress();
  assert.strictEqual(page.data.address.detail, '', 'empty address response must not retain address data');
  await page.loadRemoteOrders();
  assert.strictEqual(page.data.orderRows.length, 0, 'empty orders response must not retain order rows');

  const categories = Array.from({ length: 12 }, (_, i) => ({ _id: `cat-${i}`, name: `后台分类${i}`, imageMediaId: `image-${i}` }));
  servicesStub.catalog.listCategories = async () => okRows(categories);
  servicesStub.catalog.listProducts = async () => okRows([{ _id: 'p1', categoryId: 'cat-0', categoryName: '旧分类名称', name: '商品', skus: [] }]);
  page.resolveMediaFileMap = async ids => Object.fromEntries(ids.map(id => [id, `https://example.test/${id}.jpg`]));
  await page.loadRemoteCatalog();
  assert.strictEqual(page.data.homeCategories.length, 10, 'home must cap real backend categories at the fixed ten-entry layout');
  assert.strictEqual(page.data.categoryGroups.length, 13, 'all twelve backend categories plus all must remain accessible');
  assert.strictEqual(page.data.products[0].category, '后台分类0', 'category ID must resolve the current name after rename');
  assert.strictEqual(page.data.homeCategories[0].image, 'https://example.test/image-0.jpg');
  page.openCategoryByLabel('后台分类11');
  assert.strictEqual(page.data.categoryProducts.length, 0, 'enabled category without products must remain selectable');
  servicesStub.catalog.listProducts = async () => okRows(Array.from({ length: 55 }, (_, index) => ({ _id: `p-${index}`, categoryId: 'cat-0', categoryName: '后台分类0', name: `商品${index}`, skus: [] })));
  await page.loadRemoteCatalog();
  assert.strictEqual(page.data.products.length, 55, 'cloud catalog must retain every product returned by the complete catalog service');
  servicesStub.catalog.listProducts = async () => okRows([{ _id: 'p1', categoryId: 'cat-0', categoryName: '旧分类名称', name: '商品', skus: [] }]);
  servicesStub.catalog.listCategories = async () => ({ ok: false });
  await page.loadRemoteCatalog();
  assert.strictEqual(page.data.products.length, 55, 'failed category response must not partly replace the last successful complete catalog');
  servicesStub.catalog.listCategories = okEmptyRows;
  servicesStub.catalog.listProducts = okEmptyRows;
  await page.loadRemoteCatalog();
  assert.strictEqual(page.data.homeCategories.length, 0);
  assert.deepStrictEqual(page.data.subCategories, ['全部']);
  assert.strictEqual(page.data.products.length, 0);
  let release;
  let calls = 0;
  page.loadRemoteCatalog = () => { calls += 1; return new Promise(resolve => { release = resolve; }); };
  page.loadRemoteBanners = async () => {};
  page.loadRemoteHomeSections = async () => {};
  page.loadRemoteDeliveryOptions = async () => {};
  const firstRefresh = page.refreshRemoteContent();
  assert.strictEqual(page.refreshRemoteContent(), firstRefresh, 'concurrent refreshes must share one request');
  await Promise.resolve();
  assert.strictEqual(calls, 1);
  release();
  await firstRefresh;
  await page.onShow();
  assert.strictEqual(calls, 1, 'quick foreground return must not duplicate loading');
  page._contentRefreshedAt = Date.now() - 31000;
  const nextRefresh = page.onShow();
  await Promise.resolve();
  assert.strictEqual(calls, 2, 'foreground return after throttle interval must reload content');
  release();
  await nextRefresh;

  let cartRefreshes = 0;
  page.data.loggedIn = true;
  page.loadRemoteCart = async () => { cartRefreshes += 1; };
  page._contentRefreshedAt = Date.now();
  await page.onShow();
  assert.strictEqual(cartRefreshes, 1, 'logged-in foreground return must refresh the remote cart even when content is throttled');

  page.data.page = 'detail';
  page.data.selectedProduct = { id: 'new-product' };
  servicesStub.catalog.getProduct = async () => ({ ok: true, data: { product: { name: '旧请求' }, skus: [{ _id: 'old-sku' }] } });
  await page.loadRemoteProductDetail({ id: 'old-product' });
  assert.strictEqual(page.data.selectedProduct.id, 'new-product', 'late detail response must not overwrite the new selection');
}

runEmptyLoaders().then(() => {
  console.log('cloud mode empty-state test: passed');
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
