const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const pagePath = path.resolve(__dirname, '../miniapp/pages/index/index.js');
const wxmlPath = path.resolve(__dirname, '../miniapp/pages/index/index.wxml');
const mealIdeas = require(path.resolve(__dirname, '../miniapp/config/meal-ideas.js'));

function loadPage(customerMealIdeasEnabled) {
  const originalLoad = Module._load;
  const holder = {};
  const services = {
    config: { provider: 'cloudbase', customerMealIdeasEnabled },
    auth: {}, catalog: {}, content: {}, address: {}, cart: {}, delivery: {}, checkout: {}, orders: {}, refunds: {}, groups: {}, favorites: {}, reviews: {}
  };
  Module._load = function (request, parent, isMain) {
    if (request === '../../services/index') return services;
    return originalLoad.call(this, request, parent, isMain);
  };
  global.Page = definition => { holder.definition = definition; };
  delete require.cache[pagePath];
  try {
    require(pagePath);
  } finally {
    Module._load = originalLoad;
    delete global.Page;
  }
  return Object.assign({}, holder.definition, {
    data: JSON.parse(JSON.stringify(holder.definition.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
}

const navigations = [];
global.wx = {
  navigateTo: options => navigations.push(options.url),
  showToast: () => {}
};

try {
  assert.equal(mealIdeas.length, 10, 'C 端首批菜品必须固定为十个');
  ['佛跳墙', '盐焗虾', '关东煮'].forEach(title => assert(mealIdeas.some(item => item.title === title)));
  assert(mealIdeas.every(item => item.source === 'ai_generated' && item.temporary === true), '预置内容必须标明 AI 临时来源');

  const customerPage = loadPage(true);
  customerPage.switchTab({ currentTarget: { dataset: { tab: 'frequent' } } });
  assert.equal(customerPage.data.page, 'mealIdeas');
  assert.equal(customerPage.data.activeTab, 'frequent');
  assert.equal(customerPage.data.shortcutLabel, '吃什么');
  assert.equal(customerPage.data.loginMounted, false, 'C 端浏览吃什么不应强制登录');
  assert.equal(navigations.length, 0);

  customerPage.syncMealIdeas([]);
  assert.equal(customerPage.data.mealIdeaRows.length, 4, '吃什么列表每批必须固定展示四道菜');
  const firstBatchIds = customerPage.data.mealIdeaRows.map(item => item.id);
  customerPage.shuffleMealIdeas();
  const shuffledBatchIds = customerPage.data.mealIdeaRows.map(item => item.id);
  assert.notDeepEqual(shuffledBatchIds, firstBatchIds, '换一批必须切换到不同的菜品组合');
  const cursorAfterShuffle = customerPage.data.mealBatchCursor;
  customerPage.syncMealIdeas([]);
  assert.equal(customerPage.data.mealBatchCursor, cursorAfterShuffle, '商品数据同步后必须保留换批游标');
  assert.deepEqual(customerPage.data.mealIdeaRows.map(item => item.id), shuffledBatchIds, '商品数据同步后不得把当前批次重置为首批');

  customerPage.syncMealIdeas([
    { id: 'lobster', name: '波士顿龙虾', img: '/assets/products/lobster.png' },
    { id: 'white-prawn', name: '南美白对虾', img: '/assets/products/white-prawn.png' },
    { id: 'abalone', name: '鲍鱼', img: '/assets/products/abalone.png' },
    { id: 'prepared-buddha', name: '参福连吉品佛跳墙', img: '/assets/products/prepared-buddha.png' },
    { id: 'basa-fillet', name: '巴沙鱼柳（纯干）', img: '/assets/products/basa.png' },
    { id: 'pineapple-bun', name: '菠萝包', img: '/assets/products/bun.png' },
    { id: 'flower-squid', name: '雕花鱿鱼', img: '/assets/products/squid.png' }
  ]);
  const saltBakedPrawn = customerPage.data.mealIdeas.find(item => item.id === 'salt-baked-prawn');
  assert(saltBakedPrawn, '盐焗虾菜品必须存在');
  assert(saltBakedPrawn.linkedProducts.some(item => item.id === 'white-prawn'), '盐焗虾必须能匹配白对虾商品');
  assert(!saltBakedPrawn.linkedProducts.some(item => item.id === 'lobster'), '盐焗虾不得因名称包含“虾”而误匹配波士顿龙虾');
  const buddhaJumpsWall = customerPage.data.mealIdeas.find(item => item.id === 'fo-tiao-qiang');
  assert.equal(buddhaJumpsWall.linkedProducts[0].id, 'prepared-buddha', '完整菜名商品应排在通用原料前面');
  assert.equal(buddhaJumpsWall.cover, buddhaJumpsWall.coverFallback, '相关原料图不得冒充成品菜图');
  assert.equal(buddhaJumpsWall.coverLabel, 'AI 临时示意');
  assert(customerPage.data.mealIdeas.find(item => item.id === 'pickled-fish').linkedProducts.some(item => item.id === 'basa-fillet'), '酸菜鱼应能关联实际在售鱼柳');
  assert(customerPage.data.mealIdeas.find(item => item.id === 'dim-sum-breakfast').linkedProducts.some(item => item.id === 'pineapple-bun'), '港式早茶应能关联实际在售点心');
  assert(customerPage.data.mealIdeas.find(item => item.id === 'spicy-squid').linkedProducts.some(item => item.id === 'flower-squid'), '香辣鱿鱼花应能关联实际在售鱿鱼商品');

  customerPage.data.quantityPickerVisible = true;
  customerPage.data.quantityPickerProduct = { id: 'stale-picker' };
  customerPage.data.quantityPickerSpec = '残留规格';
  customerPage.data.quantityPickerQty = 8;
  customerPage.switchTab({ currentTarget: { dataset: { tab: 'frequent' } } });
  assert.equal(customerPage.data.page, 'mealIdeas');
  assert.equal(customerPage.data.quantityPickerVisible, false, '切入吃什么时必须关闭残留数量弹层');
  assert.equal(customerPage.data.quantityPickerProduct, null);
  assert.equal(customerPage.data.quantityPickerSpec, '');
  assert.equal(customerPage.data.quantityPickerQty, 1);

  customerPage.selectMealScene({ currentTarget: { dataset: { scene: '火锅暖锅' } } });
  assert(customerPage.data.mealIdeaRows.length > 0);
  assert(customerPage.data.mealIdeaRows.every(item => item.scene === '火锅暖锅'));
  if (customerPage._pageMotionTimer) clearTimeout(customerPage._pageMotionTimer);

  const businessPage = loadPage(true);
  businessPage.data.loggedIn = true;
  businessPage.data.isApprovedBusiness = true;
  businessPage.switchTab({ currentTarget: { dataset: { tab: 'frequent' } } });
  assert.equal(navigations.pop(), '/package-business/pages/frequent/index');
  assert.notEqual(businessPage.data.page, 'mealIdeas');

  const rollbackPage = loadPage(false);
  const navigationCountBeforeRollback = navigations.length;
  rollbackPage.switchTab({ currentTarget: { dataset: { tab: 'frequent' } } });
  assert.equal(rollbackPage.data.page, 'frequent', '关闭功能开关后普通用户应进入内部常用清单');
  assert.equal(rollbackPage.data.activeTab, 'frequent');
  assert.equal(rollbackPage.data.loginMounted, false, '内部常用清单不应误触发企业分包登录门槛');
  assert.equal(navigations.length, navigationCountBeforeRollback, '普通用户不得跳转到 B 端常购清单分包');
  assert.equal(rollbackPage.data.shortcutLabel, '常用清单');

  const wxml = fs.readFileSync(wxmlPath, 'utf8');
  assert(wxml.includes('{{shortcutLabel}}') && wxml.includes('{{shortcutToolLabel}}') && wxml.includes('{{shortcutIcon}}'), '导航栏与我的页入口必须随 B/C 身份切换');
  assert(wxml.includes('cloudModeEnabled && isApprovedBusiness') && !wxml.includes("userType == 'b' && businessStatus == 'approved'"), '企业采购中心入口必须复用完整合法 B 身份状态');
  assert((wxml.match(/cloudModeEnabled && canApplyBusiness/g) || []).length === 2 && !wxml.includes("userType != 'b' && businessStatus != 'pending'"), '企业申请入口和表单必须复用统一的可申请身份状态');
  assert(wxml.includes("page == 'mealIdeas'") && wxml.includes("page == 'mealIdea'"), '吃什么列表与搭配详情必须都有真实页面状态');
  assert(wxml.includes('class="meal-scene-filter"') && wxml.includes('按用餐场景筛选') && !wxml.includes('class="meal-scene-scroll"'), '场景筛选必须完整展示，不能用右侧截断的横向滚动条');
  assert(wxml.includes('<button catchtap="openMealIdea" data-id="{{item.id}}">查看搭配</button>'), '菜谱卡按钮本身必须可以点击，不能只依赖整张卡片冒泡');
  assert(wxml.includes('<button catchtap="openProduct" data-id="{{item.id}}">查看商品</button>'), '关联商品按钮本身必须可以点击，不能只依赖外层容器冒泡');
  console.log('customer meal ideas and B/C navigation test: passed');
} finally {
  delete global.wx;
  delete require.cache[pagePath];
}
