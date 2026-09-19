const ORDER_STATUS_LABELS = {
  pending_payment: '待付款',
  pending_confirmation: '待系统确认',
  picking: '备货中',
  shipping: '配送中',
  delivered: '待收货',
  completed: '已完成',
  cancelled: '已取消'
};
const REFUND_STATUS_LABELS = {
  requested: '售后申请中',
  approved: '售后审核通过',
  awaiting_manual_refund: '等待退款处理',
  channel_pending: '退款渠道处理中',
  processing: '退款处理中',
  succeeded: '已退款',
  refunded: '已退款',
  partially_refunded: '部分退款完成',
  rejected: '售后已驳回',
  failed: '退款失败'
};
const ACTIVE_REFUND_STATUSES = ['requested', 'approved', 'awaiting_manual_refund', 'channel_pending', 'processing'];
const RECEIPT_ORDER_STATUSES = ['picking', 'shipping', 'delivered'];
const PROGRESS_STEPS = ['pending_payment', 'pending_confirmation', 'picking', 'shipping', 'delivered', 'completed'];
const REFUND_SUMMARY_UNKNOWN = 'unknown';

const money = value => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : '--';
};
const hasMoneyValue = value => value !== undefined && value !== null && String(value).trim() !== '' && Number.isFinite(Number(value));
const centMoney = value => hasMoneyValue(value) ? money(Number(value) / 100) : '--';
const timeText = value => value ? String(value).replace('T', ' ').slice(0, 16) : '';

function refundFacts(order, options = {}) {
  const refund = options.refund || null;
  const summaryUnknown = options.summaryState === REFUND_SUMMARY_UNKNOWN;
  const status = refund && refund.status || order.activeRefundStatus || order.latestRefundStatus || order.refundStatus || '';
  const id = refund && refund._id || order.activeRefundId || order.latestRefundId || '';
  return { status, id, summaryUnknown, active: ACTIVE_REFUND_STATUSES.includes(status) };
}

function actionFacts(order, refund, canRepurchase) {
  const failClosed = refund.summaryUnknown;
  const canRefundPayment = order.paymentStatus === 'paid' || (order.paymentMethod === 'credit' && ['credit_reserved', 'credit_invoiced'].includes(order.paymentStatus));
  return {
    canCancel: order.status === 'pending_payment' || (order.status === 'pending_confirmation' && order.paymentStatus !== 'paid'),
    canPay: order.status === 'pending_payment' && ['wechat', 'demo'].includes(order.paymentMethod),
    canConfirm: !failClosed && order.status === 'delivered' && !refund.active && !order.refundStatus,
    canRefund: !failClosed && canRefundPayment && ['pending_confirmation', 'picking', 'shipping', 'delivered', 'completed'].includes(order.status) && !refund.active && order.refundStatus !== 'refunded',
    canReview: order.status === 'completed',
    canInvoice: order.status === 'completed' && order.paymentStatus === 'paid',
    canRepurchase: Boolean(canRepurchase)
  };
}

function progress(order) {
  const currentIndex = PROGRESS_STEPS.indexOf(order.status);
  const timeline = PROGRESS_STEPS.map((key, index) => ({
    key,
    label: key === 'pending_payment' ? '订单已提交' : ORDER_STATUS_LABELS[key],
    done: currentIndex >= index,
    current: order.status === key,
    time: order.status === key ? timeText(index === 0 ? order.createdAt : order.updatedAt) : ''
  }));
  if (order.status === 'cancelled') timeline.push({ key: 'cancelled', label: '订单已取消', done: true, current: true, time: timeText(order.cancelledAt || order.updatedAt) });
  const progressHint = '以下为订单处理节点，不是实时物流轨迹；配送进展以订单状态或客服确认为准。';
  return {
    progressTitle: '订单处理进度',
    hasLiveTracking: false,
    progressHint,
    timeline,
    trackingSteps: timeline.map(item => ({ key: item.key, label: item.label, reached: item.done, current: item.current })),
    trackingHint: progressHint
  };
}

function orderItemSummary(items) {
  const rows = Array.isArray(items) ? items.filter(item => item && (item.productNameSnapshot || item.productName || item.skuId)) : [];
  if (!rows.length) return '';
  const labels = rows.slice(0, 3).map(item => {
    const name = item.productNameSnapshot || item.productName || '商品';
    const spec = item.specSnapshot || item.packageUnitSnapshot || '';
    const quantity = Number(item.quantity || 0);
    return `${name}${spec ? ` · ${spec}` : ''} ×${quantity > 0 ? quantity : 1}`;
  });
  return `${labels.join('、')}${rows.length > 3 ? ` 等 ${rows.length} 种商品` : ''}`;
}

function itemView(item) {
  const paid = item.paidSubtotalCent === undefined ? item.subtotalCent : item.paidSubtotalCent;
  return {
    id: item._id || item.skuId,
    skuId: item.skuId || '',
    name: item.productNameSnapshot || '订单商品',
    spec: [item.specSnapshot, item.packageUnitSnapshot].filter(Boolean).join(' · ') || '暂无规格信息',
    quantity: Number(item.quantity || 0),
    media: item.mediaSnapshot || '',
    unitPrice: hasMoneyValue(item.unitPriceCent) && Number.isInteger(Number(item.unitPriceCent)) ? money(Number(item.unitPriceCent) / 100) : '',
    subtotal: hasMoneyValue(paid) && Number.isInteger(Number(paid)) ? money(Number(paid) / 100) : ''
  };
}

function addressView(snapshot) {
  const address = snapshot || {};
  return {
    ...address,
    name: String(address.name || '').trim() === '演示用户' ? '收货人' : address.name || '',
    detail: String(address.detail || '').trim() === '梦食鲜演示收货点（非客户地址）' ? '已保存的收货地址' : address.detail || ''
  };
}

function statusText(order, refund) {
  return REFUND_STATUS_LABELS[refund.status] || ORDER_STATUS_LABELS[order.status] || '处理中';
}

function toOrderRow(order, options = {}) {
  const refund = refundFacts(order, options);
  return {
    id: order._id,
    orderNo: order.orderNo || '',
    summary: `订单 ${order.orderNo || order._id}`,
    itemSummary: orderItemSummary(order.items),
    total: centMoney(order.totalAmountCent),
    totalAmountCent: hasMoneyValue(order.totalAmountCent) ? Number(order.totalAmountCent) : null,
    amountLabel: order.paymentMethod === 'demo' ? '订单金额' : '实付',
    deliveryTime: order.deliverySlotSnapshot && order.deliverySlotSnapshot.name || '配送时间待确认',
    status: statusText(order, refund),
    rawStatus: order.status,
    paymentStatus: order.paymentStatus || '',
    refundStatus: order.refundStatus || '',
    afterSaleStatus: refund.status,
    afterSaleId: refund.id,
    afterSaleSummaryUnknown: refund.summaryUnknown,
    ...actionFacts(order, refund, false),
    ...progress(order)
  };
}

function toOrderDetail(order, items, refundSource, canRepurchase) {
  const refund = refundFacts(order, { summaryState: refundSource === REFUND_SUMMARY_UNKNOWN ? REFUND_SUMMARY_UNKNOWN : 'known', refund: refundSource === REFUND_SUMMARY_UNKNOWN ? null : refundSource });
  const fulfillmentType = order.fulfillmentType || 'delivery';
  return {
    id: order._id,
    orderNo: order.orderNo || order._id,
    rawStatus: order.status,
    statusText: statusText(order, refund),
    paymentMethod: order.paymentMethod || '',
    paymentStatus: order.paymentStatus || '',
    refundStatus: order.refundStatus || '',
    afterSaleStatus: refund.status,
    refundId: refund.id,
    afterSaleSummaryUnknown: refund.summaryUnknown,
    fulfillmentType,
    isPickup: fulfillmentType === 'pickup',
    address: addressView(order.addressSnapshot),
    pickupSite: order.pickupSiteSnapshot || {},
    deliverySlot: order.deliverySlotSnapshot || {},
    goodsTotal: centMoney(order.pricingSnapshot && order.pricingSnapshot.goodsAmountCent),
    discountTotal: centMoney(order.discountAmountCent === undefined ? order.pricingSnapshot && order.pricingSnapshot.discountAmountCent : order.discountAmountCent),
    couponSnapshot: order.couponSnapshot || null,
    freightTotal: centMoney(order.freightSnapshot && order.freightSnapshot.amountCent),
    total: centMoney(order.totalAmountCent),
    totalAmountCent: hasMoneyValue(order.totalAmountCent) ? Number(order.totalAmountCent) : null,
    createdAt: timeText(order.createdAt),
    updatedAt: timeText(order.updatedAt),
    items: (items || []).map(itemView),
    notificationAvailable: false,
    notificationText: '订单消息提醒尚未接入经过核验的服务端发送能力，当前不会显示为已订阅或已发送。',
    ...progress(order),
    ...actionFacts(order, refund, canRepurchase)
  };
}

function orderMatchesFilter(row, filter) {
  if (filter === '待付款') return row.rawStatus === 'pending_payment';
  if (filter === '待收货') return RECEIPT_ORDER_STATUSES.includes(row.rawStatus) && !row.refundStatus && !row.afterSaleStatus && !row.afterSaleSummaryUnknown;
  if (filter === '售后/退款') return Boolean(row.refundStatus || row.afterSaleStatus || row.afterSaleSummaryUnknown);
  return true;
}

module.exports = { money, toOrderRow, toOrderDetail, orderMatchesFilter, REFUND_SUMMARY_UNKNOWN };
