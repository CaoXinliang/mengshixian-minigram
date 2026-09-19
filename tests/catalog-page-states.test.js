const assert = require('assert/strict');
const fs = require('fs');
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
let bannerFailure = false;
let homeSectionsFailure = false;
let catalogSliceFailure = false;
const catalogSliceCalls = [];
const storage = {};

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: { login: async () => okRows([]), getMe: async () => okRows([]), applyBusiness: async () => okRows([]) },
  catalog: {
    listAllProducts: async () => catalogFailure ? { ok: false, error: { message: '目录网络错误' } } : okRows(products),
    listAllCategories: async () => categoryFailure ? { ok: false, error: { message: '分类接口失败' } } : okRows(categories),
    listProducts: async (payload) => {
      catalogSliceCalls.push({ ...payload });
      return catalogSliceFailure ? { ok: false } : okRows([]);
    }, listCategories: async () => okRows([]), listPrices: async () => okRows([]),
    getProduct: async (productId) => detailFailure
      ? { ok: false, error: { message: '详情网络错误' } }
      : { ok: true, data: { product: { _id: productId, name: '分页末尾大虾', categoryName: '海鲜水产' }, skus: [{ _id: 'sku-125', specName: '500克', packageUnit: '500克' }], media: [] } }
  },
  content: {
    getBanners: async () => bannerFailure ? { ok: false } : okRows([]),
    getHomeSections: async () => homeSectionsFailure ? { ok: false } : okRows([]),
    resolveMedia: async () => okRows([])
  },
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
global.wx = {
  showToast: () => {},
  getStorageSync: (key) => storage[key],
  setStorageSync: (key, value) => { storage[key] = value; },
  removeStorageSync: (key) => { delete storage[key]; },
  getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667, screenHeight: 667, statusBarHeight: 20 })
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
    },
    resolveMediaFileMap: async () => ({})
  });
}

async function run() {
  const failedHome = makePage();
  catalogFailure = true;
  categoryFailure = true;
  bannerFailure = true;
  homeSectionsFailure = true;
  await failedHome.retryHomeContent();
  assert.equal(failedHome.data.homeViewStatus, 'error', '首页没有任何可保留内容时目录失败必须进入整体失败态');
  assert.equal(failedHome.data.homeViewShowBlockingState, true);
  assert.equal(failedHome.data.homeViewStateActionLabel, '重新加载');
  catalogFailure = false;
  categoryFailure = false;
  bannerFailure = false;
  homeSectionsFailure = false;

  const page = makePage();
  page.data.mealIdeasStatus = 'error';
  page.data.mealIdeasErrorText = '菜品更新失败，已保留当前内容';
  await page.loadRemoteCatalog();
  assert.equal(page.data.catalogStatus, 'ready');
  assert.equal(page.data.products.length, 125, 'the page must retain the complete service catalog');
  categoryFailure = true;
  await page.loadRemoteCatalog();
  assert.equal(page.data.catalogStatus, 'ready', 'category failure must not hide an otherwise valid product catalog');
  assert.equal(page.data.mealIdeasStatus, 'error', '商品目录成功不能清除独立菜品接口的失败');
  assert.equal(page.data.mealIdeasErrorText, '菜品更新失败，已保留当前内容');
  assert.equal(page.data.products.length, 125);
  categoryFailure = false;
  page.syncCategory({ categoryGroup: '全部', category: '全部', query: '大虾' });
  assert.deepEqual(page.data.categoryProducts.map((item) => item.id), ['product-125'], 'search must include products from later remote pages');

  catalogFailure = true;
  page.data.mealIdeasStatus = 'ready';
  page.data.query = '大虾';
  await page.loadRemoteCatalog();
  assert.equal(page.data.catalogStatus, 'ready', 'a failed background refresh must keep the last valid catalog browsable');
  assert.equal(page.data.mealIdeasStatus, 'ready', '商品目录失败不能使已成功菜品变成失败');
  assert.equal(page.data.catalogErrorTitle, '商品搜索失败');
  assert.equal(page.data.catalogErrorText, '未能完成本次搜索，请检查网络后重试', 'raw service errors must not be rendered in the customer-facing catalog');
  assert.equal(page.data.products.length, 125, 'a failed refresh must preserve the last complete catalog');
  assert.equal(page.data.catalogRefreshError, '刷新失败，已保留当前商品', '首页已有商品时刷新失败也必须留下可见的重试状态');
  assert.equal(page.data.homeViewStatus, 'refresh-error', '已有首页内容时失败只能成为局部刷新失败');
  assert.equal(page.data.homeViewShowBlockingState, false, '局部失败不能遮住现有首页内容');
  assert.equal(page.data.specials.length, 8, '刷新失败不能清空已有首页商品');
  catalogFailure = false;
  await page.retryRemoteCatalog();
  assert.equal(page.data.catalogStatus, 'ready');
  assert.equal(page.data.categoryProducts.length, 1, 'retry must preserve and reapply the current search');
  assert.equal(page.data.catalogRefreshError, '', '重试成功必须清除首页刷新失败提示');

  page.selectGroup({ currentTarget: { dataset: { group: 'cat-1' } } });
  assert.equal(page.data.query, '', '点击一级分类应退出旧搜索，与分类查询保持一致');
  assert.equal(page.data.categoryProducts.length, 125, '分类中不能因为旧关键词残留而隐藏其他商品');
  page.onSearchInput({ detail: { value: '大虾' } });
  page.startSearch();
  assert.equal(page.data.categoryProducts.length, 1);
  page.selectCategory({ currentTarget: { dataset: { category: '海鲜水产' } } });
  assert.equal(page.data.query, '', '点击左侧分类也应退出旧搜索');
  assert.equal(page.data.categoryProducts.length, 125);

  page.setData({ catalogResultsScrollTop: 244 });
  page._catalogResultsScrollTop = 244;
  page.openCategoryByLabel('海鲜水产');
  assert.notEqual(page.data.catalogResultsScrollTop, 244, '从首页分类入口切换范围也必须把结果区回到顶部');
  assert.equal(page._catalogResultsScrollTop, 0);

  page.setData({ categoryGroup: 'cat-1', category: '不存在分类', query: '', searchDraft: '', searchMode: false });
  page.syncCategory();
  assert.equal(page.data.categoryProducts.length, 0);
  page.clearCategoryFilters();
  assert.equal(page.data.category, '全部', '普通分类空结果必须可以清除当前二级筛选');
  assert.equal(page.data.query, '');

  const pagedCategoryPage = makePage();
  await pagedCategoryPage.loadRemoteCatalog();
  pagedCategoryPage.setData({ page: 'category', activeTab: 'category', categoryGroup: 'cat-1', category: '海鲜水产', searchMode: false });
  pagedCategoryPage.syncCategory();
  pagedCategoryPage.onCatalogResultsScroll({ detail: { scrollTop: 211 } });
  const callsBeforeCategoryFailure = catalogSliceCalls.length;
  catalogSliceFailure = true;
  await pagedCategoryPage.ensureRemoteCatalogForCurrentView({ categoryId: 'cat-1' });
  assert.equal(pagedCategoryPage.data.categoryProducts.length, 125, '分类续载失败不能清空已加载商品');
  assert.equal(pagedCategoryPage._catalogResultsScrollTop, 211, '分类续载失败不能重置结果滚动上下文');
  assert.equal(pagedCategoryPage.data.catalogBrowseError, '商品加载失败，请重试');
  catalogSliceFailure = false;
  await pagedCategoryPage.retryCatalogBrowse();
  const failedAndRetryCalls = catalogSliceCalls.slice(callsBeforeCategoryFailure);
  assert.deepEqual(failedAndRetryCalls.map((item) => item.categoryId), ['cat-1', 'cat-1'], '分页重试只能补当前分类范围');
  assert.equal(pagedCategoryPage._catalogResultsScrollTop, 211, '分页重试成功也不能抢走用户滚动位置');
  assert.equal(pagedCategoryPage.data.catalogBrowseError, '');

  const searchPage = makePage();
  await searchPage.loadRemoteCatalog();
  searchPage.setData({ page: 'category', activeTab: 'category', categoryGroup: 'cat-1', category: '海鲜水产', searchDraft: '' });
  searchPage.onCatalogResultsScroll({ detail: { scrollTop: 326 } });
  searchPage.onSearchInput({ detail: { value: '  大虾  ' } });
  const searchRequest = searchPage.startSearch();
  assert.equal(searchPage.data.searchMode, true, '提交关键词后必须进入明确搜索模式');
  assert.equal(searchPage.data.query, '大虾');
  assert.equal(searchPage.data.searchDraft, '大虾');
  assert.deepEqual(searchPage.data.recentSearches, ['大虾']);
  assert.deepEqual(storage.mengshixian_recent_searches, ['大虾'], '本机只能持久化纯关键词数组');
  await searchRequest;
  assert.equal(searchPage.data.categoryProducts.length, 1);
  assert.equal(searchPage.data.searchCategorySuggestions[0].label, '搜索结果');
  assert(searchPage.data.searchCategorySuggestions.some((item) => item.label === '海鲜水产'), '搜索建议必须来自真实分类');

  const callsBeforeBlank = catalogSliceCalls.length;
  searchPage.onSearchInput({ detail: { value: '   ' } });
  assert.equal(searchPage.startSearch(), false, '空关键词不能进入新搜索');
  assert.equal(catalogSliceCalls.length, callsBeforeBlank, '空关键词不能发目录请求');
  searchPage.clearSearchKeyword();
  assert.equal(searchPage.data.searchDraft, '');
  assert.equal(searchPage.data.query, '', '清空必须同步清除已提交关键词');

  searchPage.onSearchInput({ detail: { value: '大虾' } });
  searchPage.startSearch();
  searchPage.exitSearch();
  assert.equal(searchPage.data.page, 'category');
  assert.equal(searchPage.data.searchMode, false);
  assert.equal(searchPage.data.categoryGroup, 'cat-1');
  assert.equal(searchPage.data.category, '海鲜水产');
  assert.equal(searchPage.data.catalogResultsScrollTop, 326, '退出搜索必须恢复来源结果滚动位置');

  const failedSearchPage = makePage();
  await failedSearchPage.loadRemoteCatalog();
  catalogSliceFailure = true;
  failedSearchPage.onSearchInput({ detail: { value: '大虾' } });
  await failedSearchPage.startSearch();
  assert.equal(failedSearchPage.data.searchMode, true);
  assert.equal(failedSearchPage.data.query, '大虾');
  assert.equal(failedSearchPage.data.categoryProducts.length, 1, '搜索失败仍须保留已经可见的匹配结果');
  assert.equal(failedSearchPage.data.catalogBrowseError, '商品加载失败，请重试');
  failedSearchPage.retryCatalogBrowse();
  assert.equal(failedSearchPage.data.query, '大虾', '重试不能清空关键词和筛选');
  catalogSliceFailure = false;

  const delayedRecoveryPage = makePage();
  delayedRecoveryPage.data.catalogStatus = 'error';
  let releaseOldRecovery;
  delayedRecoveryPage.loadRemoteCatalog = () => new Promise((resolve) => { releaseOldRecovery = resolve; });
  const requestedKeywords = [];
  delayedRecoveryPage.ensureRemoteCatalogForCurrentView = ({ keyword }) => {
    requestedKeywords.push(keyword);
    return Promise.resolve(true);
  };
  delayedRecoveryPage.onSearchInput({ detail: { value: '旧关键词' } });
  const oldRecoverySearch = delayedRecoveryPage.startSearch();
  delayedRecoveryPage.data.catalogStatus = 'ready';
  delayedRecoveryPage.onSearchInput({ detail: { value: '新关键词' } });
  await delayedRecoveryPage.startSearch();
  releaseOldRecovery(true);
  await oldRecoverySearch;
  assert.deepEqual(requestedKeywords, ['新关键词'], '目录恢复较晚时，旧搜索不能在新搜索之后重新发起');
  assert.equal(delayedRecoveryPage.data.query, '新关键词');

  const pendingMetadataPage = makePage();
  pendingMetadataPage._catalogMetadataReady = false;
  pendingMetadataPage.onSearchInput({ detail: { value: '等待目录的旧关键词' } });
  await pendingMetadataPage.startSearch();
  assert.equal(pendingMetadataPage._pendingCatalogViewOptions.keyword, '等待目录的旧关键词');
  pendingMetadataPage.clearSearchKeyword();
  assert.equal(pendingMetadataPage._pendingCatalogViewOptions, null, '清空搜索必须一并作废目录就绪后待执行的旧关键词');
  pendingMetadataPage._catalogMetadataReady = true;
  const callsBeforeClearedSearchResume = catalogSliceCalls.length;
  await pendingMetadataPage.ensureRemoteCatalogForCurrentView({});
  assert.equal(catalogSliceCalls.length, callsBeforeClearedSearchResume, '目录随后就绪时，空搜索模式不能退化成全目录请求');

  searchPage.clearRecentSearches();
  assert.deepEqual(searchPage.data.recentSearches, []);
  assert.deepEqual(storage.mengshixian_recent_searches, []);

  const searchWxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.wxml'), 'utf8');
  assert(searchWxml.includes("{{searchMode ? '搜索商品' : '商品分类'}}"), '搜索与分类必须拥有明确标题');
  assert(searchWxml.includes('bindtap="exitSearch"'), '搜索页返回必须连接来源恢复事件');
  assert(searchWxml.includes('bindtap="clearRecentSearches"'), '最近搜索必须提供清空入口');
  assert(searchWxml.includes('bindscroll="onCatalogResultsScroll"'), '结果滚动必须可记录以便返回恢复');
  assert(searchWxml.includes('bindtap="viewAllCategoriesFromSearch"'), '无结果态必须提供查看分类入口');
  assert(searchWxml.includes('bindtap="clearCategoryFilters"'), '普通分类无结果态必须提供清除条件入口');
  assert(/class="major-scroll"[^>]*scroll-x="true"/.test(searchWxml), '一级分类必须拥有独立横向滚动容器');
  assert(/wx:else class="catalog-side"[^>]*scroll-y="true"/.test(searchWxml), '二级分类必须拥有独立纵向滚动容器');
  assert(/class="catalog-results"[^>]*scroll-y="true"[^>]*bindscroll="onCatalogResultsScroll"/.test(searchWxml), '结果区必须拥有独立纵向滚动和上下文记录');
  assert(searchWxml.includes('<product-purchase-action'), '分类商品必须复用固定操作槽组件');

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

  page.data.products = [{ id: 'broken-image', name: '图片失败商品', category: '海鲜水产', img: '/broken.jpg', purchaseRuleUnavailable: false }];
  page.handleCatalogImageError({ currentTarget: { dataset: { id: 'broken-image' } } });
  assert.equal(page.data.products[0].img, '/assets/products/placeholder.svg');
  assert.equal(page.data.products[0].imageUnavailable, true);
  assert.equal(page.data.products[0].purchaseRuleUnavailable, false, '图片失败不能改变商品的真实购买状态');
  page._catalogLoadSeq = 12;
  page.resolveMediaFileMap = async () => ({ 'broken-media': 'cloud://still-broken.jpg' });
  page.data.products[0].coverMediaId = 'broken-media';
  await page.hydrateAdditionalProductMedia(page.data.products, 12);
  assert.equal(page.data.products[0].img, '/assets/products/placeholder.svg', '迟到的媒体解析不能把已经失败的图片地址重新写回');

  page.data.page = 'home';
  page.data.products = [{ id: 'home-image', name: '首页商品', category: '海鲜水产', img: '/home-broken.jpg', purchaseRuleUnavailable: false, priceText: '¥12.34' }];
  page.data.specials = [...page.data.products];
  page.handleCatalogImageError({ currentTarget: { dataset: { id: 'home-image' } } });
  assert.equal(page.data.specials[0].img, '/assets/products/placeholder.svg', '首页图片失败必须更新实际渲染的商品卡，不只更新分类数据');
  assert.equal(page.data.specials[0].priceText, '¥12.34', '媒体回退不能改变服务端价格');
  assert.equal(page.data.specials[0].purchaseRuleUnavailable, false, '首页坏图不能封死可购买商品');
  const homeWxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.wxml'), 'utf8').split('<block wx:elif="{{page == \'category\'}}">')[0];
  const productCardWxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/components/product-card/index.wxml'), 'utf8');
  assert(/wx:if="\{\{homeViewStatus == 'refresh-error'\}\}"[^>]*class="home-load-state home-refresh-error"/.test(homeWxml), '首页局部失败必须直接消费统一展示状态，不能在 WXML 重复推导');
  assert(/class="home-load-state home-refresh-error"[\s\S]*?bindtap="retryHomeContent"/.test(homeWxml), '首页局部失败提示必须连接首页全部内容重试入口');
  assert(/wx:if="\{\{homeViewShowBlockingState\}\}"[\s\S]*?title="\{\{homeViewStateTitle\}\}"[\s\S]*?bind:action="retryHomeContent"/.test(homeWxml), '首页整体状态必须消费统一展示状态并连接首页全部内容重试入口');
  assert(homeWxml.includes('bind:mediaerror="handleProductCardMediaError"') && productCardWxml.includes('binderror="mediaError"'), '首页商品图片必须通过组件公开事件把真实error和商品ID送入回退处理');

  const originalGetBanners = servicesStub.content.getBanners;
  const originalGetHomeSections = servicesStub.content.getHomeSections;
  const delayedHome = makePage();
  const bannerRequests = [];
  servicesStub.content.getBanners = () => new Promise((resolve) => bannerRequests.push(resolve));
  const oldBannerRequest = delayedHome.loadRemoteBanners();
  const newBannerRequest = delayedHome.loadRemoteBanners();
  bannerRequests[1](okRows([{ title: '新轮播', mediaAssetId: 'new-banner' }]));
  await newBannerRequest;
  bannerRequests[0](okRows([{ title: '旧轮播', mediaAssetId: 'old-banner' }]));
  await oldBannerRequest;
  assert.equal(delayedHome.data.bannerItems[0].headline, '新轮播', '迟到的旧轮播请求不能覆盖较新的结果');

  servicesStub.content.getHomeSections = async () => { throw new Error('network down'); };
  await delayedHome.loadRemoteHomeSections();
  assert.equal(delayedHome.data.homeSectionsStatus, 'error', '首页模块请求抛错也必须结束 loading 并进入可恢复失败态');
  servicesStub.content.getBanners = originalGetBanners;
  servicesStub.content.getHomeSections = originalGetHomeSections;

  const originalListAllProducts = servicesStub.catalog.listAllProducts;
  const originalListAllCategories = servicesStub.catalog.listAllCategories;
  let resolveCategories;
  servicesStub.catalog.listAllProducts = async () => okRows([]);
  servicesStub.catalog.listAllCategories = () => new Promise((resolve) => { resolveCategories = resolve; });
  const categoryPendingHome = makePage();
  categoryPendingHome.data.bannerStatus = 'ready';
  categoryPendingHome.data.homeSectionsStatus = 'ready';
  const categoryPendingRequest = categoryPendingHome.loadRemoteCatalog();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(categoryPendingHome.data.homeViewStatus, 'loading', '空商品先返回时首页必须等待分类请求，不能提前显示空态');
  resolveCategories(okRows(categories));
  await categoryPendingRequest;
  assert.equal(categoryPendingHome.data.homeCategoriesStatus, 'ready');
  assert.equal(categoryPendingHome.data.homeViewStatus, 'ready', '真实分类到达后首页应从 loading 进入可浏览状态');

  servicesStub.catalog.listAllCategories = async () => ({ ok: false });
  const retainedCategoryHome = makePage();
  retainedCategoryHome.data.products = [];
  retainedCategoryHome.data.specials = [];
  retainedCategoryHome.data.homeCategories = [{ label: '已保留分类', image: '/kept.svg' }];
  retainedCategoryHome.data.categoryGroups = [{ id: 'kept', label: '已保留分类', categories: ['已保留分类'] }];
  retainedCategoryHome.data.bannerStatus = 'ready';
  retainedCategoryHome.data.homeSectionsStatus = 'ready';
  await retainedCategoryHome.loadRemoteCatalog();
  assert.deepEqual(retainedCategoryHome.data.homeCategories.map((item) => item.label), ['已保留分类'], '分类刷新失败不能清空已有可用分类');
  assert.equal(retainedCategoryHome.data.homeViewStatus, 'refresh-error', '保留旧分类时只能显示局部刷新失败');
  servicesStub.catalog.listAllProducts = originalListAllProducts;
  servicesStub.catalog.listAllCategories = originalListAllCategories;
  console.log('catalog page states test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
