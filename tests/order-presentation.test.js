const assert = require('assert/strict');
const {
  toOrderRow,
  toOrderDetail,
  orderMatchesFilter,
  REFUND_SUMMARY_UNKNOWN
} = require('../miniapp/modules/order-presentation');

const baseOrder = {
  _id: 'order-1',
  orderNo: 'M001',
  status: 'delivered',
  paymentStatus: 'paid',
  paymentMethod: 'wechat',
  fulfillmentType: 'delivery',
  addressSnapshot: { name: '张三', phoneMasked: '138****0000', detail: '科技园 1 号' },
  deliverySlotSnapshot: { name: '明日上午' },
  pricingSnapshot: { goodsAmountCent: 3200 },
  freightSnapshot: { amountCent: 500 },
  totalAmountCent: 3700,
  createdAt: '2026-09-12T08:00:00.000Z',
  updatedAt: '2026-09-12T10:00:00.000Z'
};
const items = [{ _id: 'item-1', skuId: 'sku-1', productNameSnapshot: '鱼丸', specSnapshot: '500g', quantity: 2, unitPriceCent: 1600, subtotalCent: 3200 }];

const row = toOrderRow({ ...baseOrder, items }, { summaryState: 'known', refund: null });
const detail = toOrderDetail(baseOrder, items, null, false);
assert.equal(row.status, detail.statusText, 'list and detail must share the same order status label');
assert.equal(row.canConfirm, detail.canConfirm, 'list and detail must share confirm eligibility');
assert.equal(row.canRefund, detail.canRefund, 'list and detail must share aftersale eligibility');
assert.equal(detail.items[0].name, '鱼丸');
assert.equal(detail.items[0].unitPrice, '16.00');
assert.equal(detail.total, '37.00');
assert.equal(detail.progressTitle, '订单处理进度');
assert.equal(detail.hasLiveTracking, false);
assert(detail.progressHint.includes('不是实时物流轨迹'));
assert.equal(detail.notificationAvailable, false);
assert(detail.notificationText.includes('不会显示为已订阅或已发送'));
assert.equal(detail.timeline.find(item => item.key === 'shipping').time, '', 'derived past states must not invent event timestamps');
assert.equal(detail.timeline.find(item => item.key === 'delivered').time, '2026-09-12 10:00', 'only the current known state may use order updatedAt');

const unknownRefundRow = toOrderRow(baseOrder, { summaryState: REFUND_SUMMARY_UNKNOWN });
assert.equal(unknownRefundRow.afterSaleSummaryUnknown, true);
assert.equal(unknownRefundRow.canConfirm, false, 'unknown aftersale summary must fail closed for receipt confirmation');
assert.equal(unknownRefundRow.canRefund, false, 'unknown aftersale summary must fail closed for a new request');
assert.equal(orderMatchesFilter(unknownRefundRow, '售后/退款'), true, 'unknown summaries must not be presented as a confirmed empty aftersale filter');

const refund = { _id: 'refund-1', status: 'processing' };
const refundedRow = toOrderRow(baseOrder, { summaryState: 'known', refund });
const refundedDetail = toOrderDetail(baseOrder, items, refund, false);
assert.equal(refundedRow.afterSaleId, 'refund-1');
assert.equal(refundedRow.status, refundedDetail.statusText);
assert.equal(refundedRow.canConfirm, false);
assert.equal(refundedDetail.canConfirm, false);

const channelPending = toOrderRow(baseOrder, { summaryState: 'known', refund: { _id: 'refund-channel', status: 'channel_pending' } });
assert.equal(channelPending.status, '退款渠道处理中');
assert.equal(channelPending.canConfirm, false, 'channel processing must keep receipt confirmation closed');
assert.equal(channelPending.canRefund, false, 'channel processing must not allow a duplicate aftersale');
const partiallyRefunded = toOrderRow({ ...baseOrder, refundStatus: 'partially_refunded' }, { summaryState: 'known', refund: null });
assert.equal(partiallyRefunded.status, '部分退款完成');
const missingAmounts = toOrderDetail({ ...baseOrder, totalAmountCent: undefined, pricingSnapshot: undefined, freightSnapshot: undefined }, items, null, false);
assert.equal(missingAmounts.total, '--');
assert.equal(missingAmounts.goodsTotal, '--');
assert.equal(missingAmounts.freightTotal, '--');
const missingItemMoney = toOrderDetail(baseOrder, [{ ...items[0], unitPriceCent: null, subtotalCent: '' }], null, false);
assert.equal(missingItemMoney.items[0].unitPrice, '');
assert.equal(missingItemMoney.items[0].subtotal, '');
for (const missing of [null, '']) {
  const missingValueRow = toOrderRow({ ...baseOrder, totalAmountCent: missing }, { summaryState: 'known', refund: null });
  assert.equal(missingValueRow.total, '--', 'null and blank money must remain unknown');
  assert.equal(missingValueRow.totalAmountCent, null);
}
const creditReserved = toOrderRow({ ...baseOrder, paymentMethod: 'credit', paymentStatus: 'credit_reserved' }, { summaryState: 'known', refund: null });
const creditInvoiced = toOrderRow({ ...baseOrder, paymentMethod: 'credit', paymentStatus: 'credit_invoiced' }, { summaryState: 'known', refund: null });
assert.equal(creditReserved.canRefund, true, 'reserved credit orders follow the server aftersale contract');
assert.equal(creditInvoiced.canRefund, true, 'invoiced credit orders follow the server aftersale contract');

const demoSnapshot = { ...baseOrder, addressSnapshot: { name: '演示用户', detail: '梦食鲜演示收货点（非客户地址）' } };
const demoDetail = toOrderDetail(demoSnapshot, items, null, false);
assert.equal(demoDetail.address.name, '收货人');
assert.equal(demoDetail.address.detail, '已保存的收货地址');
assert.equal(demoSnapshot.addressSnapshot.name, '演示用户', 'presentation must not mutate an order snapshot');

console.log('order presentation test: passed');
