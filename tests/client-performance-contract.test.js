const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const pagePath = path.resolve(__dirname, '../miniapp/pages/index/index.js');
const appConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../miniapp/app.json'), 'utf8'));
const originalLoad = Module._load;
const holder = {};
const catalogCalls = [];
let loadingShown = 0;
let loadingHidden = 0;
const products = Array.from({ length: 80 }, (_, index) => ({
  _id: `product-${index + 1}`,
  categoryId: 'category-1',
  categoryName: '海鲜水产',
  name: `商品${index + 1}`,
  coverMediaId: `media-${index + 1}`,
  skus: [{ _id: `sku-${index + 1}`, specName: '500克', packageUnit: '500克' }]
}));
const okRows = (rows, extra = {}) => ({ ok: true, data: { rows, ...extra } });
const services = {
  config: { provider: 'cloudbase', customerMealIdeasEnabled: true, motionEnabled: true },
  auth: { login: async () => okRows([]), getMe: async () => okRows([]), applyBusiness: async () => okRows([]) },
  catalog: {
    supportsPagedCatalog: true,
    listProducts: async (payload) => {
      catalogCalls.push(payload);
      const start = (payload.page - 1) * payload.pageSize;
      return okRows(products.slice(start, start + payload.pageSize), { total: products.length, page: payload.page, pageSize: payload.pageSize });
    },
    listCategories: async () => okRows([{ _id: 'category-1', name: '海鲜水产', imageMediaId: 'category-media' }], { total: 1, page: 1, pageSize: 100 }),
    listPrices: async () => okRows([]),
    getProduct: async () => okRows([])
  },
  content: { getBanners: async () => okRows([]), getHomeSections: async () => okRows([]), getMealIdeas: async () => okRows([]), resolveMedia: async () => okRows([]) },
  address: { list: async () => okRows([]), save: async () => okRows([]), remove: async () => okRows([]) },
  cart: { getAll: async () => okRows([]), addItem: async () => okRows([]), updateItem: async () => okRows([]), removeItem: async () => okRows([]) },
  delivery: { options: async () => ({ ok: true, data: { warehouses: [], areas: [], slots: [] } }) },
  checkout: { quote: async () => okRows([]), createOrder: async () => okRows([]), preparePayment: async () => okRows([]) },
  orders: { list: async () => okRows([]), get: async () => okRows([]), cancel: async () => okRows([]), confirm: async () => okRows([]) },
  refunds: { request: async () => okRows([]) },
  groups: { campaigns: async () => okRows([]), quote: async () => okRows([]), create: async () => okRows([]), join: async () => okRows([]), get: async () => okRows([]) },
  favorites: { upsert: async () => okRows([]) },
  reviews: { list: async () => okRows([]) }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = (definition) => { holder.definition = definition; };
global.wx = {
  getStorageSync: () => '1',
  getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667, screenHeight: 667, statusBarHeight: 20 }),
  showToast: () => {},
  showLoading: () => { loadingShown += 1; },
  hideLoading: () => { loadingHidden += 1; },
  navigateTo: () => {}
};
try {
  delete require.cache[pagePath];
  require(pagePath);
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function makePage() {
  return Object.assign({}, holder.definition, {
    data: JSON.parse(JSON.stringify(holder.definition.data)),
    setDataCalls: [],
    setData(patch, callback) {
      this.setDataCalls.push(patch);
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
}

async function run() {
  assert.deepEqual(appConfig.preloadRule['pages/index/index'].packages, ['trade', 'member'], '首页必须预加载高频交易与会员分包');
  assert.equal(appConfig.preloadRule['pages/index/index'].network, 'all');

  const page = makePage();
  const mediaResolvers = [];
  page.resolveMediaFileMap = () => new Promise((resolve) => mediaResolvers.push(resolve));
  let catalogSettled = false;
  const loading = page.loadRemoteCatalog().then(() => { catalogSettled = true; });
  while (mediaResolvers.length < 2) await Promise.resolve();

  assert.equal(catalogSettled, false, '媒体仍在解析时目录加载任务尚未结束');
  assert.equal(page.data.catalogStatus, 'ready', '商品元数据到达后必须立即结束空白加载态');
  assert.equal(page.data.products.length, 40, '首屏只提交首批商品，不得一次渲染全部目录');
  assert(page.data.products.every((item) => item.img === '/assets/products/placeholder.svg'), '媒体落位前应使用稳定占位图');
  assert.deepEqual(catalogCalls[0], { page: 1, pageSize: 40 });
  assert.equal(catalogCalls.length, 1, '停留首页时不得自动追读后续商品页');

  mediaResolvers[0](Object.fromEntries(products.slice(0, 40).map((item) => [item.coverMediaId, `https://example.test/${item.coverMediaId}.jpg`])));
  mediaResolvers[1]({ 'category-media': 'https://example.test/category.jpg' });
  await loading;
  assert.equal(page.data.products[0].img, 'https://example.test/media-1.jpg', '媒体应在元数据首显后渐进落位');

  const nextLoading = page.loadNextRemoteCatalogPage();
  while (mediaResolvers.length < 3) await Promise.resolve();
  mediaResolvers[2](Object.fromEntries(products.slice(40).map((item) => [item.coverMediaId, `https://example.test/${item.coverMediaId}.jpg`])));
  await nextLoading;
  assert.equal(page.data.products.length, 80, '进入浏览场景后下一页必须可增量合并');
  assert.deepEqual(catalogCalls[1], { page: 2, pageSize: 40 });

  // 分类接口较慢时，商品文字仍必须先显示，不等分类和图片。
  const originalListCategories = services.catalog.listCategories;
  let releaseCategories;
  services.catalog.listCategories = () => new Promise((resolve) => { releaseCategories = resolve; });
  const textFirstPage = makePage();
  textFirstPage.resolveMediaFileMap = async () => ({});
  let textFirstSettled = false;
  const textFirstLoading = textFirstPage.loadRemoteCatalog().then(() => { textFirstSettled = true; });
  for (let index = 0; index < 10 && textFirstPage.data.catalogStatus !== 'ready'; index += 1) await Promise.resolve();
  assert.equal(textFirstPage.data.catalogStatus, 'ready', '分类未返回时商品元数据应已首显');
  assert.equal(textFirstPage.data.products.length, 40);
  assert.equal(textFirstSettled, false, '背景分类任务仍可继续完成');
  releaseCategories(okRows([{ _id: 'category-1', name: '海鲜水产', imageMediaId: '' }]));
  await textFirstLoading;
  services.catalog.listCategories = originalListCategories;

  // 首批元数据尚未落位时，分类/搜索只记录意图，避免远端结果被随后的首40件覆盖。
  const gatedCalls = [];
  let releaseInitialProducts;
  const gatedProduct = { ...products[79], _id: 'gated-search-result', name: '延迟搜索结果' };
  services.catalog.listProducts = (payload) => {
    gatedCalls.push(payload);
    if (payload.pageSize === 40) return new Promise((resolve) => { releaseInitialProducts = () => resolve(okRows(products.slice(0, 40), { total: 40, page: 1, pageSize: 40 })); });
    return Promise.resolve(okRows([gatedProduct], { total: 1, page: 1, pageSize: payload.pageSize }));
  };
  const gatedPage = makePage();
  gatedPage.data.page = 'category';
  gatedPage.resolveMediaFileMap = async () => ({});
  const gatedLoading = gatedPage.loadRemoteCatalog();
  while (!releaseInitialProducts) await Promise.resolve();
  gatedPage.ensureRemoteCatalogForCurrentView({ keyword: '延迟搜索结果' });
  assert.equal(gatedCalls.length, 1, '元数据完成前不得抢跑分类请求');
  assert.equal(gatedPage.data.catalogBrowseLoading, true);
  releaseInitialProducts();
  await gatedLoading;
  assert(gatedPage.findProduct('gated-search-result'), '待执行搜索应在首批落位后合并且不被覆盖');

  page.setDataCalls.length = 0;
  page.switchTab({ currentTarget: { dataset: { tab: 'cart' } } });
  assert.equal(page.setDataCalls.length, 1, '主导航切页只能执行一次 setData');
  assert.equal(page.data.pageMotion, false, '切页不应再等待220ms入场动画');
  assert.equal(page._pageMotionTimer, null);

  const restorePage = makePage();
  const started = [];
  const releases = [];
  const originalGetMe = services.auth.getMe;
  services.auth.getMe = async () => ({ ok: true, data: { user: { _id: 'user-1', userType: 'c', status: 'active' } } });
  ['loadRemoteCatalogPrices', 'loadRemoteAddress', 'loadRemoteCart', 'loadRemoteOrders'].forEach((name) => {
    restorePage[name] = () => {
      started.push(name);
      return new Promise((resolve) => releases.push(resolve));
    };
  });
  const restoring = restorePage.restoreRemoteSession();
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(started.sort(), ['loadRemoteAddress', 'loadRemoteCart', 'loadRemoteCatalogPrices', 'loadRemoteOrders'].sort(), '身份确认后的独立会话数据必须并行恢复');
  releases.forEach((resolve) => resolve());
  await restoring;
  services.auth.getMe = originalGetMe;

  const loginPage = makePage();
  loginPage.data.agreed = true;
  loginPage.applyRemotePriceLabels = () => {};
  loginPage.dismissLogin = (callback) => { if (callback) callback(); };
  services.auth.login = async () => ({ ok: true, data: { user: { _id: 'user-login', userType: 'c', status: 'active' } } });
  const loginStarted = [];
  const loginReleases = [];
  ['loadRemoteCatalogPrices', 'loadRemoteAddress', 'loadRemoteCart', 'loadRemoteOrders'].forEach((name) => {
    loginPage[name] = () => {
      loginStarted.push(name);
      return new Promise((resolve) => loginReleases.push(resolve));
    };
  });
  const loggingIn = loginPage.completeLogin({ detail: { errMsg: 'getPhoneNumber:ok', code: 'phone-code-test' } });
  for (let index = 0; index < 10 && loginStarted.length < 4; index += 1) await Promise.resolve();
  assert.deepEqual(loginStarted.sort(), ['loadRemoteAddress', 'loadRemoteCart', 'loadRemoteCatalogPrices', 'loadRemoteOrders'].sort(), '首次登录后的四类数据也必须并行恢复');
  loginReleases.forEach((resolve) => resolve());
  await loggingIn;

  // 分类与搜索必须按服务端 total 继续翻页，不能被单页 100 条静默截断。
  const browseRows = Array.from({ length: 235 }, (_, index) => ({
    _id: `browse-${index + 1}`,
    categoryId: 'category-1',
    categoryName: '海鲜水产',
    name: `完整目录商品${index + 1}`,
    coverMediaId: '',
    skus: [{ _id: `browse-sku-${index + 1}`, specName: '1件', packageUnit: '件' }]
  }));
  const browseCalls = [];
  services.catalog.listProducts = async (payload) => {
    browseCalls.push(payload);
    const start = (payload.page - 1) * payload.pageSize;
    return okRows(browseRows.slice(start, start + payload.pageSize), { total: browseRows.length, page: payload.page, pageSize: payload.pageSize });
  };
  const browsePage = makePage();
  browsePage._catalogLoadSeq = 1;
  browsePage._catalogMetadataReady = true;
  browsePage.resolveMediaFileMap = async () => ({});
  await browsePage.loadRemoteCatalogSlice({ keyword: '完整目录' });
  assert.deepEqual(browseCalls.map((call) => call.page), [1, 2, 3], '搜索结果超过100条时必须按 total 继续加载');
  assert(browseRows.every((item) => browsePage.findProduct(item._id)), '分类/搜索结果不能丢失第100条以后的商品');
  const completedCallCount = browseCalls.length;
  await browsePage.loadRemoteCatalogSlice({ keyword: '完整目录' });
  assert.equal(browseCalls.length, completedCallCount, '已完整加载的同一搜索不应重复全量请求');

  // 本地首页无命中时不得误报“没有找到”；远端请求期间必须显示等待状态。
  let releaseBrowse;
  services.catalog.listProducts = () => new Promise((resolve) => { releaseBrowse = resolve; });
  const pendingBrowsePage = makePage();
  pendingBrowsePage._catalogLoadSeq = 2;
  pendingBrowsePage._catalogMetadataReady = true;
  pendingBrowsePage.data.page = 'category';
  pendingBrowsePage.resolveMediaFileMap = async () => ({});
  const pendingBrowse = pendingBrowsePage.loadRemoteCatalogSlice({ keyword: '暂未命中' });
  assert.equal(pendingBrowsePage.data.catalogBrowseLoading, true);
  assert.equal(pendingBrowsePage.data.catalogBrowseError, '');
  releaseBrowse(okRows([], { total: 0, page: 1, pageSize: 100 }));
  await pendingBrowse;
  assert.equal(pendingBrowsePage.data.catalogBrowseLoading, false);

  // 全目录换代后，旧分类请求的迟到响应不得混入新一代数据。
  let releaseStaleBrowse;
  services.catalog.listProducts = () => new Promise((resolve) => { releaseStaleBrowse = resolve; });
  const staleBrowsePage = makePage();
  staleBrowsePage._catalogLoadSeq = 3;
  staleBrowsePage._catalogMetadataReady = true;
  staleBrowsePage.data.page = 'category';
  staleBrowsePage.resolveMediaFileMap = async () => ({});
  const staleBrowse = staleBrowsePage.loadRemoteCatalogSlice({ keyword: '旧请求' });
  staleBrowsePage._catalogLoadSeq = 4;
  staleBrowsePage.getCatalogBrowse().reset(4);
  releaseStaleBrowse(okRows([browseRows[0]], { total: 1, page: 1, pageSize: 100 }));
  await staleBrowse;
  assert.equal(staleBrowsePage.findProduct(browseRows[0]._id), undefined, '旧世代响应必须丢弃');

  const initialCategoryPage = makePage();
  initialCategoryPage.data.page = 'category';
  initialCategoryPage.data.activeTab = 'category';
  initialCategoryPage.resolveMediaFileMap = async () => ({});
  let initialCategoryExpanded = false;
  initialCategoryPage.ensureRemoteCatalogForCurrentView = (options) => { initialCategoryExpanded = options && options.userInitiated === true; };
  services.catalog.listProducts = async (payload) => okRows(browseRows.slice(0, payload.pageSize), { total: browseRows.length, page: 1, pageSize: payload.pageSize });
  await initialCategoryPage.loadRemoteCatalog();
  assert.equal(initialCategoryExpanded, true, '从 category 启动时也必须在首屏后继续补齐目录');

  // 后台刷新失败不得把已经可见的商品切成错误空页。
  services.catalog.listProducts = async () => ({ ok: false });
  const preservedPage = makePage();
  preservedPage.data.products = [{ id: 'kept-product', name: '已加载商品', category: '海鲜水产', skuOptions: [] }];
  preservedPage.data.catalogStatus = 'ready';
  await preservedPage.loadRemoteCatalog({ userInitiated: true });
  assert.equal(preservedPage.data.catalogStatus, 'ready');
  assert.equal(preservedPage.data.products[0].id, 'kept-product');

  // 同一价格请求期间新增的购物车 SKU 必须排队补取，不能被共享 Promise 吞掉。
  const queuedPriceCalls = [];
  let releaseFirstPrice;
  services.catalog.listPrices = (skuIds) => {
    queuedPriceCalls.push([...skuIds]);
    if (queuedPriceCalls.length === 1) {
      return new Promise((resolve) => { releaseFirstPrice = () => resolve(okRows(skuIds.map((skuId) => ({ skuId, unitPrice: 100 })))); });
    }
    return Promise.resolve(okRows(skuIds.map((skuId) => ({ skuId, unitPrice: 200 }))));
  };
  const pricePage = makePage();
  pricePage.applyRemotePriceLabels = () => {};
  pricePage.applyRemoteIdentity({ _id: 'user-price', userType: 'c', status: 'active' });
  const firstPrice = pricePage.loadRemoteCatalogPrices([{ skuOptions: [{ id: 'sku-first' }] }]);
  while (!releaseFirstPrice) await Promise.resolve();
  const secondPrice = pricePage.loadRemoteCatalogPrices([{ skuOptions: [{ id: 'sku-cart-outside-first-page' }] }]);
  releaseFirstPrice();
  await Promise.all([firstPrice, secondPrice]);
  assert.deepEqual(queuedPriceCalls, [['sku-first'], ['sku-cart-outside-first-page']], '活跃价格请求结束后必须继续处理新加入的SKU');
  assert.equal(pricePage._remotePriceBySku['sku-cart-outside-first-page'].unitPrice, 200, '新增SKU报价必须增量保留');
  await pricePage.loadRemoteCatalogPrices([{ skuOptions: [{ id: 'sku-first' }, { id: 'sku-cart-outside-first-page' }] }]);
  assert.equal(queuedPriceCalls.length, 2, '已报价 SKU 不得因重进分类而重复请求');

  let unpricedCalls = 0;
  services.catalog.listPrices = async () => { unpricedCalls += 1; return okRows([]); };
  const unpricedPage = makePage();
  unpricedPage.applyRemotePriceLabels = () => {};
  unpricedPage.applyRemoteIdentity({ _id: 'user-unpriced', userType: 'c', status: 'active' });
  const unpricedTarget = [{ skuOptions: [{ id: 'sku-confirmed-unpriced' }] }];
  await unpricedPage.loadRemoteCatalogPrices(unpricedTarget);
  await unpricedPage.loadRemoteCatalogPrices(unpricedTarget);
  assert.equal(unpricedCalls, 1, '服务端已确认未定价的 SKU 也必须去重');

  const cartPriceCalls = [];
  services.catalog.listPrices = async (skuIds) => {
    cartPriceCalls.push([...skuIds]);
    return okRows(skuIds.map((skuId) => ({ skuId, unitPrice: 345 })));
  };
  services.cart.getAll = async () => okRows([{
    _id: 'cart-row-1', skuId: 'sku-only-in-cart', quantity: 2, selected: true, unavailable: false,
    product: { _id: 'product-only-in-cart', name: '购物车独有商品', categoryName: '海鲜水产', coverMediaId: '' },
    sku: { _id: 'sku-only-in-cart', specName: '1件', packageUnit: '件', minOrderQuantity: 1, orderMultiple: 1 }
  }]);
  const cartPage = makePage();
  cartPage.applyRemotePriceLabels = () => {};
  cartPage.applyRemoteIdentity({ _id: 'user-cart', userType: 'c', status: 'active' });
  cartPage.resolveMediaFileMap = async () => ({});
  await cartPage.loadRemoteCart();
  assert(cartPriceCalls.some((ids) => ids.includes('sku-only-in-cart')), '不在首40件目录内的购物车SKU也必须请求报价');

  // 下一页失败后停止自动轮询，并记录退避窗口。
  services.catalog.listProducts = async () => ({ ok: false });
  const failedPage = makePage();
  failedPage._catalogLoadSeq = 1;
  failedPage._catalogHasMore = true;
  failedPage._catalogPage = 1;
  failedPage._catalogPageSize = 40;
  const failed = await failedPage.loadNextRemoteCatalogPage();
  assert.equal(failed, false);
  assert.equal(failedPage._catalogExpansionStopped, true, '分页失败必须停止自动扩展');
  assert(failedPage._catalogExpansionRetryAt > Date.now(), '分页失败必须进入退避窗口');
  failedPage.scheduleRemoteCatalogExpansion();
  assert.equal(failedPage._catalogExpandTimer, undefined, '失败后不能每120ms无限重试');

  // “全部”与具体分类必须使用相同的可见加载、失败和重试行为。
  const allBrowsePage = makePage();
  allBrowsePage.data.page = 'category';
  allBrowsePage.data.catalogStatus = 'ready';
  allBrowsePage._catalogLoadSeq = 1;
  allBrowsePage._catalogMetadataReady = true;
  allBrowsePage._catalogHasMore = true;
  allBrowsePage.resolveMediaFileMap = async () => ({});
  allBrowsePage.mergeRemoteCatalogRows(products.slice(0, 40));
  let releaseAllBrowse;
  services.catalog.listProducts = () => new Promise((resolve) => { releaseAllBrowse = resolve; });
  const allLoading = allBrowsePage.ensureRemoteCatalogForCurrentView({ categoryId: '全部' });
  assert.equal(allBrowsePage.data.catalogBrowseLoading, true, '全部分类续载也必须显示加载状态');
  releaseAllBrowse({ ok: false });
  await allLoading;
  assert.equal(allBrowsePage.data.products.length, 40, '全部续载失败必须保留首批商品');
  assert.equal(allBrowsePage.data.catalogBrowseError, '商品加载失败，请重试');
  assert.equal(allBrowsePage.data.catalogBrowseLoading, false);
  services.catalog.listProducts = async () => okRows(products, { total: 80 });
  await allBrowsePage.retryCatalogBrowse();
  assert.equal(allBrowsePage.data.products.length, 80, '点击全部分类的重试应恢复缺失商品');
  assert.equal(allBrowsePage.data.catalogBrowseError, '');
  assert.equal(allBrowsePage.data.catalogBrowseLoading, false);

  // 媒体失败不应阻断首屏后的价格和拼团请求。
  let pricesStarted = false;
  let groupsStarted = false;
  services.catalog.listProducts = async (payload) => okRows(products.slice(0, Math.min(1, payload.pageSize)), { total: 1, page: 1, pageSize: payload.pageSize });
  services.catalog.listPrices = async (skuIds) => { pricesStarted = true; return okRows(skuIds.map((skuId) => ({ skuId, unitPrice: 100 }))); };
  services.groups.campaigns = async () => { groupsStarted = true; return okRows([]); };
  const mediaFailurePage = makePage();
  mediaFailurePage.applyRemotePriceLabels = () => {};
  mediaFailurePage.applyRemoteIdentity({ _id: 'user-media', userType: 'c', status: 'active' });
  mediaFailurePage.resolveMediaFileMap = async () => { throw new Error('media unavailable'); };
  await mediaFailurePage.loadRemoteCatalog();
  assert.equal(pricesStarted, true, '媒体失败时仍必须独立请求价格');
  assert.equal(groupsStarted, true, '媒体失败时仍必须独立请求拼团');
  assert.equal(mediaFailurePage.data.catalogStatus, 'ready');

  // 拼团商品与内容跳转商品即使不在首40件，也要按ID补载并变为可达。
  const reachabilityPage = makePage();
  reachabilityPage._catalogLoadSeq = 1;
  reachabilityPage._remoteGroupCampaignRows = [{ _id: 'campaign-70', productId: 'product-70', skuId: 'sku-70', groupSize: 3 }];
  reachabilityPage.syncRemoteGroupCampaigns();
  assert.equal(reachabilityPage.data.groupDeals.length, 0);
  reachabilityPage.mergeRemoteCatalogRows([products[69]]);
  assert.equal(reachabilityPage.data.groupDeals[0].product.id, 'product-70', '目录扩展后必须重新映射先前不可见的拼团商品');

  let resolveJumpProduct;
  let jumpProductCalls = 0;
  services.catalog.getProduct = (id) => {
    jumpProductCalls += 1;
    return new Promise((resolve) => { resolveJumpProduct = () => resolve({ ok: true, data: { product: { ...products[79], _id: id }, skus: products[79].skus } }); });
  };
  const jumpPage = makePage();
  jumpPage._catalogLoadSeq = 1;
  jumpPage.resolveMediaFileMap = async () => ({});
  let openedJumpProduct = '';
  jumpPage.openProductById = (id) => { openedJumpProduct = id; };
  assert.equal(jumpPage.consumeContentJump({ jumpType: 'product', jumpTarget: 'product-outside-first-page' }), true);
  assert.equal(jumpPage.data.contentJumpLoadingId, 'product-outside-first-page', '首屏外商品跳转必须立即显示打开中反馈');
  assert.equal(loadingShown > 0, true);
  jumpPage.consumeContentJump({ jumpType: 'product', jumpTarget: 'product-outside-first-page' });
  assert.equal(jumpProductCalls, 1, '重复点击不得重复请求同一商品');
  resolveJumpProduct();
  for (let index = 0; index < 20 && (!openedJumpProduct || jumpPage.data.contentJumpLoadingId); index += 1) await Promise.resolve();
  assert.equal(openedJumpProduct, 'product-outside-first-page', '商品跳转缺失时必须按ID补载后打开');
  assert.equal(jumpPage.data.contentJumpLoadingId, '');
  assert.equal(loadingHidden > 0, true);

  // 用户紧接着改点另一商品时，迟到的旧响应不得抢回页面。
  const jumpResolvers = {};
  services.catalog.getProduct = (id) => new Promise((resolve) => {
    jumpResolvers[id] = () => resolve({ ok: true, data: { product: { ...products[79], _id: id }, skus: products[79].skus } });
  });
  const latestJumpPage = makePage();
  latestJumpPage._catalogLoadSeq = 1;
  latestJumpPage.resolveMediaFileMap = async () => ({});
  const openedJumpProducts = [];
  latestJumpPage.openProductById = (id) => { openedJumpProducts.push(id); };
  latestJumpPage.consumeContentJump({ jumpType: 'product', jumpTarget: 'jump-product-a' });
  latestJumpPage.consumeContentJump({ jumpType: 'product', jumpTarget: 'jump-product-b' });
  jumpResolvers['jump-product-a']();
  for (let index = 0; index < 10; index += 1) await Promise.resolve();
  assert.deepEqual(openedJumpProducts, [], '旧商品响应不得打开页面');
  assert.equal(latestJumpPage.data.contentJumpLoadingId, 'jump-product-b');
  jumpResolvers['jump-product-b']();
  for (let index = 0; index < 20 && latestJumpPage.data.contentJumpLoadingId; index += 1) await Promise.resolve();
  assert.deepEqual(openedJumpProducts, ['jump-product-b']);

  let releaseRemoteBeforeLocal;
  services.catalog.getProduct = (id) => new Promise((resolve) => {
    releaseRemoteBeforeLocal = () => resolve({ ok: true, data: { product: { ...products[79], _id: id }, skus: products[79].skus } });
  });
  const remoteThenLocalPage = makePage();
  remoteThenLocalPage._catalogLoadSeq = 1;
  remoteThenLocalPage.data.products = [{ ...products[0], id: 'already-local-product', skuOptions: [], specs: [] }];
  remoteThenLocalPage.resolveMediaFileMap = async () => ({});
  const remoteThenLocalOpened = [];
  remoteThenLocalPage.openProductById = (id) => { remoteThenLocalOpened.push(id); };
  remoteThenLocalPage.consumeContentJump({ jumpType: 'product', jumpTarget: 'remote-product-a' });
  remoteThenLocalPage.consumeContentJump({ jumpType: 'product', jumpTarget: 'already-local-product' });
  assert.deepEqual(remoteThenLocalOpened, ['already-local-product'], '已加载的新选择应立即打开');
  assert.equal(remoteThenLocalPage.data.contentJumpLoadingId, '');
  releaseRemoteBeforeLocal();
  for (let index = 0; index < 20; index += 1) await Promise.resolve();
  assert.deepEqual(remoteThenLocalOpened, ['already-local-product'], '旧远程响应不得覆盖后来的本地商品选择');

  console.log('client performance contract test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => {
  delete global.wx;
  delete require.cache[pagePath];
});
