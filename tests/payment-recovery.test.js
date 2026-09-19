const assert = require('assert/strict');
const {
  createPaymentRecovery,
  createWechatPaymentPort,
  paymentStateFromOrder,
  testPaymentStateFromOrder
} = require('../miniapp/modules/payment-recovery');

const orderResult = order => ({ ok: true, data: { order } });

async function run() {
  assert.deepEqual(paymentStateFromOrder({ status: 'pending_confirmation', paymentStatus: 'paid' }), {
    kind: 'paid',
    text: '支付结果已确认',
    canRetry: false,
    canQuery: false
  });
  assert.equal(paymentStateFromOrder({ status: 'cancelled', paymentStatus: 'closed' }).kind, 'closed');
  assert.equal(paymentStateFromOrder({ status: 'pending_payment', paymentStatus: 'pending' }).kind, 'pending');
  assert.equal(paymentStateFromOrder({ status: 'future', paymentStatus: '' }).canQuery, true);
  assert.equal(testPaymentStateFromOrder({ status: 'pending_confirmation', paymentStatus: 'demo_not_required', paymentMethod: 'demo' }).kind, 'test');

  const prepared = [];
  const invoked = [];
  const queried = [];
  let callbackKind = 'success';
  let serverOrder = { _id: 'order-1', status: 'pending_payment', paymentStatus: 'pending' };
  const recovery = createPaymentRecovery({
    preparePayment: async payload => {
      prepared.push(payload);
      return { ok: true, data: { params: { timeStamp: '1', nonceStr: 'nonce', package: 'prepay_id=1', signType: 'RSA', paySign: 'sign' } } };
    },
    invokePayment: async params => { invoked.push(params); return { kind: callbackKind }; },
    getOrder: async id => { queried.push(id); return orderResult(serverOrder); }
  });

  let result = await recovery.start('order-1');
  assert.equal(result.kind, 'unknown', '微信success而服务端仍待支付时不得显示成功');
  assert.equal(result.canRetry, false, 'success回调但服务端未确认时不得重复付款');
  assert.deepEqual(prepared, [{ orderId: 'order-1' }]);
  assert.equal(invoked.length, 1);
  assert.deepEqual(queried, ['order-1'], '微信回调后必须查询服务端订单事实');

  callbackKind = 'cancelled';
  result = await recovery.start('order-1');
  assert.equal(result.kind, 'cancelled');
  assert.equal(result.canRetry, true, '服务端仍明确待支付时取消后才可重试');
  assert.equal(queried.length, 2, '取消也必须查询服务端');

  callbackKind = 'failed';
  result = await recovery.start('order-1');
  assert.equal(result.kind, 'failed');
  assert.equal(result.canRetry, true);
  assert.equal(queried.length, 3, '失败也必须查询服务端');

  callbackKind = 'unknown';
  result = await recovery.start('order-1');
  assert.equal(result.kind, 'unknown');
  assert.equal(result.canRetry, false);

  callbackKind = 'success';
  serverOrder = { _id: 'order-1', status: 'pending_confirmation', paymentStatus: 'paid' };
  result = await recovery.start('order-1');
  assert.equal(result.kind, 'paid', '只有服务端订单状态才能确认支付成功');

  serverOrder = { _id: 'order-1', status: 'cancelled', paymentStatus: 'closed' };
  result = await recovery.query('order-1');
  assert.equal(result.kind, 'closed');
  assert.equal(result.canRetry, false);

  const unavailable = createPaymentRecovery({
    preparePayment: async () => ({ ok: false, error: { code: 'PAYMENT_NOT_CONFIGURED', message: '微信支付预下单尚未配置。' } }),
    invokePayment: async () => { throw new Error('must not invoke'); },
    getOrder: async () => { throw new Error('must not query unavailable adapter'); }
  });
  result = await unavailable.start('order-2');
  assert.equal(result.kind, 'unavailable');
  assert.equal(result.text, '微信支付预下单尚未配置。');

  const conflictQueries = [];
  const conflict = createPaymentRecovery({
    preparePayment: async () => ({ ok: false, error: { code: 'ORDER_PAYMENT_NOT_AVAILABLE', message: '订单当前不能支付。' } }),
    invokePayment: async () => { throw new Error('must not invoke'); },
    getOrder: async id => { conflictQueries.push(id); return orderResult({ _id: id, status: 'pending_confirmation', paymentStatus: 'paid' }); }
  });
  result = await conflict.start('order-3');
  assert.equal(result.kind, 'paid', '预下单状态冲突应查询服务端而不是直接报失败');
  assert.deepEqual(conflictQueries, ['order-3']);

  const queryFailure = createPaymentRecovery({
    preparePayment: async () => ({ ok: true, data: { params: { package: 'prepay_id=2' } } }),
    invokePayment: async () => ({ kind: 'success' }),
    getOrder: async () => ({ ok: false, error: { code: 'REQUEST_FAILED' } })
  });
  result = await queryFailure.start('order-4');
  assert.equal(result.kind, 'unknown');
  assert.equal(result.canRetry, false);

  let deferredResolve;
  const deferred = new Promise(resolve => { deferredResolve = resolve; });
  const guarded = createPaymentRecovery({
    preparePayment: async () => deferred,
    invokePayment: async () => ({ kind: 'cancelled' }),
    getOrder: async id => orderResult({ _id: id, status: 'pending_payment', paymentStatus: 'pending' })
  });
  const first = guarded.start('order-5');
  const second = await guarded.start('order-5');
  assert.equal(second.kind, 'busy', '重复点击不得再次发起支付');
  deferredResolve({ ok: false, error: { code: 'PAYMENT_NOT_CONFIGURED' } });
  await first;

  let lateQueryResolve;
  let lateQueryCount = 0;
  const lateQuery = new Promise(resolve => { lateQueryResolve = resolve; });
  const lateRecovery = createPaymentRecovery({
    preparePayment: async () => ({ ok: true, data: { params: { package: 'prepay_id=late' } } }),
    invokePayment: async () => ({ kind: 'success' }),
    getOrder: async id => {
      lateQueryCount += 1;
      if (lateQueryCount === 1) return lateQuery;
      return orderResult({ _id: id, status: 'pending_confirmation', paymentStatus: 'paid' });
    }
  });
  const lateStart = lateRecovery.start('order-late');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await lateRecovery.start('order-late')).kind, 'busy', '服务端查询未返回时不得再次发起支付');
  assert.equal((await lateRecovery.query('order-late')).kind, 'busy', '迟到查询未返回时不得并发覆盖当前结果');
  assert.equal(lateQueryCount, 1);
  lateQueryResolve(orderResult({ _id: 'order-late', status: 'pending_payment', paymentStatus: 'pending' }));
  assert.equal((await lateStart).kind, 'unknown');
  assert.equal((await lateRecovery.query('order-late')).kind, 'paid', '前一查询结束后才允许读取更新后的服务端事实');

  const wxCalls = [];
  const wxPort = createWechatPaymentPort({
    requestPayment(options) { wxCalls.push(options); options.fail({ errMsg: 'requestPayment:fail cancel' }); }
  });
  result = await wxPort({ package: 'prepay_id=3' });
  assert.equal(result.kind, 'cancelled');
  assert.equal(wxCalls.length, 1);

  const missingPort = createWechatPaymentPort({});
  result = await missingPort({});
  assert.equal(result.kind, 'unavailable');

  console.log('payment recovery test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
