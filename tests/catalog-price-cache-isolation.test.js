const assert = require('node:assert/strict');
const test = require('node:test');
const Module = require('node:module');
const path = require('node:path');

let activeHarness;
let definition;
const services = {
  config: { provider: 'cloudbase', priceFieldsNeverFallback: true },
  auth: { login: async () => ({ ok: true, data: { user: activeHarness.loginUser } }) },
  catalog: {
    listPrices: (skuIds) => new Promise((resolve, reject) => {
      activeHarness.requests.push({ skuIds, resolve, reject });
    })
  }
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

const business = { _id: 'buyer-b', userType: 'b', businessStatus: 'approved', organizationId: 'org-b', status: 'active' };
const customer = { _id: 'buyer-c', userType: 'c', businessStatus: '', organizationId: '', status: 'active' };
const prices = (amountCent) => ({ ok: true, data: { rows: [{ skuId: 'sku-1', amountCent }] } });

function makePage(user = business) {
  const harness = {
    requests: [], storageReads: [], storageWrites: [], renderedPrices: [],
    storage: { mx_price_cache: { bySku: { 'sku-1': { skuId: 'sku-1', amountCent: 777 } } } }
  };
  activeHarness = harness;
  global.wx = {
    getStorageSync(key) { harness.storageReads.push(key); return harness.storage[key]; },
    setStorageSync(key, value) { harness.storageWrites.push(key); harness.storage[key] = value; },
    removeStorageSync(key) { delete harness.storage[key]; },
    showToast() {}
  };
  const page = Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch, callback) {
      Object.assign(this.data, patch);
      harness.renderedPrices.push(this.data.products.map((product) => product.priceText));
      if (callback) callback.call(this);
    }
  });
  page.data.products = [{
    id: 'product-1', name: '测试商品', category: '海鲜水产', unit: '盒', specLabel: '一盒', specs: ['一盒'],
    skuOptions: [{ id: 'sku-1', label: '一盒', packageUnit: '盒' }]
  }];
  page.applyRemoteIdentity(user);
  return { page, harness };
}

test('same identity shares one pending request and uses the returned price', async () => {
  const { page, harness } = makePage();
  const first = page.loadRemoteCatalogPrices();
  const second = page.loadRemoteCatalogPrices();
  assert.equal(harness.requests.length, 1);
  assert.deepEqual(harness.requests[0].skuIds, ['sku-1']);
  harness.requests[0].resolve(prices(1000));
  assert.equal(await first, true);
  assert.equal(await second, true);
  assert.equal(page.data.products[0].priceText, '¥10.00');
  assert.equal(harness.storageWrites.includes('mx_price_cache'), false);
});

test('old identity response cannot overwrite a new identity or release its pending request', async () => {
  const { page, harness } = makePage();
  const oldRequest = page.loadRemoteCatalogPrices();
  page.applyRemoteIdentity(customer);
  const newRequest = page.loadRemoteCatalogPrices();
  assert.equal(harness.requests.length, 2);
  harness.requests[0].resolve(prices(500));
  assert.equal(await oldRequest, false);
  assert.equal(page.data.products[0].priceUnavailable, true);
  const sameNewRequest = page.loadRemoteCatalogPrices();
  assert.equal(harness.requests.length, 2, 'old request cleanup must not cancel new identity deduplication');
  harness.requests[1].resolve(prices(1200));
  await Promise.all([newRequest, sameNewRequest]);
  assert.equal(page.data.products[0].priceText, '¥12.00');
  assert.equal(harness.renderedPrices.flat().includes('¥5.00'), false);
});

test('logout ignores late prices and clears the legacy persisted price cache', async () => {
  const { page, harness } = makePage();
  const pending = page.loadRemoteCatalogPrices();
  harness.storage.mx_price_cache = { bySku: { 'sku-1': { amountCent: 777 } } };
  page.performLogout({ silent: true });
  harness.requests[0].resolve(prices(500));
  assert.equal(await pending, false);
  assert.equal(page.data.loggedIn, false);
  assert.equal(page.data.priceFallback, '登录后查看价格');
  assert.equal(page.data.products[0].priceUnavailable, true);
  assert.equal(harness.storage.mx_price_cache, undefined);
  assert.equal(harness.renderedPrices.flat().includes('¥5.00'), false);
});

test('new identity neither reads legacy storage nor retains the prior identity memory price on failure', async () => {
  const { page, harness } = makePage();
  const first = page.loadRemoteCatalogPrices();
  harness.requests[0].resolve(prices(500));
  await first;
  assert.equal(page.data.products[0].priceText, '¥5.00');
  harness.storage.mx_price_cache = { bySku: { 'sku-1': { skuId: 'sku-1', amountCent: 777 } } };
  page.applyRemoteIdentity(customer);
  assert.equal(page.data.products[0].priceUnavailable, true, 'the old visible amount clears at identity transition');
  const pending = page.loadRemoteCatalogPrices();
  harness.requests[1].resolve({ ok: false, error: { code: 'NETWORK_ERROR' } });
  assert.equal(await pending, false);
  assert.equal(page.data.products[0].priceUnavailable, true);
  assert.equal(harness.storageReads.includes('mx_price_cache'), false);
  assert.equal(harness.renderedPrices.flat().includes('¥7.77'), false);
});

test('organization or customer type changes invalidate a price for the same user id', async () => {
  const { page, harness } = makePage();
  const first = page.loadRemoteCatalogPrices();
  harness.requests[0].resolve(prices(500));
  await first;
  page.applyRemoteIdentity({ ...business, organizationId: 'org-other' });
  assert.equal(page.data.products[0].priceUnavailable, true);
  const second = page.loadRemoteCatalogPrices();
  page.applyRemoteIdentity({ ...customer, _id: business._id });
  harness.requests[1].resolve(prices(600));
  assert.equal(await second, false);
  assert.equal(page.data.products[0].priceUnavailable, true);
});

test('A to B to A transition does not revive a request from the earlier A session', async () => {
  const { page, harness } = makePage();
  const oldA = page.loadRemoteCatalogPrices();
  page.applyRemoteIdentity(customer);
  page.applyRemoteIdentity(business);
  const newA = page.loadRemoteCatalogPrices();
  harness.requests[1].resolve(prices(900));
  await newA;
  harness.requests[0].resolve(prices(500));
  assert.equal(await oldA, false);
  assert.equal(page.data.products[0].priceText, '¥9.00');
});

test('fresh login discards the previous session price even when the user id is unchanged', async () => {
  const { page, harness } = makePage();
  const previous = page.loadRemoteCatalogPrices();
  harness.requests[0].resolve(prices(500));
  await previous;
  page.data.agreed = true;
  harness.loginUser = { ...business };
  page.loadRemoteAddress = async () => {};
  page.loadRemoteCart = async () => {};
  page.loadRemoteOrders = async () => {};
  page.closeLoginSheet = (callback) => { if (callback) callback(); };
  const login = page.completeLogin({ detail: { errMsg: 'getPhoneNumber:ok' } });
  await Promise.resolve();
  assert.equal(page.data.products[0].priceUnavailable, true);
  harness.requests[1].resolve(prices(1100));
  await login;
  assert.equal(page.data.products[0].priceText, '¥11.00');
});

test('same identity refresh reuses its resolved memory price without another request', async () => {
  const { page, harness } = makePage();
  const first = page.loadRemoteCatalogPrices();
  harness.requests[0].resolve(prices(1000));
  await first;
  page.applyRemoteIdentity({ ...business });
  assert.equal(page.data.products[0].priceText, '¥10.00');
  await page.loadRemoteCatalogPrices();
  assert.equal(harness.requests.length, 1);
  assert.equal(page.data.products[0].priceText, '¥10.00');
});
