const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const okRows = (rows) => ({ ok: true, data: { rows, total: rows.length } });
const categories = [{ _id: 'cat-1', name: '海鲜水产', imageMediaId: '' }];
const products = Array.from({ length: 125 }, (_, index) => ({
  _id: `product-${index + 1}`,
  categoryId: 'cat-1',
  name: index === 124 ? '分页末尾大虾' : `冻品${index + 1}`,
  skus: [{ _id: `sku-${index + 1}`, specName: '500克', packageUnit: '500克' }]
}));
let catalogFailure = false;
let categoryFailure = false;
let detailFailure = true;

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: { login: async () => okRows([]), getMe: async () => okRows([]), applyBusiness: async () => okRows([]) },
  catalog: {
    listAllProducts: async () => catalogFailure ? { ok: false, error: { message: '目录网络错误' } } : okRows(products),
    listAllCategories: async () => categoryFailure ? { ok: false, error: { message: '分类接口失败' } } : okRows(categories),
    listProducts: async () => okRows([]), listCategories: async () => okRows([]), listPrices: async () => okRows([]),
    getProduct: async (productId) => detailFailure
      ? { ok: false, error: { message: '详情网络错误' } }
      : { ok: true, data: { product: { _id: productId, name: '分页末尾大虾', categoryName: '海鲜水产' }, skus: [{ _id: 'sku-125', specName: '500克', packageUnit: '500克' }], media: [] } }
  },
  content: { getBanners: async () => okRows([]), getHomeSections: async () => okRows([]), resolveMedia: async () => okRows([]) },
  address: { list: async () => okRows([]), save: async () => okRows([]), remove: async () => okRows([]) },
  cart: { get: async () => okRows([]), getAll: async () => okRows([]), addItem: async () => okRows([]), updateItem: async () => okRows([]), removeItem: async () => okRows([]) },
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
global.wx = { showToast: () => {}, getStorageSync: () => '', getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667, screenHeight: 667, statusBarHeight: 20 }) };
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
    },
    resolveMediaFileMap: async () => ({})
  });
}

async function run() {
  const page = makePage();
  await page.loadRemoteCatalog();
  assert.equal(page.data.catalogStatus, 'ready');
  assert.equal(page.data.products.length, 125, 'the page must retain the complete service catalog');
  categoryFailure = true;
  await page.loadRemoteCatalog();
  assert.equal(page.data.catalogStatus, 'ready', 'category failure must not hide an otherwise valid product catalog');
  assert.equal(page.data.mealIdeasStatus, 'ready', 'meal ideas only depend on the product catalog');
  assert.equal(page.data.products.length, 125);
  categoryFailure = false;
  page.syncCategory({ categoryGroup: '全部', category: '全部', query: '大虾' });
  assert.deepEqual(page.data.categoryProducts.map((item) => item.id), ['product-125'], 'search must include products from later remote pages');

  catalogFailure = true;
  page.data.query = '大虾';
  await page.loadRemoteCatalog();
  assert.equal(page.data.catalogStatus, 'error');
  assert.equal(page.data.catalogErrorTitle, '商品搜索失败');
  assert.equal(page.data.catalogErrorText, '未能完成本次搜索，请检查网络后重试', 'raw service errors must not be rendered in the customer-facing catalog');
  assert.equal(page.data.products.length, 125, 'a failed refresh must preserve the last complete catalog');
  catalogFailure = false;
  await page.retryRemoteCatalog();
  assert.equal(page.data.catalogStatus, 'ready');
  assert.equal(page.data.categoryProducts.length, 1, 'retry must preserve and reapply the current search');

  const product = page.data.products[124];
  page.data.page = 'detail';
  page.data.selectedProduct = product;
  await page.loadRemoteProductDetail(product);
  assert.equal(page.data.detailStatus, 'error');
  assert.equal(page.data.detailErrorText, '商品暂时无法加载，请稍后重试', 'raw service errors must not be rendered on product detail');
  detailFailure = false;
  await page.retryRemoteProductDetail();
  assert.equal(page.data.detailStatus, 'ready');
  assert.equal(page.data.selectedProduct.name, '分页末尾大虾');
  console.log('catalog page states test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
