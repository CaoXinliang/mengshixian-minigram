const assert = require('assert/strict');
const Module = require('module');
const path = require('path');
const fs = require('fs');
const pagePath = path.resolve(__dirname, '../miniapp/pages/index/index.js');
const meal = require('../miniapp/config/meal-ideas')[0];
const ok = (rows, meta = {}) => ({ ok: true, data: { rows, ...meta } });
let response = async () => ({ ok: false, error: { message: 'private server detail' } });
const services = {
  config: { provider: 'cloudbase', customerMealIdeasEnabled: true },
  content: { getMealIdeas: payload => response(payload), resolveMedia: async () => ok([]) },
  auth: {}, catalog: {}, address: {}, cart: {}, delivery: {}, checkout: {}, orders: {}, refunds: {}, groups: {}, favorites: {}, reviews: {}
};
const originalLoad = Module._load;
let definition;
Module._load = function(request, parent, isMain) {
  if (request === '../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = value => { definition = value; };
try { require(pagePath); } finally { Module._load = originalLoad; delete global.Page; }
const page = Object.assign({}, definition, {
  data: JSON.parse(JSON.stringify(definition.data)),
  setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
});
async function run() {
  const originalTitles = page.data.mealIdeaRows.map(row => row.title);
  await page.loadRemoteMealIdeas();
  assert.equal(page.data.mealIdeasStatus, 'error', '菜品服务失败必须可观察，不能一直loading或伪装ready');
  assert.deepEqual(page.data.mealIdeaRows.map(row => row.title), originalTitles, '失败应保留当前内容');
  assert.equal(page.data.mealIdeasErrorText, '菜品更新失败，已保留当前内容');
  const paginationCalls = [];
  response = async ({ page: requestedPage, pageSize }) => {
    paginationCalls.push(requestedPage);
    if (requestedPage === 1) {
      return ok(Array.from({ length: pageSize }, (_, index) => ({ ...meal, _id: `meal-${index + 1}`, contentKey: `meal-${index + 1}` })), { total: pageSize + 1, page: requestedPage, pageSize });
    }
    return ok([{ ...meal, _id: 'meal-last', contentKey: 'meal-last', title: '第二页菜品' }], { total: pageSize + 1, page: requestedPage, pageSize });
  };
  await page.retryRemoteMealIdeas();
  assert.deepEqual(paginationCalls, [1, 2], '页面必须通过完整集合加载器读取全部菜谱页');
  assert.equal(page.data.mealIdeas.length, 101);
  page.openMealIdea({ currentTarget: { dataset: { id: 'meal-last' } } });
  assert.equal(page.data.selectedMealIdea.title, '第二页菜品');
  paginationCalls.length = 0;
  await page.retryRemoteMealIdeas();
  assert.equal(page.data.selectedMealIdea.title, '第二页菜品', '第一页缺少当前菜谱时不得提前判定下架');
  page.backToMealIdeas();
  response = async () => ok([{ ...meal, contentKey: meal.id, title: '后台更新的菜品' }]);
  await page.retryRemoteMealIdeas();
  assert.equal(page.data.mealIdeasStatus, 'ready');
  assert.equal(page.data.mealIdeasErrorText, '');
  assert.equal(page.data.mealIdeaRows[0].title, '后台更新的菜品', '重试必须读取菜品接口');
  const pageWxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/pages/index/index.wxml'), 'utf8');
  const panelWxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/components/meal-experience-panel/index.wxml'), 'utf8');
  assert.match(pageWxml, /<meal-experience-panel[\s\S]*bind:retrycollection="retryRemoteMealIdeas"/, '主页面必须接收组件的菜品重试语义事件');
  assert.match(panelWxml, /bindtap="handleRetryCollection"/, '可见菜品重试必须由展示模块发出独立加载意图');
  let finishOld;
  response = () => new Promise(resolve => { finishOld = resolve; });
  const oldRequest = page.loadRemoteMealIdeas();
  response = async () => ok([{ ...meal, contentKey: meal.id, title: '最新菜品' }]);
  await page.retryRemoteMealIdeas();
  finishOld(ok([{ ...meal, contentKey: meal.id, title: '迟到的旧菜品' }]));
  await oldRequest;
  assert.equal(page.data.mealIdeaRows[0].title, '最新菜品', '旧请求迟到不得覆盖重试得到的新内容');
  response = async () => { throw new Error('private transport detail'); };
  await page.retryRemoteMealIdeas();
  assert.equal(page.data.mealIdeasStatus, 'error', '网络异常必须可恢复而不是未处理拒绝');
  assert.equal(page.data.mealIdeaRows[0].title, '最新菜品');
  await page.loadRemoteMealIdeas({ maxAgeMs: 60000 });
  assert.equal(page.data.mealIdeasStatus, 'ready', '有效缓存可恢复状态');
  assert.equal(page.data.mealIdeaRows[0].title, '最新菜品', '缓存也不能被迟到旧请求污染');
  response = async () => ok([]);
  await page.retryRemoteMealIdeas();
  assert.equal(page.data.mealIdeasStatus, 'ready');
  assert.equal(page.data.mealIdeaRows.length, 0, '成功空列表表示无上架菜品，不能保留旧内容');
  await page.loadRemoteMealIdeas({ maxAgeMs: 60000 });
  assert.equal(page.data.mealIdeas.length, 0, '成功空列表必须更新缓存，不能复活旧菜品');
  response = async () => ({ ok: false });
  await page.retryRemoteMealIdeas();
  assert.equal(page.data.mealIdeas.length, 0, '已清空后网络失败不能复活本地兜底');
  response = async () => ok([{ ...meal, contentKey: meal.id, title: '最新菜品' }]);
  await page.retryRemoteMealIdeas();
  const emptyScene = page.data.mealScenes.find(scene => scene !== '全部' && scene !== meal.scene);
  page.selectMealScene({ currentTarget: { dataset: { scene: emptyScene } } });
  assert.equal(page.data.mealIdeaRows.length, 0);
  response = async () => ({ ok: false });
  await page.retryRemoteMealIdeas();
  const filterCondition = panelWxml.match(/<block wx:if="\{\{([^}]+)\}\}">\s*<view class="meal-scene-filter">/)[1];
  const filterVisible = new Function('ideas', 'rows', 'status', `return !!(${filterCondition});`);
  assert.equal(filterVisible(page.data.mealIdeas, page.data.mealIdeaRows, page.data.mealIdeasStatus), true,
    '空场景刷新失败后仍须显示场景栏，允许切回已有菜品');
  assert.equal(page.data.mealIdeasErrorText, '菜品更新失败，已保留当前内容', '错误文案按全部保留内容判断，不按当前筛选结果判断');
  page.selectMealScene({ currentTarget: { dataset: { scene: '全部' } } });
  assert.equal(page.data.mealIdeaRows[0].title, '最新菜品');
  page.openMealIdea({ currentTarget: { dataset: { id: meal.id } } });
  response = async () => ok([{ ...meal, contentKey: 'replacement-meal', title: '替换后的菜品' }]);
  await page.retryRemoteMealIdeas();
  assert.equal(page.data.selectedMealIdea, null, '已移出当前内容列表的菜品不能继续显示旧详情');
  assert.equal(page.data.page, 'mealIdea', '更新不应突然把用户跳转到其他页面');
  assert.match(panelWxml, /<block wx:if="\{\{selectedIdea\}\}">\s*<view class="meal-video-card">/,
    '详情必须先确认菜品存在，避免空标题和约 分钟');
  assert.match(panelWxml, /<view wx:else class="meal-state meal-unlisted-state"><text>该菜品已下架<\/text>/,
    '当前菜品不存在时应显示明确的可恢复空态');
  page.backToMealIdeas();
  assert.equal(page.data.page, 'mealIdeas');
  assert.equal(page.data.mealIdeaRows[0].title, '替换后的菜品');
  console.log('meal content loading: passed');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
