const assert = require('assert/strict');
const fs = require('fs');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const holder = {};
const calls = { cancel: [], confirm: [], pay: [] };
let getMode = 'error';
const order = { _id: 'order-1', orderNo: 'M001', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'wechat', fulfillmentType: 'delivery', addressSnapshot: { name: '张三', phoneMasked: '138****0000', detail: '科技园 1 号' }, deliverySlotSnapshot: { name: '明日上午' }, pricingSnapshot: { goodsAmountCent: 3200 }, freightSnapshot: { amountCent: 500 }, totalAmountCent: 3700, createdAt: '2026-09-12T08:00:00.000Z', updatedAt: '2026-09-12T10:00:00.000Z' };
const services = {
  orders: {
    get: async () => getMode === 'error' ? { ok: false, error: { code: 'REQUEST_FAILED', message: '订单网络错误' } } : getMode === 'empty' ? { ok: false, error: { code: 'ORDER_NOT_FOUND', message: '订单不存在' } } : { ok: true, data: { order, items: [{ _id: 'item-1', skuId: 'sku-1', productNameSnapshot: '鱼丸', specSnapshot: '500g', quantity: 2, unitPriceCent: 1600, subtotalCent: 3200 }] } },
    cancel: async payload => { calls.cancel.push(payload); return { ok: true }; },
    confirm: async payload => { calls.confirm.push(payload); return { ok: true }; }
  },
  checkout: { preparePayment: async payload => { calls.pay.push(payload); return { ok: false, error: { code: 'PAYMENT_NOT_CONFIGURED', message: '微信支付预下单尚未配置。' } }; } }
};
Module._load = function (request, parent, isMain) {
  if (request === '../../../services/index' || request === '../../../services') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => { holder.value = definition; };
const toasts = [];
const navs = [];
global.wx = { showToast: payload => toasts.push(payload), showModal: payload => payload.success({ confirm: true }), navigateTo: payload => navs.push(payload), navigateBack: () => {} };
try { require(path.resolve(__dirname, '../miniapp/package-trade/pages/order-detail/index.js')); } finally { Module._load = originalLoad; delete global.Page; }

function makePage() { return Object.assign({}, holder.value, { data: JSON.parse(JSON.stringify(holder.value.data)), setData(patch) { Object.assign(this.data, patch); } }); }

async function run() {
  const page = makePage();
  await page.onLoad({ id: 'order-1' });
  assert.equal(page.data.status, 'error');
  assert.equal(page.data.errorText, '订单网络错误');
  getMode = 'empty';
  await page.retry();
  assert.equal(page.data.status, 'empty');
  getMode = 'ready';
  await page.retry();
  assert.equal(page.data.status, 'ready');
  assert.equal(page.data.order.items[0].unitPrice, '16.00');
  assert.equal(page.data.order.items[0].subtotal, '32.00');
  assert.equal(page.data.order.total, '37.00');
  assert.equal(page.data.order.address.phoneMasked, '138****0000');
  assert.equal(page.data.order.canConfirm, true);
  await page.confirmReceipt();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls.confirm, [{ id: 'order-1' }]);
  page.applyAftersale();
  assert(navs.at(-1).url.includes('aftersale-apply/index?orderId=order-1'));

  page.data.order = { ...page.data.order, paymentMethod: 'wechat', canPay: true };
  await page.preparePayment();
  assert.deepEqual(calls.pay, [{ orderId: 'order-1' }]);
  assert.equal(toasts.at(-1).title, '微信支付预下单尚未配置。');

  const wxml = fs.readFileSync(path.resolve(__dirname, '../miniapp/package-trade/pages/order-detail/index.wxml'), 'utf8');
  assert(wxml.includes('商品清单') && wxml.includes('订单进度') && wxml.includes('配送信息'));
  console.log('order detail test: passed');
}
run().catch(error => { console.error(error); process.exit(1); });
