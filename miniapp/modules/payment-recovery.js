const UNKNOWN_STATE = Object.freeze({
  kind: 'unknown',
  text: '支付结果正在确认，请勿重复付款',
  canRetry: false,
  canQuery: true
});

function paymentStateFromOrder(order) {
  if (!order) return { ...UNKNOWN_STATE };
  if (order.paymentStatus === 'paid') return { kind: 'paid', text: '支付结果已确认', canRetry: false, canQuery: false };
  if (order.paymentStatus === 'closed' || order.status === 'cancelled') return { kind: 'closed', text: '订单已关闭，不能继续支付', canRetry: false, canQuery: false };
  if (order.status === 'pending_payment' && order.paymentStatus === 'pending') return { kind: 'pending', text: '订单仍待支付', canRetry: true, canQuery: false };
  return { ...UNKNOWN_STATE };
}

function testPaymentStateFromOrder(order) {
  const serverState = paymentStateFromOrder(order);
  if (serverState.kind === 'paid' || serverState.kind === 'closed') return serverState;
  if (order && order.paymentMethod === 'demo') {
    return { kind: 'test', text: '当前为测试环境：非真实支付、非真实到账，不会产生扣款。', canRetry: false, canQuery: false };
  }
  return serverState;
}

function createWechatPaymentPort(wxApi) {
  return function invokePayment(params) {
    if (!wxApi || typeof wxApi.requestPayment !== 'function') {
      return Promise.resolve({ kind: 'unavailable', text: '当前微信版本无法发起支付', canRetry: false, canQuery: false });
    }
    return new Promise(resolve => {
      let settled = false;
      const finish = result => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      try {
        wxApi.requestPayment({
          ...params,
          success: () => finish({ kind: 'success' }),
          fail: error => finish(/cancel/i.test(String(error && error.errMsg || ''))
            ? { kind: 'cancelled' }
            : { kind: 'failed' })
        });
      } catch (error) {
        finish({ kind: 'unknown' });
      }
    });
  };
}

function createPaymentRecovery({ preparePayment, invokePayment, getOrder }) {
  let busy = false;

  async function queryOrder(orderId, callbackKind = 'unknown') {
    let result;
    try {
      result = await getOrder(orderId);
    } catch (error) {
      return { ...UNKNOWN_STATE };
    }
    const order = result && result.ok && result.data && result.data.order;
    const serverState = paymentStateFromOrder(order);
    if (serverState.kind !== 'pending') return serverState;
    if (callbackKind === 'cancelled') return { kind: 'cancelled', text: '支付已取消，订单仍待支付', canRetry: true, canQuery: false };
    if (callbackKind === 'failed') return { kind: 'failed', text: '支付未完成，订单仍待支付', canRetry: true, canQuery: false };
    if (callbackKind === 'manual') return serverState;
    return { ...UNKNOWN_STATE };
  }

  async function start(orderId) {
    if (busy) return { kind: 'busy', text: '正在处理支付，请稍候', canRetry: false, canQuery: false };
    busy = true;
    try {
      let prepared;
      try {
        prepared = await preparePayment({ orderId });
      } catch (error) {
        return await queryOrder(orderId, 'failed');
      }
      const params = prepared && prepared.ok && prepared.data && prepared.data.params;
      if (!params) {
        const apiError = prepared && prepared.error || {};
        if (apiError.code === 'PAYMENT_NOT_CONFIGURED') {
          return { kind: 'unavailable', text: apiError.message || '微信支付暂不可用', canRetry: false, canQuery: false };
        }
        return await queryOrder(orderId, 'failed');
      }

      let callback;
      try {
        callback = await invokePayment(params);
      } catch (error) {
        callback = { kind: 'unknown' };
      }
      if (callback && callback.kind === 'unavailable') {
        return { kind: 'unavailable', text: callback.text || '当前微信版本无法发起支付', canRetry: false, canQuery: false };
      }
      return await queryOrder(orderId, callback && callback.kind || 'unknown');
    } finally {
      busy = false;
    }
  }

  async function query(orderId) {
    if (busy) return { kind: 'busy', text: '正在查询支付结果，请稍候', canRetry: false, canQuery: false };
    busy = true;
    try {
      return await queryOrder(orderId, 'manual');
    } finally {
      busy = false;
    }
  }

  return { start, query };
}

module.exports = {
  createPaymentRecovery,
  createWechatPaymentPort,
  paymentStateFromOrder,
  testPaymentStateFromOrder
};
