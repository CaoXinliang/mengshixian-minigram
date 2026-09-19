const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const addResolvers = [];
const updateResolvers = [];
const addCalls = [];
const updateCalls = [];

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: {}, catalog: {}, content: {}, address: {}, delivery: {}, checkout: {}, orders: {}, refunds: {}, groups: {},
  cart: {
    addItem: async (payload) => { addCalls.push(payload); await new Promise((resolve) => addResolvers.push(resolve)); return { ok: true, data: { item: { _id: 'remote-item-1' } } }; },
    updateItem: async (payload) => { updateCalls.push(payload); await new Promise((resolve) => updateResolvers.push(resolve)); return { ok: true }; }
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = {
  showToast: () => {},
  getStorageSync: () => '',
  getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667, screenHeight: 667, statusBarHeight: 20 })
};

try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function createPage() {
  return Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    _remotePriceBySku: { 'sku-1': { amountCent: 5000, availability: 'available' } },
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
}

function resolveOne(resolvers) {
  const resolve = resolvers.shift();
  if (resolve) resolve();
  else throw new Error('没有待释放的请求');
}

async function run() {
  // 场景一（P1-9）：数量 +1 的写入还在飞行中就勾选/取消勾选，勾选写入必须用执行时刻的最新数量
  const page = createPage();
  page.data.loggedIn = true;
  page.data.cartItems = [{ id: 'product-1', skuId: 'sku-1', selectedSpec: '6袋/件', qty: 1, price: 50, priceText: '¥50', selected: true }];
  page.syncCart(page.data.cartItems);
  const quantityWrite = page.changeQuantity({ currentTarget: { dataset: { id: 'product-1', spec: '6袋/件', delta: 1 } } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(updateCalls.length, 1, '数量写入应立即进入串行队列');
  const selectionWrite = page.toggleCartSelection({ currentTarget: { dataset: { id: 'product-1', skuId: 'sku-1', spec: '6袋/件' } }, detail: { value: [] } });
  assert.equal(page.data.cartItems[0].selected, false, '勾选乐观更新必须立即生效');
  resolveOne(updateResolvers);
  await quantityWrite;
  assert.equal(page.data.cartItems[0].qty, 2, '数量写入完成后本地数量应为 2');
  assert.equal(page.data.cartItems[0].selected, false, '数量写入完成不得回滚勾选状态');
  resolveOne(updateResolvers);
  await selectionWrite;
  assert.equal(updateCalls[1].quantity, 2, '勾选写入必须使用执行时刻的最新数量，而不是点击时刻的过期数量');
  assert.equal(updateCalls[1].selected, false);
  assert.equal(page.data.cartItems[0].qty, 2, '最终本地数量应与服务端一致');

  // 场景二（P1-8）：加购写入飞行中取消勾选，加购完成不得用旧快照回滚勾选状态
  const page2 = createPage();
  page2.data.loggedIn = true;
  page2.data.products = [{ id: 'product-1', name: '测试商品' }];
  page2.data.cartItems = [{ id: 'product-1', skuId: 'sku-1', selectedSpec: '6袋/件', qty: 1, price: 50, priceText: '¥50', selected: true }];
  page2.syncCart(page2.data.cartItems);
  const addWrite = page2.addProduct('product-1', '6袋/件');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(addCalls.length, 1, '加购应立即进入串行队列');
  const selectionWrite2 = page2.toggleCartSelection({ currentTarget: { dataset: { id: 'product-1', skuId: 'sku-1', spec: '6袋/件' } }, detail: { value: [] } });
  assert.equal(page2.data.cartItems[0].selected, false, '取消勾选必须立即生效');
  resolveOne(addResolvers);
  await addWrite;
  assert.equal(page2.data.cartItems[0].selected, false, '加购完成不得用加购前的旧快照回滚勾选状态');
  assert.equal(addCalls[0].selected, true, '加购请求本身仍按加购语义默认选中');
  resolveOne(updateResolvers);
  await selectionWrite2;
  assert.equal(updateCalls[updateCalls.length - 1].selected, false, '勾选写入应把服务端选中态改回用户意图');
  assert.equal(page2.data.cartItems[0].selected, false, '最终本地勾选状态应保持用户意图');
  console.log('cart selection vs queued write test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
