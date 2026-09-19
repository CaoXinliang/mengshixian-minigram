const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const holder = {};
let quoteCount = 0;
let createErrorCode = 'QUOTE_CHANGED';
const services = {
  address: {}, cart: { removeItem: async () => ({ ok: true }) }, delivery: {}, bundles: {}, groups: {},
  auth: { getMe: async () => ({ ok: true, data: { user: { userType: 'c' } } }) },
  orders: { resolveCreate: async () => ({ ok: true, data: { found: false, order: null } }) },
  checkout: {
    createOrder: async () => ({ ok: false, error: { code: createErrorCode, message: createErrorCode === 'QUOTE_CHANGED' ? '商品价格已变化' : '询价报价已失效' } }),
    quote: async () => {
      quoteCount += 1;
      return { ok: true, data: { quote: { goodsAmountCent: 2100, freightAmountCent: 300, discountAmountCent: 0, payableAmountCent: 2400, items: [{ skuId: 'sku-1', unitPriceCent: 2100, subtotalCent: 2100 }] } } };
    }
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services/index' || request === '../../../services') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => { holder.value = definition; };
const toasts = [];
global.wx = { showToast: payload => toasts.push(payload), redirectTo: () => {}, showModal: () => {} };
try { require(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.js')); } finally { Module._load = originalLoad; delete global.Page; }

async function run() {
  const page = Object.assign({}, holder.value, {
    data: JSON.parse(JSON.stringify(holder.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); },
    syncDeliverySlots() { return this.data.deliverySlot; },
    syncPickupSites() { return this.data.pickupSite; }
  });
  page.data.address = { id: 'address-1', regionCode: 'r1' };
  page.data.warehouse = { id: 'warehouse-1' };
  page.data.deliveryAreas = [{ _id: 'area-1', regionCodes: ['r1'], warehouseIds: ['warehouse-1'] }];
  page.data.cartItems = [{ id: 'cart-1', skuId: 'sku-1', qty: 1 }];
  page.data.quoteState = 'ready';
  page.data.paymentCapabilities = { demoOrder: true };
  await page.submitOrder();
  assert.equal(quoteCount, 1, 'a quote change during order creation must trigger a fresh server quote');
  assert.equal(page.data.quoteState, 'ready');
  assert.equal(page.data.orderTotal, '24.00');
  assert.equal(page.data.orderSubmitState, 'idle');
  assert.equal(toasts.at(-1).title, '订单金额已更新，请确认后重新提交');

  createErrorCode = 'INQUIRY_QUOTE_CHANGED';
  page.data.acceptedQuoteToken = 'accepted-token';
  page.data.quoteState = 'ready';
  const quoteCountBeforeInquiryFailure = quoteCount;
  await page.submitOrder();
  assert.equal(quoteCount, quoteCountBeforeInquiryFailure, 'invalid inquiry tokens must not silently downgrade to an ordinary quote');
  assert.equal(page.data.acceptedQuoteToken, '');
  assert.equal(page.data.inquiryQuoteInvalid, true);
  assert.equal(page.data.quoteState, 'invalid');
  assert.equal(page.data.orderSubmitState, 'error');
  console.log('checkout create requote test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
