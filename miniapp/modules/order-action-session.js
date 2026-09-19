const STATE_CONFLICT_CODES = new Set([
  'ORDER_CANNOT_CANCEL',
  'ORDER_PAID_CANCEL_FORBIDDEN',
  'ORDER_STATUS_INVALID',
  'ORDER_STATUS_TRANSITION_INVALID',
  'ORDER_STATUS_FORBIDDEN',
  'ORDER_NOT_FOUND'
]);
const TRANSPORT_CODES = new Set(['REQUEST_FAILED', 'REQUEST_TIMEOUT', 'NETWORK_ERROR']);

const actionTarget = type => type === 'cancel' ? 'cancelled' : type === 'confirm' ? 'completed' : '';
const responseOrder = result => result && result.ok && result.data && result.data.order || null;
const errorOf = result => result && result.error || { code: 'REQUEST_FAILED', message: '订单操作结果暂时无法确认。' };

function createOrderActionSession({ getOrder, cancelOrder, completeOrder }) {
  let busy = false;
  let unresolved = null;

  async function read(id) {
    try { return await getOrder(id); } catch (error) { return { ok: false, error: { code: 'REQUEST_FAILED', message: error && error.message || '订单状态查询失败。' } }; }
  }

  async function run(type, id) {
    if (busy) return { kind: 'busy', text: '订单操作正在处理中，请勿重复点击。', canRetry: false };
    if (unresolved && unresolved.id === id && unresolved.type === type) return { kind: 'unknown', text: '上一次操作结果仍未确认，请先刷新订单状态，不要重复操作。', canRetry: false };
    const request = type === 'cancel' ? cancelOrder : type === 'confirm' ? completeOrder : null;
    const target = actionTarget(type);
    if (!request || !id) return { kind: 'failed', text: '订单操作参数无效。', canRetry: false };
    busy = true;
    try {
      let result;
      try { result = await request({ id }); } catch (error) { result = { ok: false, error: { code: 'REQUEST_FAILED', message: error && error.message || '订单操作请求失败。' } }; }
      const direct = responseOrder(result);
      if (direct && direct.status === target) {
        unresolved = null;
        return { kind: 'succeeded', order: direct, text: type === 'cancel' ? '订单已取消' : '已确认收货', canRetry: false };
      }

      const error = errorOf(result);
      const latest = await read(id);
      const order = responseOrder(latest);
      if (order && order.status === target) {
        unresolved = null;
        return { kind: 'succeeded', order, text: type === 'cancel' ? '订单已取消' : '已确认收货', canRetry: false };
      }
      if (order && STATE_CONFLICT_CODES.has(error.code)) {
        unresolved = null;
        return { kind: 'state_changed', order, error, text: '订单状态已经变化，页面已按最新状态刷新。', canRetry: false };
      }
      if (order && !TRANSPORT_CODES.has(error.code)) {
        unresolved = null;
        return { kind: 'failed', order, error, text: error.message || '当前订单不能执行该操作。', canRetry: false };
      }
      unresolved = { id, type };
      return { kind: 'unknown', order: order || null, error, text: '订单操作结果暂时无法确认，请不要重复操作，稍后刷新订单状态。', canRetry: false };
    } finally {
      busy = false;
    }
  }

  async function resolve(id) {
    const latest = await read(id);
    const order = responseOrder(latest);
    if (order && unresolved && unresolved.id === id && order.status === actionTarget(unresolved.type)) {
      const type = unresolved.type;
      unresolved = null;
      return { kind: 'succeeded', order, text: type === 'cancel' ? '订单已取消' : '已确认收货', canRetry: false };
    }
    if (order) {
      unresolved = null;
      return { kind: 'state_changed', order, text: '订单状态已刷新，请按当前可用操作继续。', canRetry: false };
    }
    return { kind: 'unknown', text: '订单状态仍无法确认，请稍后再刷新。', canRetry: false };
  }

  return { run, resolve, isBusy: () => busy, hasUnresolved: () => Boolean(unresolved) };
}

module.exports = { createOrderActionSession };
