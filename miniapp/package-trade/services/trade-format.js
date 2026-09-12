const ORDER_STATUS_LABELS = { pending_payment: '待付款', pending_confirmation: '待系统确认', picking: '备货中', shipping: '配送中', delivered: '待收货', completed: '已完成', cancelled: '已取消' };
const REFUND_STATUS_LABELS = { requested: '售后申请中', processing: '退款处理中', succeeded: '已退款', refunded: '已退款', rejected: '售后已驳回', failed: '退款失败' };
const RECEIPT_ORDER_STATUSES = ['picking', 'shipping', 'delivered'];
const money = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  return number.toFixed(2);
};

function tracking(status) {
  const steps = [{ key: 'pending_confirmation', label: '订单已提交' }, { key: 'picking', label: '备货中' }, { key: 'shipping', label: '配送中' }, { key: 'delivered', label: '已送达' }, { key: 'completed', label: '已完成' }];
  const current = steps.findIndex((item) => item.key === status);
  return {
    trackingSteps: steps.map((item, index) => ({ ...item, reached: current >= index, current: current === index })),
    trackingHint: status === 'completed' ? '顾客已确认收货，订单已完成。' : status === 'delivered' ? '商品已送达，请确认收货。' : status === 'shipping' ? '商品正在配送中。' : status === 'picking' ? '订单已确认，正在备货。' : status === 'pending_confirmation' ? '订单已提交，等待进入备货流程。' : status === 'pending_payment' ? '订单等待支付确认。' : status === 'cancelled' ? '订单已取消。' : '订单状态同步中。'
  };
}

function orderItemSummary(items) {
  const rows = Array.isArray(items) ? items.filter((item) => item && (item.productNameSnapshot || item.productName || item.skuId)) : [];
  if (!rows.length) return '';
  const labels = rows.slice(0, 3).map((item) => {
    const name = item.productNameSnapshot || item.productName || '商品';
    const spec = item.specSnapshot || item.packageUnitSnapshot || '';
    const quantity = Number(item.quantity || 0);
    return `${name}${spec ? ` · ${spec}` : ''} ×${quantity > 0 ? quantity : 1}`;
  });
  return `${labels.join('、')}${rows.length > 3 ? ` 等 ${rows.length} 种商品` : ''}`;
}

function toOrderRow(order) {
  const afterSaleStatus = order.activeRefundStatus || order.latestRefundStatus || '';
  const activeAfterSale = ['requested', 'approved', 'awaiting_manual_refund', 'processing'].includes(afterSaleStatus);
  return {
    id: order._id,
    orderNo: order.orderNo || '',
    summary: `订单 ${order.orderNo || order._id}`,
    itemSummary: orderItemSummary(order.items),
    total: money(Number(order.totalAmountCent || 0) / 100),
    totalAmountCent: Number(order.totalAmountCent || 0),
    amountLabel: order.paymentMethod === 'demo' ? '订单金额' : '实付',
    deliveryTime: order.deliverySlotSnapshot && order.deliverySlotSnapshot.name || '预计送达时间以订单为准',
    status: REFUND_STATUS_LABELS[afterSaleStatus] || REFUND_STATUS_LABELS[order.refundStatus] || ORDER_STATUS_LABELS[order.status] || order.status,
    rawStatus: order.status,
    paymentStatus: order.paymentStatus || '',
    refundStatus: order.refundStatus || '', afterSaleStatus, afterSaleId: order.activeRefundId || order.latestRefundId || '',
    canCancel: order.status === 'pending_payment' || (order.status === 'pending_confirmation' && order.paymentStatus !== 'paid'),
    canConfirm: order.status === 'delivered' && !activeAfterSale && !order.refundStatus,
    canRefund: order.paymentStatus === 'paid' && ['pending_confirmation', 'picking', 'shipping', 'delivered', 'completed'].includes(order.status) && !activeAfterSale && order.refundStatus !== 'refunded',
    ...tracking(order.status)
  };
}

function orderMatchesFilter(row, filter) {
  if (filter === '待付款') return row.rawStatus === 'pending_payment';
  if (filter === '待收货') return RECEIPT_ORDER_STATUSES.includes(row.rawStatus) && !row.refundStatus && !row.afterSaleStatus;
  if (filter === '售后/退款') return Boolean(row.refundStatus || row.afterSaleStatus);
  return true;
}

module.exports = { money, toOrderRow, orderMatchesFilter };
