const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const clipboard = [];

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: {
    getBanners: async () => ({ ok: true, data: { rows: [] } }),
    getHomeSections: async () => ({
      ok: true,
      data: {
        rows: [
          { moduleType: 'news', title: '海鲜活动', jumpType: 'category', jumpTarget: '海鲜水产' },
          { moduleType: 'special', title: '远程特价', jumpType: 'product', jumpTarget: 'remote-1' }
        ]
      }
    }),
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
global.wx = {
  showToast: () => {},
  setClipboardData: (options) => { clipboard.push(options.data); if (options.success) options.success(); }
};

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
  page.data.products = [{ id: 'remote-1', name: '远程商品', category: '海鲜水产', unit: '规格待补充', specLabel: '', img: '/assets/products/placeholder.svg' }];
  page.data.categoryGroups = [{ id: '全部', label: '全部分类', categories: ['海鲜水产'] }];

  await page.loadRemoteHomeSections();
  assert.equal(page.data.homeSections.length, 2);

  page.openHomeSection({ currentTarget: { dataset: { sectionType: 'news' } } });
  assert.equal(page.data.page, 'category', '首页活动头条可按后台分类跳转');
  assert.equal(page.data.category, '海鲜水产');

  page.setData({ page: 'home', category: '全部' });
  page.openHomeSection({ currentTarget: { dataset: { sectionType: 'special' } } });
  assert.equal(page.data.page, 'detail', '首页特价专区可按后台商品跳转');
  assert.equal(page.data.selectedProduct.id, 'remote-1');

  console.log('cloud mode home section jumps test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
