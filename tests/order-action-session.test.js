const assert = require('assert/strict');
const { createOrderActionSession } = require('../miniapp/modules/order-action-session');

async function run() {
  let state = { _id: 'o1', status: 'pending_payment', paymentStatus: 'unpaid' };
  let cancelCalls = 0;
  const success = createOrderActionSession({
    getOrder: async () => ({ ok: true, data: { order: state } }),
    cancelOrder: async () => { cancelCalls += 1; state = { ...state, status: 'cancelled' }; return { ok: true, data: { order: state } }; },
    completeOrder: async () => ({ ok: false, error: { code: 'ORDER_STATUS_FORBIDDEN', message: '不能确认' } })
  });
  const cancelled = await success.run('cancel', 'o1');
  assert.equal(cancelled.kind, 'succeeded');
  assert.equal(cancelled.order.status, 'cancelled');
  assert.equal(cancelCalls, 1);

  let release;
  const slow = createOrderActionSession({
    getOrder: async () => ({ ok: true, data: { order: state } }),
    cancelOrder: () => new Promise(resolve => { release = resolve; }),
    completeOrder: async () => ({ ok: true, data: { order: state } })
  });
  const pending = slow.run('cancel', 'o1');
  assert.equal((await slow.run('cancel', 'o1')).kind, 'busy');
  release({ ok: true, data: { order: { ...state, status: 'cancelled' } } });
  await pending;

  const conflict = createOrderActionSession({
    getOrder: async () => ({ ok: true, data: { order: { ...state, status: 'shipping' } } }),
    cancelOrder: async () => ({ ok: false, error: { code: 'ORDER_CANNOT_CANCEL', message: '当前订单状态不能取消。' } }),
    completeOrder: async () => ({ ok: false, error: { code: 'ORDER_STATUS_FORBIDDEN', message: '用户只能确认已送达订单。' } })
  });
  const changed = await conflict.run('cancel', 'o1');
  assert.equal(changed.kind, 'state_changed');
  assert.equal(changed.order.status, 'shipping');
  assert(changed.text.includes('最新状态'));

  const recovered = createOrderActionSession({
    getOrder: async () => ({ ok: true, data: { order: { ...state, status: 'cancelled' } } }),
    cancelOrder: async () => ({ ok: false, error: { code: 'REQUEST_FAILED', message: '连接中断' } }),
    completeOrder: async () => ({ ok: false, error: { code: 'REQUEST_FAILED', message: '连接中断' } })
  });
  assert.equal((await recovered.run('cancel', 'o1')).kind, 'succeeded');

  const unknown = createOrderActionSession({
    getOrder: async () => ({ ok: false, error: { code: 'REQUEST_FAILED', message: '仍无法查询' } }),
    cancelOrder: async () => ({ ok: false, error: { code: 'REQUEST_FAILED', message: '连接中断' } }),
    completeOrder: async () => ({ ok: false, error: { code: 'REQUEST_FAILED', message: '连接中断' } })
  });
  const unresolved = await unknown.run('confirm', 'o1');
  assert.equal(unresolved.kind, 'unknown');
  assert.equal(unresolved.canRetry, false, 'unknown result must be queried before the action is attempted again');
  assert(unresolved.text.includes('不要重复操作'));

  let resolvedState = 'delivered';
  const resolvable = createOrderActionSession({
    getOrder: async () => resolvedState ? ({ ok: true, data: { order: { _id: 'o2', status: resolvedState } } }) : ({ ok: false, error: { code: 'REQUEST_FAILED' } }),
    cancelOrder: async () => ({ ok: false, error: { code: 'REQUEST_FAILED', message: '连接中断' } }),
    completeOrder: async () => ({ ok: false, error: { code: 'REQUEST_FAILED', message: '连接中断' } })
  });
  resolvedState = '';
  assert.equal((await resolvable.run('confirm', 'o2')).kind, 'unknown');
  resolvedState = 'completed';
  assert.equal((await resolvable.resolve('o2')).kind, 'succeeded', 'explicit status query must recover an unknown action');
  assert.equal(resolvable.hasUnresolved(), false);

  console.log('order action session test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
