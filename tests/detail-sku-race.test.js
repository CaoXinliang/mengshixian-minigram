const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
let releaseDetail;

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: {
    getProduct: () => new Promise((resolve) => { releaseDetail = resolve; }),
    listProducts: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listPrices: async () => ({ ok: true, data: { rows: [] } })
  },
  content: { getBanners: async () => ({ ok: true, data: { rows: [] } }), getHomeSections: async () => ({ ok: true, data: { rows: [] } }), resolveMedia: async () => ({ ok: true, data: { rows: [] } }) },
  address: { list: async () => ({ ok: true, data: { rows: [] } }), save: async () => ({ ok: true, data: {} }), remove: async () => ({ ok: true, data: {} }) },
  cart: { get: async () => ({ ok: true, data: { rows: [] } }), addItem: async () => ({ ok: true, data: { item: {} } }), updateItem: async () => ({ ok: true, data: { item: {} } }), removeItem: async () => ({ ok: true, data: {} }) },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [], areas: [], slots: [] } }) },
  checkout: { quote: async () => ({ ok: true, data: {} }), createOrder: async () => ({ ok: true, data: {} }) },
  orders: { list: async () => ({ ok: true, data: { rows: [] } }), get: async () => ({ ok: true, data: {} }), cancel: async () => ({ ok: true }), confirm: async () => ({ ok: true }) },
  refunds: { request: async () => ({ ok: true, data: {} }) },
  groups: { campaigns: async () => ({ ok: true, data: { rows: [] } }) }
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

async function run() {
  const baseProduct = {
    id: 'product-1', name: '雷洛滋保鲜膜', category: '耗材', specs: ['1卷', '6卷/件'], specLabel: '1卷', unit: '1卷',
    skuOptions: [{ id: 'sku-roll', label: '1卷', packageUnit: '1卷' }, { id: 'sku-case', label: '6卷/件', packageUnit: '6卷/件' }], img: '/assets/products/placeholder.svg'
  };
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
  page.data.page = 'detail';
  page.data.products = [baseProduct];
  page.data.selectedProduct = baseProduct;
  page.data.selectedSpec = '1卷';
  page._remotePriceBySku = { 'sku-roll': { amountCent: 1575 }, 'sku-case': { amountCent: 8978 } };

  const load = page.loadRemoteProductDetail(baseProduct);
  page.selectSpec({ currentTarget: { dataset: { spec: '6卷/件' } } });
  releaseDetail({ ok: true, data: { product: { name: '雷洛滋保鲜膜', categoryName: '耗材' }, skus: [{ _id: 'sku-roll', specName: '1卷', packageUnit: '1卷' }, { _id: 'sku-case', specName: '6卷/件', packageUnit: '6卷/件' }] } });
  await load;
  assert.equal(page.data.selectedSpec, '6卷/件', 'late product detail response must preserve the user selected SKU');
  assert.equal(page.data.selectedProduct.selectedSkuId, 'sku-case');
  assert.equal(page.data.selectedProduct.priceText, '¥89.78');

  // Ordinary product details deliberately ignore product video media. Recipe video
  // belongs to the recipe detail flow and is covered separately.
  const detailResponse = media => ({ ok: true, data: {
    product: { name: baseProduct.name, categoryName: baseProduct.category },
    skus: [{ _id: 'sku-roll', specName: '1卷', packageUnit: '1卷' }, { _id: 'sku-case', specName: '6卷/件', packageUnit: '6卷/件' }],
    media
  } });
  const videoMedia = [{ mediaType: 'video', mediaAssetId: 'test-video' }];
  let videoResolveCalls = 0;
  page.resolveMediaFileMap = async () => { videoResolveCalls += 1; return { 'test-video': 'https://example.invalid/test-video.mp4' }; };
  let pending = page.loadRemoteProductDetail(baseProduct);
  releaseDetail(detailResponse(videoMedia));
  await pending;
  assert.equal(videoResolveCalls, 0, 'ordinary product detail must not resolve or render product video media');
  console.log('detail SKU race test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
