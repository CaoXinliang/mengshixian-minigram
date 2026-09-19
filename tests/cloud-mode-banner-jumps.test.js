const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: {
    getBanners: async () => ({
      ok: true,
      data: {
        rows: [
          { title: '海鲜活动', jumpType: 'category', jumpTarget: '海鲜水产', mediaAssetId: 'media-category' },
          { title: '远程商品', jumpType: 'product', jumpTarget: 'remote-1', mediaAssetId: 'media-product' }
        ]
      }
    }),
    getHomeSections: async () => ({ ok: true, data: { rows: [] } }),
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
  const wxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.wxml'), 'utf8');
  const page = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
  page.data.products = [{ id: 'remote-1', name: '远程商品', category: '海鲜水产', unit: '规格待补充', specLabel: '', img: '/assets/products/placeholder.svg' }];
  page.data.categoryGroups = [{ id: '全部', label: '全部分类', categories: ['海鲜水产'] }];

  await page.loadRemoteBanners();
  assert.equal(page.data.bannerItems.length, 2);
  assert.equal(page.data.bannerItems[0].jumpType, 'category');
  assert.equal(page.data.bannerItems[1].jumpType, 'product');
  const fallback = '/assets/products/placeholder.svg';
  assert(page.data.bannerItems.every((item) => item.image === fallback && item.imageUnavailable === true), 'an unresolved banner media asset must use the same neutral unavailable state as an image load failure');
  page.data.bannerItems[0] = { ...page.data.bannerItems[0], image: 'https://example.invalid/banner.jpg', imageUnavailable: false };
  const original = JSON.parse(JSON.stringify(page.data.bannerItems));
  assert.equal(typeof page.handleBannerImageError, 'function', 'failed banner images need a recovery action');
  page.handleBannerImageError({ currentTarget: { dataset: { index: 0, src: original[0].image } } });
  assert.deepEqual(page.data.bannerItems, [{ ...original[0], image: fallback, imageUnavailable: true }, original[1]], 'only the failed image must use a neutral placeholder, preserving copy and metadata');
  page.data.bannerItems[0].image = 'https://example.invalid/replacement.jpg';
  page.handleBannerImageError({ currentTarget: { dataset: { index: 0, src: original[0].image } } });
  assert.equal(page.data.bannerItems[0].image, 'https://example.invalid/replacement.jpg', 'late failure must not overwrite a newer banner source');
  page.data.bannerItems[0] = { ...page.data.bannerItems[0], image: fallback, imageUnavailable: true };
  const settled = page.data.bannerItems;
  page.handleBannerImageError({ currentTarget: { dataset: { index: 0, src: fallback } } });
  assert.equal(page.data.bannerItems, settled, 'a fallback failure must not trigger an endless replacement loop');
  assert(/src="\{\{item.image\}\}"[^>]*mode="\{\{item.imageUnavailable \? 'aspectFit' : 'aspectFill'\}\}"[^>]*binderror="handleBannerImageError"[^>]*data-index="\{\{index\}\}"[^>]*data-src="\{\{item.image\}\}"/.test(wxml), 'banner image errors must carry their index and original source, and a neutral placeholder must not be cropped');
  assert(
    !wxml.includes('bindtap="openBanner"') &&
      !wxml.includes('class="banner-action"') &&
      !/<view[^>]+class="banner-(?:slide|empty)"[^>]+aria-role="button"/.test(wxml),
    '后台轮播素材和跳转元数据可保留，但本轮已删除的首页特价入口不得再从轮播图暴露点击功能'
  );

  console.log('cloud mode banner presentation test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
