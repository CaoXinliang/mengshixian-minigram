const assert = require('assert/strict');
const Module = require('module');
const path = require('path');

const originalLoad = Module._load;
const pageDefinition = {};
const quoteCalls = [];
let couponSelected;
let quoteResponder;

const services = {
  config: { provider: 'cloudbase' },
  address: {}, cart: {}, delivery: {}, auth: {}, bundles: {}, groups: {},
  checkout: {
    quote: async payload => {
      quoteCalls.push(payload);
      return quoteResponder(payload);
    }
  }
};

Module._load = function (request, parent, isMain) {
  if (request === '../../../services' || request === '../../../services/index') return services;
  return originalLoad.call(this, request, parent, isMain);
};
global.Page = definition => { pageDefinition.value = definition; };
global.wx = {
  navigateTo: ({ url, events }) => {
    assert.equal(url, '/package-marketing/pages/coupons/index?select=1');
    couponSelected = events.couponSelected;
  },
  showToast: () => {}
};
try {
  require(path.resolve(__dirname, '../miniapp/package-trade/pages/checkout/index.js'));
} finally {
  Module._load = originalLoad;
  delete global.Page;
}

function page() {
  const instance = Object.assign({}, pageDefinition.value, {
    data: JSON.parse(JSON.stringify(pageDefinition.value.data)),
    setData(patch, callback) { Object.assign(this.data, patch); if (callback) callback.call(this); }
  });
  instance.data.address = { id: 'address-1', regionCode: '440305' };
  instance.data.deliveryAreas = [{ _id: 'area-1', regionCodes: ['440305'], warehouseIds: ['warehouse-1'] }];
  instance.data.warehouse = { id: 'warehouse-1', name: '南山仓', areas: ['440305'] };
  instance.data.warehouses = [instance.data.warehouse];
  instance.data.cartItems = [{ id: 'cart-1', skuId: 'sku-1', qty: 2 }];
  instance.data.quoteState = 'ready';
  instance.data.cartTotal = '50.00';
  instance.data.freightTotal = '8.00';
  instance.data.discountTotal = '5.00';
  instance.data.orderTotal = '53.00';
  instance.data.acceptedQuoteToken = 'old-token';
  return instance;
}

async function run() {
  const current = page();
  current.chooseCoupon();
  assert.equal(typeof couponSelected, 'function');

  let resolveSelected;
  quoteResponder = () => new Promise(resolve => { resolveSelected = resolve; });
  couponSelected({ couponId: 'coupon-1' });
  assert.equal(current.data.quoteState, 'loading', 'coupon changes must immediately hide the previous total');
  assert.equal(current.data.discountTotal, '0.00');
  assert.equal(current.data.coupon, null, 'local coupon display must stay empty until the server confirms the quote snapshot');
  assert.equal(current.data.acceptedQuoteToken, '', 'coupon changes must invalidate an accepted quote token');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(quoteCalls.at(-1).couponId, 'coupon-1');
  assert.equal(Object.hasOwn(quoteCalls.at(-1), 'acceptedQuoteToken'), false);
  resolveSelected({ ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, discountAmountCent: 600, payableAmountCent: 5200, couponSnapshot: { id: 'coupon-1', name: '服务端确认券' }, items: [{ skuId: 'sku-1', unitPriceCent: 2500, subtotalCent: 5000 }] } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(current.data.discountTotal, '6.00');
  assert.equal(current.data.orderTotal, '52.00');
  assert.equal(current.data.coupon.name, '服务端确认券', 'coupon display must use the latest server snapshot');

  quoteResponder = async () => ({ ok: false, error: { code: 'COUPON_SCOPE_INVALID', message: '未达使用门槛' } });
  couponSelected({ couponId: 'coupon-bad' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(current.data.couponId, '', 'a server-rejected coupon must not remain selected');
  assert.equal(current.data.coupon, null);
  assert.equal(current.data.discountTotal, '0.00');
  assert.equal(current.data.orderTotal, '--');
  assert.equal(current.data.quoteState, 'invalid');
  assert.equal(current.data.quoteErrorText, '该优惠券不适用于当前订单，请重新选择');

  quoteResponder = async () => ({ ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, discountAmountCent: 0, payableAmountCent: 5800, items: [{ skuId: 'sku-1', unitPriceCent: 2500, subtotalCent: 5000 }] } } });
  couponSelected({ couponId: '' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(quoteCalls.at(-1).couponId, undefined, 'choosing no coupon must requote without a coupon id');
  assert.equal(current.data.quoteState, 'ready');
  assert.equal(current.data.orderTotal, '58.00');

  let resolveOld;
  quoteResponder = () => new Promise(resolve => { resolveOld = resolve; });
  couponSelected({ couponId: 'coupon-old' });
  await new Promise(resolve => setImmediate(resolve));
  quoteResponder = async () => ({ ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, discountAmountCent: 800, payableAmountCent: 5000, couponSnapshot: { id: 'coupon-new', name: '新券' }, items: [{ skuId: 'sku-1', unitPriceCent: 2500, subtotalCent: 5000 }] } } });
  couponSelected({ couponId: 'coupon-new' });
  await new Promise(resolve => setImmediate(resolve));
  resolveOld({ ok: true, data: { quote: { goodsAmountCent: 5000, freightAmountCent: 800, discountAmountCent: 100, payableAmountCent: 5700, couponSnapshot: { id: 'coupon-old', name: '旧券' }, items: [{ skuId: 'sku-1', unitPriceCent: 2500, subtotalCent: 5000 }] } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(current.data.coupon.id, 'coupon-new', 'a late coupon quote must not overwrite the latest selection');
  assert.equal(current.data.discountTotal, '8.00');
  assert.equal(current.data.orderTotal, '50.00');
  console.log('checkout coupon requote test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
