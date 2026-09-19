const assert = require('assert/strict');
const test = require('node:test');

const {
  buildQuotePayload,
  createCheckoutQuoteSession,
  invalidQuoteState,
  loadingQuoteState,
  quotePreconditionState,
  quoteResultState
} = require('../miniapp/modules/checkout-quote-state');

const money = value => Number(value).toFixed(2);
const cartItems = [
  { id: 'cart-1', skuId: 'sku-1', qty: 2, unitPriceText: '旧单价', subtotalText: '旧小计' }
];

test('loading quote state removes stale prices and totals', () => {
  assert.deepEqual(loadingQuoteState(cartItems), {
    cartItems: [{ id: 'cart-1', skuId: 'sku-1', qty: 2, unitPriceText: '', subtotalText: '' }],
    quoteState: 'loading',
    quoteErrorText: '',
    cartTotal: '--',
    freightTotal: '--',
    discountTotal: '0.00',
    orderTotal: '--',
    pickupFree: false
  });
});

test('complete server quote becomes the only displayed amount source', () => {
  const state = quoteResultState({
    result: { ok: true, data: { quote: { goodsAmountCent: 2000, freightAmountCent: 300, discountAmountCent: 100, payableAmountCent: 2200, items: [{ skuId: 'sku-1', unitPriceCent: 1000, subtotalCent: 2000 }], couponSnapshot: { id: 'coupon-1' } } } },
    cartItems,
    fulfillmentType: 'delivery',
    coupon: null,
    money
  });
  assert.equal(state.quoteState, 'ready');
  assert.equal(state.cartTotal, '20.00');
  assert.equal(state.freightTotal, '3.00');
  assert.equal(state.discountTotal, '1.00');
  assert.equal(state.orderTotal, '22.00');
  assert.equal(state.cartItems[0].unitPriceText, '10.00');
  assert.equal(state.cartItems[0].subtotalText, '20.00');
  assert.deepEqual(state.coupon, { id: 'coupon-1' });
});

test('missing or unsafe server amounts never become a ready quote', () => {
  for (const quote of [
    { goodsAmountCent: 2000, freightAmountCent: 300, payableAmountCent: 2300, items: [{ skuId: 'sku-1', unitPriceCent: 1000, subtotalCent: 2000 }] },
    { goodsAmountCent: 2000, freightAmountCent: -1, discountAmountCent: 0, payableAmountCent: 1999, items: [{ skuId: 'sku-1', unitPriceCent: 1000, subtotalCent: 2000 }] },
    { goodsAmountCent: 2000, freightAmountCent: 300, discountAmountCent: 0, payableAmountCent: 2300, items: [] }
  ]) {
    const state = quoteResultState({ result: { ok: true, data: { quote } }, cartItems, money });
    assert.equal(state.quoteState, 'error');
    assert.equal(state.orderTotal, '--');
    assert.equal(state.cartItems[0].unitPriceText, '');
  }
});

test('expired delivery slot is removed and requires a new selection', () => {
  const state = quoteResultState({
    result: { ok: false, error: { code: 'DELIVERY_SLOT_NOT_AVAILABLE' } },
    cartItems,
    deliverySlot: { id: 'slot-old' },
    deliverySlots: [{ id: 'slot-old' }, { id: 'slot-new' }],
    allDeliverySlots: [{ id: 'slot-old' }, { id: 'slot-new' }],
    money
  });
  assert.equal(state.quoteState, 'invalid');
  assert.equal(state.deliverySlot, null);
  assert.deepEqual(state.deliverySlots, [{ id: 'slot-new' }]);
  assert.deepEqual(state.allDeliverySlots, [{ id: 'slot-new' }]);
});

test('changed coupon is cleared instead of displaying a stale discount', () => {
  const state = quoteResultState({
    result: { ok: false, error: { code: 'COUPON_CHANGED' } },
    cartItems,
    coupon: { id: 'old-coupon' },
    money
  });
  assert.equal(state.quoteState, 'invalid');
  assert.equal(state.couponId, '');
  assert.equal(state.coupon, null);
  assert.equal(state.discountTotal, '0.00');
});

test('expired inquiry quote is blocked instead of downgraded to an ordinary quote', () => {
  const state = quoteResultState({
    result: { ok: false, error: { code: 'INQUIRY_QUOTE_EXPIRED' } },
    cartItems,
    money
  });
  assert.equal(state.quoteState, 'invalid');
  assert.equal(state.acceptedQuoteToken, '');
  assert.equal(state.inquiryQuoteInvalid, true);
  assert.match(state.quoteErrorText, /返回询价单/);
});

test('quote session owns payload construction and ignores late responses', async () => {
  const requests = [];
  const releases = [];
  const session = createCheckoutQuoteSession({
    quote: payload => {
      requests.push(payload);
      return new Promise(resolve => releases.push(resolve));
    },
    quoteBundle: async () => ({ ok: false }),
    quoteGroup: async () => ({ ok: false })
  });
  const context = { fulfillmentType: 'delivery', addressId: 'address-1', regionCode: 'r1', warehouseId: 'w1', cartItems, couponId: 'coupon-1' };
  const presentation = { cartItems, fulfillmentType: 'delivery', money };
  const first = session.load({ mode: 'standard', context, presentation });
  const second = session.load({ mode: 'standard', context: { ...context, couponId: '' }, presentation });
  releases[1]({ ok: true, data: { quote: { goodsAmountCent: 2000, freightAmountCent: 0, discountAmountCent: 0, payableAmountCent: 2000, items: [{ skuId: 'sku-1', unitPriceCent: 1000, subtotalCent: 2000 }] } } });
  assert.equal((await second).kind, 'current');
  releases[0]({ ok: false, error: { code: 'REQUEST_FAILED' } });
  assert.equal((await first).kind, 'stale');
  assert.equal(requests[0].couponId, 'coupon-1');
  assert.equal(Object.hasOwn(requests[1], 'couponId'), false);
});

test('quote helpers centralize invalid state and bundle payload', () => {
  assert.equal(invalidQuoteState(cartItems, '不可报价').quoteState, 'invalid');
  assert.deepEqual(buildQuotePayload({ fulfillmentType: 'pickup', pickupSiteId: 'p1', warehouseId: 'w1', bundleId: 'b1', bundleQuantity: 2 }), {
    fulfillmentType: 'pickup', pickupSiteId: 'p1', warehouseId: 'w1', bundleId: 'b1', quantity: 2
  });
});

test('quote preconditions return customer-facing invalid states', () => {
  const base = { warehouseId: 'w1', cartItems, fulfillmentType: 'delivery', addressId: 'a1', regionCode: 'r1', hasDeliveryArea: true, deliverySlotsContractAvailable: true, deliverySlotId: 'slot-1' };
  assert.equal(quotePreconditionState(base), null);
  assert.equal(quotePreconditionState({ ...base, warehouseId: '' }).quoteErrorText, '当前暂无可配送仓库');
  assert.equal(quotePreconditionState({ ...base, regionCode: '' }).quoteErrorText, '收货地址缺少地区信息，请先补充');
  assert.equal(quotePreconditionState({ ...base, deliverySlotId: '' }).quoteErrorText, '当前仓库与收货区域暂无可用配送时段');
});
