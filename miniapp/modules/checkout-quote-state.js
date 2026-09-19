const COUPON_ERRORS = new Set([
  'COUPON_NOT_AVAILABLE',
  'COUPON_SCOPE_INVALID',
  'COUPON_DISCOUNT_INVALID',
  'COUPON_CHANGED'
]);

const PICKUP_ERRORS = new Set([
  'PICKUP_SITE_NOT_AVAILABLE',
  'PICKUP_SITE_WAREHOUSE_MISMATCH',
  'PICKUP_SITE_REQUIRED'
]);

const INQUIRY_QUOTE_ERRORS = new Set([
  'INQUIRY_QUOTE_EXPIRED',
  'INQUIRY_QUOTE_CHANGED',
  'INQUIRY_QUOTE_ITEMS_CHANGED'
]);

const isInquiryQuoteInvalidCode = code => INQUIRY_QUOTE_ERRORS.has(String(code || ''));

const validAmount = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const unpricedItems = items => (Array.isArray(items) ? items : []).map(item => ({ ...item, unitPriceText: '', subtotalText: '' }));

function loadingQuoteState(cartItems) {
  return {
    cartItems: unpricedItems(cartItems),
    quoteState: 'loading',
    quoteErrorText: '',
    cartTotal: '--',
    freightTotal: '--',
    discountTotal: '0.00',
    orderTotal: '--',
    pickupFree: false
  };
}

function invalidQuoteState(cartItems, message, extra = {}) {
  return {
    ...loadingQuoteState(cartItems),
    quoteState: 'invalid',
    quoteErrorText: message,
    ...extra
  };
}

function quotePreconditionState(context = {}) {
  const cartItems = Array.isArray(context.cartItems) ? context.cartItems : [];
  let reason = '';
  if (!context.warehouseId) reason = '当前暂无可配送仓库';
  else if (!cartItems.length) reason = '购物车暂无可结算商品';
  else if (context.fulfillmentType === 'pickup' && !context.pickupSiteId) reason = '当前仓库暂无可用自提点';
  else if (context.fulfillmentType === 'delivery' && !context.addressId) reason = '请先添加收货地址';
  else if (context.fulfillmentType === 'delivery' && !context.regionCode) reason = '收货地址缺少地区信息，请先补充';
  else if (context.fulfillmentType === 'delivery' && !context.hasDeliveryArea) reason = '当前地址超出配送范围，请更换地址或选择到店自提';
  else if (context.fulfillmentType === 'delivery' && context.deliverySlotsContractAvailable && !context.deliverySlotId) reason = '当前仓库与收货区域暂无可用配送时段';
  return reason ? invalidQuoteState(cartItems, reason) : null;
}

function quoteResultState(options = {}) {
  const {
    result,
    cartItems = [],
    fulfillmentType = 'delivery',
    coupon = null,
    deliverySlot = null,
    pickupSite = null,
    deliverySlots = [],
    allDeliverySlots = [],
    pickupSites = [],
    allPickupSites = [],
    money = value => Number(value).toFixed(2)
  } = options;
  const quote = result && result.ok && result.data && result.data.quote;
  if (!quote) {
    const error = result && result.error || {};
    if (error.code === 'DELIVERY_SLOT_NOT_AVAILABLE') {
      const rejectedId = deliverySlot && deliverySlot.id;
      return invalidQuoteState(cartItems, '配送时段已失效，请重新选择', {
        deliverySlot: null,
        deliverySlots: deliverySlots.filter(item => item.id !== rejectedId),
        allDeliverySlots: allDeliverySlots.filter(item => item.id !== rejectedId)
      });
    }
    if (PICKUP_ERRORS.has(error.code)) {
      const rejectedId = pickupSite && pickupSite.id;
      return invalidQuoteState(cartItems, '自提点已失效，请重新选择', {
        pickupSite: null,
        pickupSites: pickupSites.filter(item => item.id !== rejectedId),
        allPickupSites: allPickupSites.filter(item => item.id !== rejectedId)
      });
    }
    if (COUPON_ERRORS.has(error.code)) {
      return invalidQuoteState(cartItems, '该优惠券不适用于当前订单，请重新选择', {
        couponId: '',
        coupon: null
      });
    }
    if (isInquiryQuoteInvalidCode(error.code)) {
      return invalidQuoteState(cartItems, '询价报价已失效，请返回询价单确认最新报价', {
        acceptedQuoteToken: '',
        inquiryQuoteInvalid: true
      });
    }
    return {
      ...loadingQuoteState(cartItems),
      quoteState: 'error',
      quoteErrorText: error.message || '订单金额计算失败，请重试'
    };
  }

  const payable = quote.payableAmountCent !== undefined ? quote.payableAmountCent : quote.totalAmountCent;
  const quoteItems = Array.isArray(quote.items) ? quote.items : [];
  const quoteItemsBySku = new Map(quoteItems.map(item => [String(item && item.skuId), item]));
  const completeItems = cartItems.every(item => {
    const quoteItem = quoteItemsBySku.get(String(item.skuId));
    return quoteItem && validAmount(quoteItem.unitPriceCent) && validAmount(quoteItem.subtotalCent);
  });
  if (!validAmount(quote.goodsAmountCent) || !validAmount(quote.freightAmountCent) || !validAmount(quote.discountAmountCent) || !validAmount(payable) || !completeItems) {
    return {
      ...loadingQuoteState(cartItems),
      quoteState: 'error',
      quoteErrorText: '订单金额信息不完整，请重新计算'
    };
  }

  return {
    cartItems: cartItems.map(item => {
      const quoteItem = quoteItemsBySku.get(String(item.skuId));
      return {
        ...item,
        unitPriceText: money(quoteItem.unitPriceCent / 100),
        subtotalText: money(quoteItem.subtotalCent / 100)
      };
    }),
    quoteState: 'ready',
    quoteErrorText: '',
    cartTotal: money(quote.goodsAmountCent / 100),
    freightTotal: money(quote.freightAmountCent / 100),
    discountTotal: money(quote.discountAmountCent / 100),
    orderTotal: money(payable / 100),
    pickupFree: fulfillmentType === 'pickup' && quote.freightAmountCent === 0,
    coupon: quote.couponSnapshot || coupon
  };
}

function buildQuotePayload(context = {}) {
  const fulfillmentPayload = context.fulfillmentType === 'pickup'
    ? { fulfillmentType: 'pickup', pickupSiteId: context.pickupSiteId }
    : {
        fulfillmentType: 'delivery',
        addressId: context.addressId,
        regionCode: context.regionCode || '',
        ...(context.deliverySlotsContractAvailable ? { deliverySlotId: context.deliverySlotId } : {})
      };
  return {
    ...fulfillmentPayload,
    warehouseId: context.warehouseId,
    ...(context.bundleId
      ? { bundleId: context.bundleId, quantity: context.bundleQuantity }
      : { items: (context.cartItems || []).map(item => ({ skuId: item.skuId, quantity: item.qty })) }),
    ...(context.couponId ? { couponId: context.couponId } : {}),
    ...(context.acceptedQuoteToken ? { acceptedQuoteToken: context.acceptedQuoteToken } : {})
  };
}

function createCheckoutQuoteSession(ports = {}) {
  const { quote, quoteBundle, quoteGroup } = ports;
  let requestSequence = 0;
  return {
    invalidate() { requestSequence += 1; },
    async load(options = {}) {
      const token = requestSequence + 1;
      requestSequence = token;
      const payload = buildQuotePayload(options.context);
      let result;
      if (options.mode === 'group') result = await quoteGroup({ ...payload, campaignId: options.context.groupCampaignId });
      else if (options.mode === 'bundle') result = await quoteBundle(payload);
      else result = await quote(payload);
      if (token !== requestSequence) return { kind: 'stale' };
      return {
        kind: 'current',
        patch: quoteResultState({ ...options.presentation, result })
      };
    }
  };
}

module.exports = {
  buildQuotePayload,
  createCheckoutQuoteSession,
  invalidQuoteState,
  isInquiryQuoteInvalidCode,
  loadingQuoteState,
  quotePreconditionState,
  quoteResultState,
  validAmount
};
