const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const collection = require('../miniapp/services/collection');

const source = fs.readFileSync(path.join(__dirname, '../web-preview/app.js'), 'utf8');

async function flush(turns = 8) { for (let index = 0; index < turns; index += 1) await new Promise(resolve => setImmediate(resolve)); }

async function boot() {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '', dataset: {}, disabled: false, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, addEventListener() {}, setAttribute() {}, querySelector: child => node(`${selector} ${child}`), querySelectorAll: () => [] });
    return nodes.get(selector);
  };
  const calls = { cart: [], quote: [], create: [], remove: [], accept: [] };
  let createAttempt = 0; let acceptAttempt = 0; const control = { heldCreate: null };
  const product = { _id: 'p1', name: '真实商品', categoryName: '冷冻', skus: [{ _id: 'sku-main', specName: '整箱', packageUnit: '10袋/箱', minOrderQuantity: 10, orderMultiple: 10 }, { _id: 'sku-other', specName: '小箱', packageUnit: '5袋/箱' }] };
  const cartRows = [
    { _id: 'cart-main', skuId: 'sku-main', quantity: 20, selected: true, product, sku: product.skus[0], unavailable: false },
    { _id: 'cart-other', skuId: 'sku-other', quantity: 5, selected: false, product, sku: product.skus[1], unavailable: false },
    { _id: 'cart-dead', skuId: 'sku-dead', quantity: 1, selected: true, product: null, sku: null, unavailable: true }
  ];
  const api = {
    config: { provider: 'cloudbase' }, getSessionToken: () => '',
    catalog: { async listProducts() { return { ok: true, data: { rows: [product] } }; }, async listCategories() { return { ok: true, data: { rows: [] } }; }, async listPrices(ids) { return { ok: true, data: { rows: ids.map(skuId => ({ skuId, amountCent: skuId === 'sku-main' ? 1200 : 1500 })) } }; } },
    content: { async getBanners() { return { ok: true, data: { rows: [] } }; }, async getHomeSections() { return { ok: true, data: { rows: [] } }; }, async resolveMedia() { return { ok: true, data: { rows: [] } }; } },
    cart: { async get(payload) { calls.cart.push(payload); return { ok: true, data: { rows: cartRows, total: cartRows.length, page: 1, pageSize: 100 } }; }, async updateItem(payload) { calls.cart.push(payload); return { ok: true, data: { item: { _id: 'cart-main', ...payload } } }; }, async removeItem(id) { calls.remove.push(id); return { ok: true, data: { id, removed: true } }; } },
    address: { async list() { return { ok: true, data: { rows: [{ _id: 'address-1', name: '王女士', phoneMasked: '138****0000', regionCode: 'region-1', detail: '真实地址', isDefault: true }], total: 1, page: 1, pageSize: 100 } }; } },
    delivery: { async options() { return { ok: true, data: { warehouses: [{ _id: 'warehouse-1', name: '一号仓' }], areas: [{ _id: 'area-1', name: '一区', regionCodes: ['region-1'], warehouseIds: ['warehouse-1'] }], slots: [{ _id: 'slot-1', name: '下午', deliveryAreaId: 'area-1', warehouseId: 'warehouse-1' }], pickupSites: [{ _id: 'pickup-1', name: '门店', address: '门店地址', warehouseId: 'warehouse-1', regionCode: 'region-1' }] } }; } },
    coupons: { async list() { return { ok: true, data: { rows: [{ _id: 'coupon-1', status: 'available', snapshot: { name: '测试券' } }], total: 1, page: 1, pageSize: 100 } }; } },
    checkout: {
      async quote(payload) { calls.quote.push(structuredClone(payload)); return { ok: true, data: { quote: { fulfillmentType: payload.fulfillmentType, items: payload.items.map(item => ({ ...item, productNameSnapshot: '真实商品', unitPriceCent: 1200 })), goodsAmountCent: 24000, discountAmountCent: payload.couponId ? 1000 : 0, freightAmountCent: payload.fulfillmentType === 'pickup' ? 0 : 1200, payableAmountCent: payload.fulfillmentType === 'pickup' ? 23000 : 24200 } } }; },
      async createOrder(payload) { calls.create.push(structuredClone(payload)); if (control.heldCreate) return control.heldCreate; createAttempt += 1; if (createAttempt === 1) return { ok: false, error: { code: 'REQUEST_TIMEOUT', message: '请求超时' } }; return { ok: true, data: { order: { _id: 'order-1', orderNo: 'MSX001' }, idempotent: true } }; }
    },
    orders: { async list() { return { ok: true, data: { rows: [], total: 0, page: 1, pageSize: 100 } }; } },
    inquiries: { async accept(payload) { calls.accept.push(structuredClone(payload)); acceptAttempt += 1; if (acceptAttempt === 1) return { ok: false, error: { code: 'REQUEST_TIMEOUT', message: '请求超时' } }; return { ok: true, data: { addedItems: [], invalidItems: [], acceptedQuoteToken: 'accepted-token-1' } }; } }
  };
  const context = vm.createContext({ structuredClone, document: { querySelector: node, querySelectorAll: () => [], addEventListener() {}, body: { contains() { return true; } } }, window: { MengshixianApi: api, MengshixianCollection: collection, scrollTo() {}, matchMedia: () => ({ matches: true }), confirm: () => true }, setInterval() {}, setTimeout() {}, clearTimeout() {}, console });
  vm.runInContext(source, context); await flush();
  vm.runInContext("state.user.loggedIn=true; state.remoteUser={userType:'b',businessStatus:'approved'}; state.role='B'", context);
  await vm.runInContext("loadRemoteCatalogPrices(['sku-main','sku-other'])", context);
  return { context, calls, nodes, control };
}

(async () => {
  const { context, calls, nodes, control } = await boot();
  await vm.runInContext('loadRemoteCommerce()', context);
  await vm.runInContext('loadCheckoutCoupons()', context);
  assert.equal(calls.cart[0].page, 1, 'cart.list must be paged from the service');
  assert.equal(vm.runInContext('state.remoteCheckoutAddress._id', context), 'address-1');
  assert.equal(vm.runInContext('state.remoteWarehouseId', context), 'warehouse-1');
  assert.equal(vm.runInContext('state.remoteDeliverySlotId', context), 'slot-1');

  await vm.runInContext("state.utilityKind='checkout'; state.remoteCouponId='coupon-1'; state.remoteAcceptedQuoteToken='accepted-token-1'; refreshRemoteCheckoutQuote()", context);
  assert.deepEqual(calls.quote.at(-1), { items: [{ skuId: 'sku-main', quantity: 20 }], channel: 'web', fulfillmentType: 'delivery', warehouseId: 'warehouse-1', addressId: 'address-1', deliverySlotId: 'slot-1', acceptedQuoteToken: 'accepted-token-1', couponId: 'coupon-1' });
  assert(nodes.get('#utilityView').innerHTML.includes('应付 ¥242'));

  vm.runInContext("state.remoteFulfillmentType='pickup'; state.remotePickupSiteId='pickup-1'; normalizeRemoteSelections(); invalidateRemoteQuote();", context);
  await vm.runInContext('refreshRemoteCheckoutQuote()', context);
  assert.equal(calls.quote.at(-1).pickupSiteId, 'pickup-1');
  assert.equal(calls.quote.at(-1).warehouseId, 'warehouse-1');
  assert.equal('addressId' in calls.quote.at(-1), false, 'pickup quote must not leak a delivery address id');
  assert.equal('deliverySlotId' in calls.quote.at(-1), false, 'pickup quote must not include a delivery slot');

  let releaseHeld; control.heldCreate = new Promise(resolve => { releaseHeld = resolve; });
  const heldSubmit = vm.runInContext('submitRemoteOrder()', context); const duplicateSubmit = vm.runInContext('submitRemoteOrder()', context); await flush();
  assert.equal(calls.create.length, 1, 'duplicate click while submitting must issue only one create request');
  releaseHeld({ ok: false, error: { code: 'REQUEST_TIMEOUT', message: '请求超时' } }); await Promise.all([heldSubmit, duplicateSubmit]); control.heldCreate = null;
  assert.equal(await vm.runInContext('submitRemoteOrder()', context), false, 'timeout must not be reported as order success');
  const retryKey = calls.create[0].idempotencyKey;
  assert(retryKey && calls.create[1].acceptedQuoteToken === 'accepted-token-1' && calls.create[1].couponId === 'coupon-1');
  assert.equal(await vm.runInContext('submitRemoteOrder()', context), true);
  assert.equal(calls.create[2].idempotencyKey, retryKey, 'safe retry must reuse the same order idempotency key');
  await flush();
  assert.deepEqual(calls.remove, ['cart-main'], 'successful order must clear only submitted selected cart rows');
  assert.deepEqual(vm.runInContext('state.remoteCartRows.map(item=>item._id)', context), ['cart-other', 'cart-dead']);
  assert.equal(vm.runInContext('state.remoteCouponId', context), '', 'successful order must clear the consumed coupon selection');

  vm.runInContext("state.remoteCartRows=[]; state.inquiryAcceptKeys={};", context);
  assert.equal(await vm.runInContext("acceptRemoteInquiryQuote({inquiryId:'inq-1',quoteId:'quote-1',version:2,destination:'cart'})", context), false);
  const acceptKey = calls.accept[0].idempotencyKey;
  assert.equal(await vm.runInContext("acceptRemoteInquiryQuote({inquiryId:'inq-1',quoteId:'quote-1',version:2,destination:'cart'})", context), true);
  assert.equal(calls.accept[1].idempotencyKey, acceptKey, 'inquiry acceptance retry must reuse its idempotency key');
  assert.equal(vm.runInContext('state.remoteAcceptedQuoteToken', context), 'accepted-token-1');

  vm.runInContext("state.remoteCheckoutStatus='error'; state.remoteCheckoutQuote=null", context);
  const before = calls.create.length;
  assert.equal(await vm.runInContext('submitRemoteOrder()', context), false);
  assert.equal(calls.create.length, before, 'missing or failed quote must block order creation');
  console.log('web trade runtime: passed (remote cart/address/delivery, quote, promotions, idempotency and scoped cleanup)');
})().catch(error => { console.error(error); process.exitCode = 1; });
