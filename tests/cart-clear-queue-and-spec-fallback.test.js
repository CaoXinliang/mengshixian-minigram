const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const removeResolvers = [];
const removeCalls = [];
const addItemCalls = [];
const toasts = [];
let showModalOptions = null;

const servicesStub = {
  config: { provider: 'cloudbase', cloudFunctionName: 'api', cloudEnvId: 'test-env', priceFieldsNeverFallback: true, motionEnabled: true },
  auth: {}, content: {}, address: {}, delivery: {}, checkout: {}, orders: {}, refunds: {}, groups: {},
  catalog: {
    getProduct: async () => ({ ok: true, data: { skus: [{ _id: 'sku-remote', specName: '远程规格' }] } })
  },
  cart: {
    addItem: async (payload) => { addItemCalls.push(payload); return { ok: true, data: { item: { _id: 'remote-item-' + addItemCalls.length } } }; },
    removeItem: async (remoteId) => { removeCalls.push(remoteId); await new Promise((resolve) => removeResolvers.push(resolve)); return { ok: true }; }
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../services' || request === '../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};

global.Page = (definition) => { pageDefinition.value = definition; };
global.wx = {
  showToast: (options) => { toasts.push(options && options.title); },
  getStorageSync: () => '',
  getSystemInfoSync: () => ({ windowWidth: 375, windowHeight: 667, screenHeight: 667, statusBarHeight: 20 }),
  showModal: (options) => { showModalOptions = options; }
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
    setData(patch, callback) {
      Object.assign(this.data, patch);
      if (callback) callback.call(this);
    }
  });
}

function resolveOne(resolvers) { const resolve = resolvers.shift(); if (resolve) resolve(); }

async function run() {
  // 场景一（P1-11）：多规格商品的请求规格在最新目录中不存在时，必须明确拒绝而不是静默换成其他规格
  const page = createPage();
  page.data.products = [{ id: 'product-multi', name: '多规格商品', skuOptions: [{ label: '规格A', id: 'sku-a' }, { label: '规格B', id: 'sku-b' }] }];
  await page.applyAddProduct('product-multi', '不存在的规格');
  assert.equal(addItemCalls.length, 0, '规格不存在时不得调用加购接口');
  assert.equal(toasts[toasts.length - 1], '所选规格暂不可用，请重新选择', '应提示规格暂不可用');

  // 单规格商品允许缺省回退，且购物车记录的规格必须与真实 SKU 对齐
  page.data.products.push({ id: 'product-single', name: '单规格商品', skuOptions: [{ label: '默认规格', id: 'sku-single' }] });
  await page.applyAddProduct('product-single', '一个过期文案');
  assert.equal(addItemCalls.length, 1, '单规格商品仍应可以加购');
  assert.equal(addItemCalls[0].skuId, 'sku-single', '单规格回退必须使用唯一真实 SKU');
  assert.equal(page.data.cartItems[page.data.cartItems.length - 1].selectedSpec, '默认规格', '购物车记录的规格必须与真实 SKU 对齐');

  // 场景二（P1-10）：清空购物车必须排队执行，不得与飞行中的写入交叉
  const cartPage = createPage();
  cartPage.data.cartItems = [
    { id: 'product-1', skuId: 'sku-1', selectedSpec: '6袋/件', qty: 2, price: 50, priceText: '¥50', selected: true, remoteCartItemId: 'remote-1' },
    { id: 'product-2', skuId: 'sku-2', selectedSpec: '1箱', qty: 1, price: 30, priceText: '¥30', selected: true, remoteCartItemId: 'remote-2' }
  ];
  cartPage.syncCart(cartPage.data.cartItems);
  cartPage.clearCart();
  assert.equal(typeof showModalOptions.success, 'function', '清空购物车应弹出确认框');
  showModalOptions.success({ confirm: true });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(removeCalls.length, 2, '清空应进入串行队列后统一删除服务端条目');
  assert.equal(cartPage.data.cartItems.length, 2, '删除完成前不得提前清空本地购物车');
  resolveOne(removeResolvers);
  resolveOne(removeResolvers);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(removeCalls, ['remote-1', 'remote-2'], '清空应删除全部服务端条目');
  assert.equal(cartPage.data.cartItems.length, 0, '清空完成后本地购物车应为空');
  assert.equal(cartPage.data.cartItems.length, 0, '清空完成后本地购物车应为空');
  console.log('cart clear queue and spec fallback test: passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
