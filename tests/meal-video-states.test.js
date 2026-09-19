const assert = require('assert/strict');
const Module = require('module');
const path = require('path');
const fs = require('fs');

const pagePath = path.resolve(__dirname, '../miniapp/pages/index/index.js');
const baseMeal = require('../miniapp/config/meal-ideas')[0];
const ok = rows => ({ ok: true, data: { rows } });
const mediaRequests = [];
let mediaResponse = async ids => ok(ids.map(id => ({ _id: id, fileId: `cloud://${id}` })));
const services = {
  config: { provider: 'cloudbase', customerMealIdeasEnabled: true },
  content: {
    getMealIdeas: async () => ok([]),
    resolveMedia: async ids => { mediaRequests.push([...ids]); return mediaResponse(ids); }
  },
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

function createPage(meals) {
  const page = Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); },
    triggerPageMotion(patch, callback) { this.setData(patch, callback); }
  });
  page.data.mealIdeas = meals;
  page.data.mealIdeaRows = meals;
  return page;
}

async function run() {
  const playable = { ...baseMeal, id: 'meal-playable', videoMediaId: 'meal-video', videoCoverMediaId: 'meal-video-cover', cover: '/meal-cover.png', linkedProducts: [] };
  const page = createPage([playable]);
  page.openMealIdea({ detail: { id: playable.id } });
  await page._mealVideoPromise;
  assert.deepEqual(mediaRequests.pop().sort(), ['meal-video', 'meal-video-cover'], '详情只能解析菜谱自己的视频和视频封面');
  assert.equal(page.data.mealVideoStatus, 'ready');
  assert.equal(page.data.mealVideoSrc, 'cloud://meal-video');
  assert.equal(page.data.mealVideoCover, 'cloud://meal-video-cover');

  const historical = { ...baseMeal, id: 'meal-historical', cover: '/history.png', linkedProducts: [] };
  page.data.mealIdeas = [historical];
  const requestCount = mediaRequests.length;
  page.openMealIdea({ detail: { id: historical.id } });
  await page._mealVideoPromise;
  assert.equal(page.data.mealVideoStatus, 'missing', '历史缺视频菜谱必须诚实显示缺失状态');
  assert.equal(mediaRequests.length, requestCount, '缺视频时不应请求其他商品或占位视频');

  const failed = { ...playable, id: 'meal-failed' };
  page.data.mealIdeas = [failed];
  mediaResponse = async () => { throw new Error('private media failure'); };
  page.openMealIdea({ detail: { id: failed.id } });
  await page._mealVideoPromise;
  assert.equal(page.data.mealVideoStatus, 'error');
  mediaResponse = async ids => ok(ids.map(id => ({ _id: id, url: `https://media.example/${id}` })));
  await page.retryMealVideo();
  assert.equal(page.data.mealVideoStatus, 'ready', '失败后必须允许重试恢复');

  let finishOld;
  const first = { ...playable, id: 'meal-old', videoMediaId: 'video-old', videoCoverMediaId: '' };
  const second = { ...playable, id: 'meal-new', videoMediaId: 'video-new', videoCoverMediaId: '' };
  page.data.mealIdeas = [first, second];
  mediaResponse = ids => ids[0] === 'video-old'
    ? new Promise(resolve => { finishOld = resolve; })
    : Promise.resolve(ok([{ _id: 'video-new', url: 'https://media.example/new.mp4' }]));
  page.openMealIdea({ detail: { id: first.id } });
  const oldPromise = page._mealVideoPromise;
  page.openMealIdea({ detail: { id: second.id } });
  await page._mealVideoPromise;
  finishOld(ok([{ _id: 'video-old', url: 'https://media.example/old.mp4' }]));
  await oldPromise;
  assert.equal(page.data.selectedMealIdea.id, second.id);
  assert.equal(page.data.mealVideoSrc, 'https://media.example/new.mp4', '切换菜谱后旧媒体回包不得覆盖新菜谱');

  page.handleMealVideoFullscreenChange({ detail: { fullScreen: true } });
  assert.equal(page.data.selectedMealIdea.id, second.id, '进入或退出全屏不得丢失当前菜谱上下文');
  page.handleMealVideoFullscreenChange({ detail: { fullScreen: false } });
  assert.equal(page.data.selectedMealIdea.id, second.id);

  page._mealIdeas = [];
  page.syncMealIdeas([]);
  assert.equal(page.data.selectedMealIdea, null);
  assert.equal(page.data.mealVideoStatus, 'unlisted', '权威集合移除当前菜谱后必须进入下架态');

  const wxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/components/meal-experience-panel/index.wxml'), 'utf8');
  assert.match(wxml, /id="mealRecipeVideo"/);
  assert.match(wxml, /binderror="handleVideoError"/);
  assert.match(wxml, /bindtap="handleRetryVideo"/);
  assert.match(wxml, /该菜谱暂未配置视频/);
  assert.match(wxml, /该菜品已下架/);
  console.log('meal video states: passed');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
