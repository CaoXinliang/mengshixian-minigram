const assert = require('node:assert/strict');
const test = require('node:test');
const Module = require('node:module');
const path = require('node:path');

let definition;
let harness;
const stages = ['login', 'prices', 'address', 'cart', 'orders'];
const oldUser = { _id: 'old-user', userType: 'b', businessStatus: 'approved', organizationId: 'old-org', status: 'active' };
const newUser = { _id: 'new-user', userType: 'c', businessStatus: '', organizationId: '', status: 'active' };
const responseRows = (rows) => ({ ok: true, data: { rows } });
async function response(stage, value) {
  harness.calls.push(stage);
  if (stage === harness.stage && !harness.gated) {
    harness.gated = true;
    harness.entered();
    await harness.gate;
  }
  return value;
}
const services = {
  config: { provider: 'cloudbase', priceFieldsNeverFallback: true },
  auth: { login: () => response('login', { ok: true, data: { user: harness.user } }) },
  catalog: { listPrices: () => response('prices', responseRows([{ skuId: 'sku-1', amountCent: 1000 }])) },
  address: { list: () => response('address', responseRows([{ _id: `address-${harness.user._id}`, name: '测试收货人', phoneMasked: '138****0000', detail: '测试地址', regionCode: 'test' }])) },
  cart: { getAll: () => response('cart', responseRows([{ _id: `cart-${harness.user._id}`, product: { _id: 'product-1', name: '测试商品', coverMediaId: harness.useCover ? 'cover-1' : '' }, sku: { packageUnit: '盒', specName: '一盒' }, skuId: 'sku-1', quantity: 1 }])) },
  orders: { list: () => response('orders', responseRows([{ _id: `order-${harness.user._id}`, orderNo: 'test-order-no', totalAmount: 1000, status: 'pending_payment', itemsSnapshot: [] }])) }
};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = (value) => { definition = value; };
try {
  require(path.resolve(__dirname, '../miniapp/pages/index/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function makePage(stage) {
  const state = { stage, user: oldUser, storage: {}, toasts: [], calls: [], deferredDismissal: null };
  state.reached = new Promise((resolve) => { state.entered = resolve; });
  state.gate = new Promise((resolve) => { state.release = resolve; });
  harness = state;
  global.wx = {
    getStorageSync: (key) => state.storage[key],
    setStorageSync: (key, value) => { state.storage[key] = value; },
    removeStorageSync: (key) => { delete state.storage[key]; },
    showToast: (payload) => state.toasts.push(payload)
  };
  const page = Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); },
    dismissLogin(callback) { if (state.delayDismissal) state.deferredDismissal = callback; else if (callback) callback(); }
  });
  page.data.agreed = true;
  page.data.products = [{ id: 'product-1', category: '其他冻品', name: '测试商品', unit: '盒', specLabel: '一盒', specs: ['一盒'], skuOptions: [{ id: 'sku-1', label: '一盒', packageUnit: '盒' }] }];
  return { page, state };
}

for (const stage of stages) {
  test(`logout while awaiting ${stage} cannot restore login or run later stages`, async () => {
    const { page, state } = makePage(stage);
    const pending = page.completeLogin();
    await state.reached;
    page.performLogout({ silent: true });
    state.release();
    await pending;
    assert.equal(page.data.loggedIn, false, `${stage}: late completion must not log the user back in`);
    assert.equal(page._remoteUser, null);
    assert.equal(Boolean(page.data.address.id), false, 'late address data must stay cleared after logout');
    assert.deepEqual(page.data.cartItems, [], 'late cart data must stay cleared after logout');
    assert.deepEqual(page.data.orderRows, [], 'late order data must stay cleared after logout');
    assert.equal(state.storage.mengshixian_login_agreed, undefined);
    assert.deepEqual(state.calls, stages.slice(0, stages.indexOf(stage) + 1));
    assert.equal(state.toasts.some((item) => item.title === '登录成功'), false);
  });
}

test('an older login completion cannot overwrite or consume a newer login session', async () => {
  const { page, state } = makePage('login');
  const previous = page.completeLogin();
  await state.reached;
  state.user = newUser;
  await page.completeLogin();
  assert.equal(page._remoteUser._id, newUser._id);
  state.release();
  await previous;
  assert.equal(page._remoteUser._id, newUser._id);
  assert.equal(page.data.userType, 'c');
  assert.equal(state.toasts.filter((item) => item.title === '登录成功').length, 1);
});

for (const stage of ['address', 'cart', 'orders']) {
  test(`new login data wins against an older ${stage} response`, async () => {
    const { page, state } = makePage(stage);
    const previous = page.completeLogin();
    await state.reached;
    state.user = newUser;
    await page.completeLogin();
    state.release();
    await previous;
    assert.equal(page._remoteUser._id, newUser._id);
    assert.equal(page.data.address.id, `address-${newUser._id}`);
    assert.equal(page.data.cartItems[0].remoteCartItemId, `cart-${newUser._id}`);
    assert.equal(page.data.orderRows[0].id, `order-${newUser._id}`);
  });
}

test('logout while waiting for a cart write stops the queued read', async () => {
  const { page, state } = makePage('unused');
  page.applyRemoteIdentity(oldUser);
  page._cartWriteQueue = state.gate;
  const pending = page.loadRemoteCart();
  page.performLogout({ silent: true });
  state.release();
  await pending;
  assert.deepEqual(state.calls, [], 'an obsolete loader must not issue a cart query for the next session');
  assert.deepEqual(page.data.cartItems, []);
});

for (const action of ['logout', 'new-login']) {
  test(`cart media resolution cannot repopulate the old cart after ${action}`, async () => {
    const { page, state } = makePage('cartMedia');
    state.useCover = true;
    page.applyRemoteIdentity(oldUser);
    page.resolveMediaFileMap = (ids) => response('cartMedia', { [ids[0]]: '/test-cover.png' });
    const previous = page.loadRemoteCart();
    await state.reached;
    if (action === 'logout') page.performLogout({ silent: true });
    else {
      state.user = newUser;
      await page.completeLogin();
    }
    state.release();
    await previous;
    if (action === 'logout') assert.deepEqual(page.data.cartItems, []);
    else assert.equal(page.data.cartItems[0].remoteCartItemId, `cart-${newUser._id}`);
  });
}

test('a delayed login-sheet callback does not navigate after logout', async () => {
  const { page, state } = makePage('unused');
  state.delayDismissal = true;
  let navigations = 0;
  page.openUtility = () => { navigations += 1; };
  page._loginContinuation = { type: 'orders' };
  await page.completeLogin();
  assert.equal(page.data.loggedIn, true);
  page.performLogout({ silent: true });
  state.deferredDismissal();
  assert.equal(page.data.loggedIn, false);
  assert.equal(navigations, 0);
  assert.equal(state.toasts.some((item) => item.title === '登录成功'), false);
});
