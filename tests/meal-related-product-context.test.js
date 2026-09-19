const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const pagePath = path.resolve(__dirname, '../miniapp/pages/index/index.js');
const mealIdeas = require('../miniapp/config/meal-ideas');
const emptyApi = new Proxy({}, { get: () => async () => ({ ok: true, data: { rows: [] } }) });
const services = {
  config: { provider: 'cloudbase', customerMealIdeasEnabled: true },
  auth: emptyApi, catalog: emptyApi, content: emptyApi, address: emptyApi, cart: emptyApi, delivery: emptyApi,
  checkout: emptyApi, orders: emptyApi, refunds: emptyApi, groups: emptyApi, favorites: emptyApi, reviews: emptyApi
};
const originalLoad = Module._load;
let definition;
Module._load = function(request, parent, isMain) {
  if (request === '../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = value => { definition = value; };
try { require(pagePath); } finally { Module._load = originalLoad; delete global.Page; }

const product = {
  id: 'white-prawn', name: '南美白对虾', img: '/assets/products/white-prawn.png', unit: '500克/袋',
  specs: ['500克/袋'], skus: [{ id: 'sku-prawn', spec: '500克/袋', unit: '袋', status: 'on_sale' }], status: 'on_sale'
};
const page = Object.assign({}, definition, {
  data: JSON.parse(JSON.stringify(definition.data)),
  setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); },
  triggerPageMotion(patch, callback) { this.setData(patch, callback); },
  loadRemoteProductDetail: async () => true,
  loadProductReviews: async () => true,
  loadDetailFavorite: async () => true
});

async function run() {
  page.data.products = [product];
  page.data.orders = [{ id: 'historical-order', items: [{ productId: product.id }] }];
  page._mealIdeas = mealIdeas;
  page.syncMealIdeas(page.data.products);
  page.selectMealScene({ detail: { scene: '快手家常' } });
  page.data.mealBatchCursor = 2;
  page._mealListScrollTop = 286;
  const target = page.data.mealIdeas.find(item => item.id === 'salt-baked-prawn');
  assert(target.linkedProducts.some(item => item.id === product.id), '菜谱关联必须来自当前商品事实');
  assert.notEqual(target.cover, product.img, '商品食材图不得冒充菜谱成品封面');

  page.openMealIdea({ detail: { id: target.id } });
  await page._mealVideoPromise;
  assert.equal(page.data.page, 'mealIdea');
  assert.equal(page.data.selectedMealIdea.id, target.id);
  page.openProduct({ detail: { id: product.id } });
  assert.equal(page.data.page, 'detail');
  assert.equal(page.data.detailReturnPage, 'mealIdea', '从菜谱进入商品时必须保存菜谱作为返回页');
  page.backFromDetail();
  assert.equal(page.data.page, 'mealIdea', '商品详情返回必须回到原菜谱而不是首页');
  assert.equal(page.data.selectedMealIdea.id, target.id, '商品往返不得丢失当前菜谱');
  assert.equal(page.data.mealScene, '快手家常');
  assert.equal(page.data.mealBatchCursor, 2);

  page.backToMealIdeas();
  assert.equal(page.data.page, 'mealIdeas');
  assert.equal(page.data.pageScrollTop, 286, '菜谱返回列表必须恢复原滚动位置');
  assert.equal(page.data.mealScene, '快手家常');
  assert.equal(page.data.mealBatchCursor, 2);

  page.openMealIdea({ detail: { id: target.id } });
  await page._mealVideoPromise;
  const productsBefore = JSON.stringify(page.data.products);
  const ordersBefore = JSON.stringify(page.data.orders);
  page._mealIdeas = mealIdeas.filter(item => item.id !== target.id);
  page.syncMealIdeas(page.data.products);
  assert.equal(page.data.selectedMealIdea, null);
  assert.equal(page.data.mealVideoStatus, 'unlisted');
  assert.equal(JSON.stringify(page.data.products), productsBefore, '菜品下架不得修改商品事实');
  assert.equal(JSON.stringify(page.data.orders), ordersBefore, '菜品下架不得修改历史订单');
  console.log('meal related product context: passed');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
