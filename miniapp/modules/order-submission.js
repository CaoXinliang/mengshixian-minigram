const UNKNOWN_CODES = new Set([
  'REQUEST_FAILED',
  'REQUEST_TIMEOUT',
  'INVALID_API_RESPONSE',
  'CLOUD_NOT_READY',
  'CLOUD_ENV_NOT_CONFIGURED'
]);

const DEFINITIVE_CODES = new Set([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'AUTH_REQUIRED',
  'AUTH_ACCOUNT_DISABLED',
  'OUT_OF_DELIVERY_RANGE'
]);

const REQUOTE_CODES = new Set([
  'QUOTE_CHANGED',
  'BUNDLE_CHANGED',
  'INQUIRY_QUOTE_CHANGED',
  'INQUIRY_QUOTE_EXPIRED',
  'COUPON_CHANGED',
  'COUPON_NOT_AVAILABLE',
  'DELIVERY_SLOT_NOT_AVAILABLE',
  'PICKUP_SITE_NOT_AVAILABLE',
  'PICKUP_SITE_WAREHOUSE_MISMATCH'
]);

const definitiveCodePattern = /(?:_FORBIDDEN|_REQUIRED|_INVALID|_NOT_AVAILABLE|_NOT_FOUND|_NOT_CONFIGURED|_CHANGED|_EXPIRED|_CONFLICT|_LIMIT|_MET)$/;
const isDefinitiveRejection = code => DEFINITIVE_CODES.has(code) || definitiveCodePattern.test(String(code || ''));
const requiresRequote = code => REQUOTE_CODES.has(String(code || ''));

function paymentMethodForUser({ user = {}, groupMode = false, capabilities = {} } = {}) {
  const wechatAvailable = capabilities.paymentPrepare === true && capabilities.paymentNotify === true;
  if (groupMode) return wechatAvailable ? 'wechat' : '';
  const isApprovedBusiness = user.userType === 'b' && user.businessStatus === 'approved' && Boolean(user.organizationId) && user.status !== 'disabled';
  if (isApprovedBusiness) return 'offline';
  if (wechatAvailable) return 'wechat';
  return capabilities.demoOrder === true ? 'demo' : '';
}

function orderIntentValidation(input = {}) {
  if (!input.warehouseId || !(input.cartItems || []).length) return { ok: false, message: '请先选择仓库和商品' };
  if (input.fulfillmentType === 'delivery' && !input.addressId) return { ok: false, message: '请先选择收货地址' };
  if (input.fulfillmentType === 'delivery' && input.deliverySlotsContractAvailable && !input.deliverySlotId) return { ok: false, message: '当前没有可用配送时段，暂不能提交订单' };
  if (input.fulfillmentType === 'pickup' && !input.pickupSiteId) return { ok: false, message: '当前仓库暂无可用自提点' };
  return { ok: true, message: '' };
}

function orderIntentFromCheckout({ input = {}, paymentMethod } = {}) {
  const fulfillmentPayload = input.fulfillmentType === 'pickup'
    ? { fulfillmentType: 'pickup', pickupSiteId: input.pickupSiteId }
    : {
        fulfillmentType: 'delivery',
        addressId: input.addressId,
        ...(input.deliverySlotsContractAvailable ? { deliverySlotId: input.deliverySlotId } : {})
      };
  return {
    ...fulfillmentPayload,
    warehouseId: input.warehouseId,
    ...(input.bundleId
      ? { bundleId: input.bundleId, bundleQuantity: input.bundleQuantity }
      : { items: (input.cartItems || []).map(item => ({ skuId: item.skuId, quantity: item.qty })) }),
    paymentMethod,
    ...(input.couponId ? { couponId: input.couponId } : {}),
    ...(input.acceptedQuoteToken ? { acceptedQuoteToken: input.acceptedQuoteToken } : {})
  };
}

function createOrderSubmission(options = {}) {
  const { createOrder, resolveOrder, createKey } = options;
  if (typeof createOrder !== 'function' || typeof resolveOrder !== 'function' || typeof createKey !== 'function') {
    throw new TypeError('order submission requires createOrder, resolveOrder and createKey ports');
  }
  let idempotencyKey = '';
  let busy = false;

  const ensureKey = () => {
    if (!idempotencyKey) idempotencyKey = String(createKey() || '').trim();
    if (!idempotencyKey) throw new Error('order submission key is required');
    return idempotencyKey;
  };

  return {
    currentKey: () => idempotencyKey,
    isBusy: () => busy,
    reset: () => { if (!busy) idempotencyKey = ''; },
    async submit(payload = {}) {
      if (busy) return { kind: 'busy', idempotencyKey };
      busy = true;
      try {
        const key = ensureKey();
        let result;
        try {
          result = await createOrder({ ...payload, idempotencyKey: key });
        } catch (_) {
          result = { ok: false, error: { code: 'REQUEST_FAILED', message: '订单提交结果暂时无法确认' } };
        }
        const order = result && result.ok && result.data && result.data.order;
        if (order) {
          idempotencyKey = '';
          return { kind: 'created', order, idempotencyKey: key, idempotent: Boolean(result.data.idempotent) };
        }
        const error = result && result.error || {};
        if (UNKNOWN_CODES.has(error.code) || !isDefinitiveRejection(error.code)) return { kind: 'unknown', error, idempotencyKey: key };
        idempotencyKey = '';
        return { kind: 'rejected', error, idempotencyKey: key };
      } finally {
        busy = false;
      }
    },
    async resolve() {
      if (busy) return { kind: 'busy', idempotencyKey };
      if (!idempotencyKey) return { kind: 'idle', idempotencyKey: '' };
      busy = true;
      const key = idempotencyKey;
      try {
        let result;
        try {
          result = await resolveOrder({ idempotencyKey: key });
        } catch (_) {
          result = { ok: false, error: { code: 'REQUEST_FAILED', message: '订单结果查询失败' } };
        }
        const order = result && result.ok && result.data && result.data.order;
        if (order) {
          idempotencyKey = '';
          return { kind: 'created', order, idempotencyKey: key, idempotent: true };
        }
        if (result && result.ok && result.data && result.data.found === false) return { kind: 'not_found', idempotencyKey: key };
        return { kind: 'unknown', error: result && result.error || {}, idempotencyKey: key };
      } finally {
        busy = false;
      }
    }
  };
}

module.exports = {
  createOrderSubmission,
  isDefinitiveRejection,
  orderIntentFromCheckout,
  orderIntentValidation,
  paymentMethodForUser,
  requiresRequote,
  UNKNOWN_CODES
};
