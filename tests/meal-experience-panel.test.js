const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../miniapp');
const pageConfig = JSON.parse(fs.readFileSync(path.join(root, 'pages/index/index.json'), 'utf8'));
const pageWxml = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
const pageWxss = fs.readFileSync(path.join(root, 'pages/index/index.wxss'), 'utf8');
const componentWxml = fs.readFileSync(path.join(root, 'components/meal-experience-panel/index.wxml'), 'utf8');
const componentWxss = fs.readFileSync(path.join(root, 'components/meal-experience-panel/index.wxss'), 'utf8');
const componentPath = path.join(root, 'components/meal-experience-panel/index.js');
const pageSource = fs.readFileSync(path.join(root, 'pages/index/index.js'), 'utf8');

assert.equal(pageConfig.usingComponents['meal-experience-panel'], '/components/meal-experience-panel/index');
assert.match(pageWxml, /<meal-experience-panel\b/u, '主页面必须通过菜谱模块组合列表与详情');
assert.match(pageWxml, /motion-reduced="\{\{motionReduced\}\}"/u, '页面必须把既有减弱动效展示事实传给隔离组件');
assert.ok(!pageWxml.includes('class="meal-video-card"') && !pageWxml.includes('class="meal-grid"'), '主页面不得保留第二套菜谱结构');
assert.doesNotMatch(pageWxss, /\.meal-/u, '主页面不得保留菜谱专属样式；共享头部与按钮基础样式除外');
for (const selector of ['.meal-grid', '.meal-video-card', '.meal-product', '.meal-state']) {
  assert.ok(componentWxss.includes(selector), `菜谱模块必须持有领域样式：${selector}`);
}
assert.match(componentWxss, /\.control-pressed\{opacity:\.72\}/u, '组件隔离后仍须保留既有按压反馈');

let componentDefinition;
global.Component = value => { componentDefinition = value; };
delete require.cache[require.resolve(componentPath)];
try {
  require(componentPath);
} finally {
  delete global.Component;
}
const emitted = [];
const component = { triggerEvent(name, detail) { emitted.push({ name, detail }); } };
componentDefinition.methods.handleSelectScene.call(component, { currentTarget: { dataset: { scene: '火锅暖锅' } } });
componentDefinition.methods.handleShuffle.call(component);
componentDefinition.methods.handleOpenIdea.call(component, { currentTarget: { dataset: { id: 'meal-1' } } });
componentDefinition.methods.handleRetryCollection.call(component);
componentDefinition.methods.handleBack.call(component);
componentDefinition.methods.handleRetryVideo.call(component);
componentDefinition.methods.handleVideoPlay.call(component);
componentDefinition.methods.handleVideoPause.call(component);
componentDefinition.methods.handleVideoWaiting.call(component);
componentDefinition.methods.handleVideoError.call(component);
componentDefinition.methods.handleVideoFullscreen.call(component, { detail: { fullScreen: true } });
componentDefinition.methods.handleMediaError.call(component, { currentTarget: { dataset: { id: 'meal-1', src: '/broken.png' } } });
componentDefinition.methods.handleOpenProduct.call(component, { currentTarget: { dataset: { id: 'product-1' } } });
assert.ok(componentDefinition.properties.motionReduced, '组件必须声明减弱动效展示属性，不得自行复制页面状态');
assert.deepEqual(emitted, [
  { name: 'selectscene', detail: { scene: '火锅暖锅' } },
  { name: 'shuffle', detail: undefined },
  { name: 'openidea', detail: { id: 'meal-1' } },
  { name: 'retrycollection', detail: undefined },
  { name: 'back', detail: undefined },
  { name: 'retryvideo', detail: undefined },
  { name: 'videoplay', detail: undefined },
  { name: 'videopause', detail: undefined },
  { name: 'videowaiting', detail: undefined },
  { name: 'videoerror', detail: undefined },
  { name: 'videofullscreen', detail: { fullScreen: true } },
  { name: 'mediaerror', detail: { id: 'meal-1', src: '/broken.png' } },
  { name: 'openproduct', detail: { id: 'product-1' } }
], '组件必须只发出页面处理器所需的语义事件与 scene/id/src 等必要载荷');
for (const eventName of emitted.map(item => item.name)) {
  assert.ok(pageWxml.includes(`bind:${eventName}=`), `主页面必须接收菜谱语义事件：${eventName}`);
}
assert.ok(!pageWxml.includes('bind:playvideo=') && !pageSource.includes('playMealVideo()'), '播放命令必须留在拥有video节点的组件内');

const originalWx = global.wx;
let createdContext;
let playCalls = 0;
global.wx = {
  createVideoContext(id, scope) {
    createdContext = { id, scope };
    return { play() { playCalls += 1; } };
  }
};
try {
  const playableComponent = { data: { videoSrc: 'cloud://meal-video', videoStatus: 'ready' } };
  componentDefinition.methods.handlePlayVideo.call(playableComponent);
  assert.deepEqual(createdContext, { id: 'mealRecipeVideo', scope: playableComponent }, 'video context必须绑定真实组件实例');
  assert.equal(playCalls, 1, '合法播放意图必须只调用一次play');

  const pausedComponent = { data: { videoSrc: 'cloud://meal-video', videoStatus: 'paused' } };
  componentDefinition.methods.handlePlayVideo.call(pausedComponent);
  assert.deepEqual(createdContext, { id: 'mealRecipeVideo', scope: pausedComponent }, '暂停后续播也必须绑定当前组件实例');
  assert.equal(playCalls, 2, '每次合法续播意图必须只调用一次play');

  for (const data of [
    { videoSrc: '', videoStatus: 'ready' },
    { videoSrc: 'cloud://meal-video', videoStatus: 'loading' },
    { videoSrc: 'cloud://meal-video', videoStatus: 'playing' }
  ]) componentDefinition.methods.handlePlayVideo.call({ data });
  assert.equal(playCalls, 2, '无视频或非ready/paused状态不得调用play');
} finally {
  global.wx = originalWx;
}

assert.match(componentWxml, /wx:if="\{\{mode == 'list'\}\}"/u);
assert.match(componentWxml, /wx:elif="\{\{mode == 'detail'\}\}"/u);
assert.match(componentWxml, /<video\b[^>]*src="\{\{videoSrc\}\}"/u, '菜谱视频必须保留在菜谱详情模块');
assert.match(componentWxml, /binderror="handleMediaError"/u, '菜谱封面错误必须继续带来源转发');
assert.match(componentWxml, /data-id="\{\{item\.id\}\}"/u);

console.log('meal experience panel contract test: passed');
