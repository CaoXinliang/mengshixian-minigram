const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const clipboard = [];
const toasts = [];
const initialHomeSectionRows = [
  { moduleType: 'news', title: '海鲜活动', jumpType: 'category', jumpTarget: '海鲜水产' },
  { _id: 'special-section', moduleType: 'special', title: '远程特价', subtitle: '以结算页展示为准', startAt: '2026-09-18T00:00:00+08:00', endAt: '2026-09-25T23:59:59+08:00', productIds: ['remote-1'], jumpType: 'none', jumpTarget: '' },
  { _id: 'group-section', moduleType: 'group', title: '活动入口', jumpType: 'activity', jumpTarget: 'special-section' }
];
let homeSectionRows = initialHomeSectionRows;

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: {} }), getMe: async () => ({ ok: true, data: {} }), applyBusiness: async () => ({ ok: true, data: {} }) },
  catalog: { getHome: async () => ({ ok: true, data: { rows: [] } }), listCategories: async () => ({ ok: true, data: { rows: [] } }), listProducts: async () => ({ ok: true, data: { rows: [] } }), getProduct: async () => ({ ok: true, data: { skus: [] } }) },
  content: {
    getBanners: async () => ({ ok: true, data: { rows: [] } }),
    getHomeSections: async () => ({
      ok: true,
      data: { rows: homeSectionRows }
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
  showToast: (options) => { toasts.push(options.title); },
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
  page.data.categoryGroups = [{ id: 'seafood', label: '海鲜分类', categories: ['海鲜水产'] }];

  await page.loadRemoteHomeSections();
  assert.equal(page.data.homeSections.length, 3);

  await page.openHomeSection({ currentTarget: { dataset: { sectionType: 'news' } } });
  assert.equal(page.data.page, 'category', '首页活动头条可按后台分类跳转');
  assert.equal(page.data.category, '海鲜水产');

  page.setData({ page: 'home', category: '全部' });
  await page.openHomeSection({ currentTarget: { dataset: { sectionType: 'special' } } });
  assert.equal(page.data.page, 'campaign', '没有直接跳转目标的后台特价模块必须进入 UI-008 活动页');
  assert.equal(page.data.homeCampaign.title, '远程特价');
  assert.equal(page.data.homeCampaign.periodText, '活动有效期 09.18—09.25');
  assert.deepEqual(page.data.homeCampaign.rules, ['以结算页展示为准']);
  assert.equal(page.data.campaignProducts[0].name, '远程商品');
  page.data.products = [{ ...page.data.products[0], name: '远程商品已刷新' }];
  page.syncHomeCampaignProducts();
  assert.equal(page.data.campaignProducts[0].name, '远程商品已刷新', '活动商品必须跟随主商品状态刷新，不能保留进入页面时的快照');

  page.setData({ page: 'home' });
  await page.openHomeSection({ currentTarget: { dataset: { sectionType: 'group' } } });
  assert.equal(page.data.page, 'campaign', 'activity 目标必须解析到仍然有效的后台活动模块');
  assert.equal(page.data.homeCampaign.id, 'special-section');

  page.setData({ page: 'home' });
  homeSectionRows = initialHomeSectionRows.filter((item) => item._id !== 'special-section');
  await page.openHomeSection({ currentTarget: { dataset: { sectionType: 'special' } } });
  assert.equal(page.data.page, 'home', '首页模块必须重新向服务端确认当前仍可见，不能打开已失效的缓存活动');
  assert(toasts.includes('该活动暂时不可查看'));
  homeSectionRows = initialHomeSectionRows;

  const originalGetHomeSections = servicesStub.content.getHomeSections;
  let releaseHomeSections;
  servicesStub.content.getHomeSections = () => new Promise((resolve) => { releaseHomeSections = resolve; });
  page.setData({ page: 'home' });
  const staleOpen = page.openHomeSection({ currentTarget: { dataset: { sectionType: 'special' } } });
  page.triggerPageMotion({ page: 'category', activeTab: 'category' });
  releaseHomeSections({ ok: true, data: { rows: homeSectionRows } });
  await staleOpen;
  assert.equal(page.data.page, 'category', '首页模块刷新迟到后不能抢回用户已切换的页面');
  servicesStub.content.getHomeSections = originalGetHomeSections;

  const originalGetProduct = servicesStub.catalog.getProduct;
  servicesStub.catalog.getProduct = async () => ({ ok: false, error: { code: 'NETWORK_ERROR' } });
  page.openHomeCampaign({ _id: 'failed', title: '加载失败活动', productIds: ['missing-product'], jumpType: 'none' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(page.data.campaignProductsLoading, false);
  assert.equal(page.data.campaignProductsError, true, '关联商品请求失败必须与真实空活动区分');
  servicesStub.catalog.getProduct = originalGetProduct;

  page.setData({ page: 'home', category: '全部' });
  assert.equal(page.consumeContentJump({ jumpType: 'category', jumpTarget: '不存在分类' }), true);
  assert.equal(page.data.page, 'home', '失效分类目标必须留在当前可用页面');
  assert(toasts.includes('该分类暂时不可查看'));

  assert.equal(page.consumeContentJump({ jumpType: 'category', jumpTarget: 'seafood' }), true);
  assert.equal(page.data.categoryGroup, 'seafood', '分类组 ID 必须定位到对应一级分类');
  assert.equal(page.data.category, '全部', '进入一级分类组时必须显示组内全部商品，而不是把组 ID 当二级分类名');

  assert.equal(page.consumeContentJump({ jumpType: 'url', jumpTarget: 'javascript:alert(1)' }), true);
  assert(toasts.includes('该链接暂时无法打开'));
  assert.equal(clipboard.length, 0);

  assert.equal(page.consumeContentJump({ jumpType: 'url', jumpTarget: 'https://example.com/activity' }), true);
  assert.deepEqual(clipboard, ['https://example.com/activity']);

  page.setData({ page: 'campaign', activeTab: 'home' });
  page.openProductById('remote-1');
  page.backFromDetail();
  assert.equal(page.data.page, 'campaign', '活动商品详情返回时必须回到原活动页');
  assert.equal(page.data.activeTab, 'home', '活动页返回路径仍属于首页底栏');

  console.log('cloud mode home section jumps test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
