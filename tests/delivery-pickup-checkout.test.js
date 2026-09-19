const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const quoteCalls = [];
const createCalls = [];
let failPickupQuote = true;
let pickupUnavailable = false;
const okRows = rows => ({ ok: true, data: { rows } });

const servicesStub = {
  config: { provider: 'cloudbase' },
  health: { get: async () => ({ ok: true, data: { capabilities: { demoOrder: true } } }) },
  address: { list: async () => okRows([]) },
  delivery: { options: async () => ({ ok: true, data: {
    warehouses: [{ _id: 'warehouse-1', name: '南山仓' }, { _id: 'warehouse-2', name: '宝安仓' }],
    areas: [], slots: [],
    pickupSites: [
      { _id: 'pickup-1', name: '科技园自提点', address: '科技园 1 号', regionCode: '440305', warehouseId: 'warehouse-1', openingHours: '09:00-18:00' },
      { _id: 'pickup-2', name: '后海自提点', address: '后海大道 2 号', regionCode: '440305', warehouseId: 'warehouse-1', openingHours: '10:00-20:00' }
    ]
  } }) },
  cart: {
    getAll: async () => okRows([{ _id: 'cart-1', skuId: 'sku-1', quantity: 1, selected: true, sku: { specName: '500g' }, product: { name: '鱼丸' } }]),
    removeItem: async () => ({ ok: true })
  },
  checkout: {
    quote: async (payload) => {
      quoteCalls.push(payload);
      if (pickupUnavailable) return { ok: false, error: { code: 'PICKUP_SITE_NOT_AVAILABLE', message: '自提点已停用' } };
      if (payload.fulfillmentType === 'pickup' && failPickupQuote) return { ok: false, error: { message: '自提报价网络错误' } };
      return { ok: true, data: { quote: { fulfillmentType: payload.fulfillmentType, goodsAmountCent: 1800, freightAmountCent: payload.fulfillmentType === 'pickup' ? 0 : 500, discountAmountCent: 0, payableAmountCent: payload.fulfillmentType === 'pickup' ? 1800 : 2300, items: [{ skuId: 'sku-1', unitPriceCent: 1800, subtotalCent: 1800 }] } } };
    },
    createOrder: async (payload) => { createCalls.push(payload); return { ok: true, data: { order: { _id: 'pickup-order' } } }; }
  },
  auth: { getMe: async () => ({ ok: true, data: { user: { userType: 'c', businessStatus: '' } } }) }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return servicesStub;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => { pageDefinition.value = definition; };
global.wx = { showToast: () => {}, redirectTo: () => {}, navigateTo: () => {} };
try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function makePage() {
  return Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
}

async function tick() { await new Promise(resolve => setImmediate(resolve)); }

async function run() {
  const page = makePage();
  await page.onLoad({ source: 'cart' });
  assert.equal(page.data.quoteState, 'invalid', 'delivery must remain blocked without an address');

  page.selectFulfillmentType({ currentTarget: { dataset: { type: 'pickup' } } });
  await tick();
  assert.equal(page.data.pickupSite.id, 'pickup-1');
  assert.equal(page.data.quoteState, 'error');
  assert.equal(page.data.quoteErrorText, '自提报价网络错误');
  assert.deepEqual(quoteCalls.at(-1), { fulfillmentType: 'pickup', pickupSiteId: 'pickup-1', warehouseId: 'warehouse-1', items: [{ skuId: 'sku-1', quantity: 1 }] }, 'pickup quote must omit address and delivery slot');

  failPickupQuote = false;
  await page.retryQuote();
  assert.equal(page.data.quoteState, 'ready');
  assert.equal(page.data.freightTotal, '0.00');
  assert.equal(page.data.pickupFree, true, 'free pickup copy must be based on the server freight amount');

  page.selectPickupSite({ currentTarget: { dataset: { id: 'pickup-2' } } });
  await tick();
  assert.equal(quoteCalls.at(-1).pickupSiteId, 'pickup-2');

  pickupUnavailable = true;
  await page.loadQuote();
  assert.equal(page.data.pickupSite, null, 'a server-rejected pickup site must be cleared before the user requotes');
  assert.equal(page.data.quoteState, 'invalid');
  assert.equal(page.data.quoteErrorText, '自提点已失效，请重新选择');
  pickupUnavailable = false;
  page.syncPickupSites();
  await page.loadQuote();

  await page.submitOrder();
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].fulfillmentType, 'pickup');
  assert.equal(createCalls[0].pickupSiteId, 'pickup-1', 'after an invalid point is removed, order creation must use the newly selected valid point');
  assert.equal(Object.hasOwn(createCalls[0], 'addressId'), false);
  assert.equal(Object.hasOwn(createCalls[0], 'deliverySlotId'), false);

  const emptyPage = makePage();
  await emptyPage.onLoad({ source: 'cart' });
  emptyPage.data.warehouse = emptyPage.data.warehouses[1];
  emptyPage.data.fulfillmentType = 'pickup';
  emptyPage.syncPickupSites();
  const beforeEmptyQuote = quoteCalls.length;
  await emptyPage.loadQuote();
  assert.equal(emptyPage.data.quoteState, 'invalid');
  assert.equal(emptyPage.data.quoteErrorText, '当前仓库暂无可用自提点');
  assert.equal(quoteCalls.length, beforeEmptyQuote, 'missing pickup sites must block before requesting a quote');

  const wxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.wxml'), 'utf8');
  assert(wxml.includes('冷链配送') && wxml.includes('到店自提'));
  assert(wxml.includes('{{item.address}}') && wxml.includes('营业时间：{{item.openingHours}}'));
  console.log('delivery pickup checkout test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
