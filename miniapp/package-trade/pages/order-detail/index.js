const { orders, checkout, aftersales, auth } = require('../../../services/index');
const { money } = require('../../services/trade-format');

const STATUS_LABELS = { pending_payment: '待支付', pending_confirmation: '待确认', picking: '备货中', shipping: '配送中', delivered: '已送达', completed: '已完成', cancelled: '已取消' };
const STATUS_STEPS = ['pending_payment', 'pending_confirmation', 'picking', 'shipping', 'delivered', 'completed'];
const timeText = value => value ? String(value).replace('T', ' ').slice(0, 16) : '';
const itemText = item => { const paid = item.paidSubtotalCent === undefined ? item.subtotalCent : item.paidSubtotalCent; return { id: item._id || item.skuId, skuId: item.skuId || '', name: item.productNameSnapshot || '订单商品', spec: [item.specSnapshot, item.packageUnitSnapshot].filter(Boolean).join(' · ') || '暂无规格信息', quantity: Number(item.quantity || 0), media: item.mediaSnapshot || '', unitPrice: Number.isInteger(Number(item.unitPriceCent)) ? money(Number(item.unitPriceCent) / 100) : '', subtotal: Number.isInteger(Number(paid)) ? money(Number(paid) / 100) : '' }; };
const addressView = snapshot => {
  const address = snapshot || {};
  return {
    ...address,
    name: String(address.name || '').trim() === '演示用户' ? '收货人' : address.name || '',
    detail: String(address.detail || '').trim() === '梦食鲜演示收货点（非客户地址）' ? '已保存的收货地址' : address.detail || ''
  };
};
const isApprovedBusiness = user => Boolean(user && user.userType === 'b' && user.businessStatus === 'approved' && user.organizationId && user.status !== 'disabled');

function viewModel(order, items, refund, canRepurchase) {
  const statusIndex = STATUS_STEPS.indexOf(order.status);
  const timeline = STATUS_STEPS.map((key, index) => ({ key, label: STATUS_LABELS[key], done: statusIndex >= index, current: order.status === key, time: index === 0 ? timeText(order.createdAt) : order.status === key ? timeText(order.updatedAt) : '' }));
  if (order.status === 'cancelled') timeline.push({ key: 'cancelled', label: '订单已取消', done: true, current: true, time: timeText(order.cancelledAt || order.updatedAt) });
  const fulfillmentType = order.fulfillmentType || 'delivery';
  const afterSaleStatus = refund && refund.status || '';
  const activeAfterSale = ['requested', 'approved', 'awaiting_manual_refund', 'processing'].includes(afterSaleStatus);
  return {
    id: order._id, orderNo: order.orderNo || order._id, rawStatus: order.status, statusText: STATUS_LABELS[order.status] || '处理中',
    paymentMethod: order.paymentMethod || '', paymentStatus: order.paymentStatus || '', refundStatus: order.refundStatus || '', afterSaleStatus, refundId: refund && refund._id || '',
    fulfillmentType, isPickup: fulfillmentType === 'pickup', address: addressView(order.addressSnapshot), pickupSite: order.pickupSiteSnapshot || {}, deliverySlot: order.deliverySlotSnapshot || {},
    goodsTotal: money(Number(order.pricingSnapshot && order.pricingSnapshot.goodsAmountCent || 0) / 100),
    discountTotal: money(Number(order.discountAmountCent || order.pricingSnapshot && order.pricingSnapshot.discountAmountCent || 0) / 100), couponSnapshot: order.couponSnapshot || null,
    freightTotal: money(Number(order.freightSnapshot && order.freightSnapshot.amountCent || 0) / 100), total: money(Number(order.totalAmountCent || 0) / 100), totalAmountCent: Number(order.totalAmountCent || 0),
    createdAt: timeText(order.createdAt), updatedAt: timeText(order.updatedAt), items: (items || []).map(itemText), timeline,
    canCancel: order.status === 'pending_payment' || (order.status === 'pending_confirmation' && order.paymentStatus !== 'paid'),
    canPay: order.status === 'pending_payment' && ['wechat', 'demo'].includes(order.paymentMethod),
    canConfirm: order.status === 'delivered' && !order.refundStatus && !activeAfterSale,
    canRefund: order.paymentStatus === 'paid' && ['pending_confirmation', 'picking', 'shipping', 'delivered', 'completed'].includes(order.status) && !activeAfterSale && order.refundStatus !== 'refunded', canReview: order.status === 'completed', canInvoice: order.status === 'completed' && order.paymentStatus === 'paid', canRepurchase: Boolean(canRepurchase)
  };
}

Page({
  data: { orderId: '', status: 'loading', errorText: '', order: null, actionBusy: '' },
  onLoad(query = {}) {
    let orderId = query.id || '';
    try { orderId = decodeURIComponent(orderId); } catch (error) { orderId = ''; }
    this.setData({ orderId });
    return this.loadOrder();
  },
  async loadOrder() {
    const id = this.data.orderId;
    if (!id) return this.setData({ status: 'empty', errorText: '订单编号无效或订单不存在' });
    const token = (this._loadSeq || 0) + 1; this._loadSeq = token;
    this.setData({ status: 'loading', errorText: '' });
    const refundPromise = aftersales && typeof aftersales.list === 'function' ? aftersales.list({ page: 1, pageSize: 100 }) : Promise.resolve({ ok: true, data: { rows: [] } });
    const [result, refundResult, me] = await Promise.all([orders.get(id), refundPromise, auth.getMe()]);
    if (token !== this._loadSeq) return;
    if (!result || !result.ok || !result.data || !result.data.order) {
      const code = result && result.error && result.error.code;
      return this.setData({ status: code === 'ORDER_NOT_FOUND' ? 'empty' : 'error', errorText: result && result.error && result.error.message || '订单详情暂时无法加载，请稍后重试' });
    }
    const rawOrder = result.data.order;
    const items = result.data.items || rawOrder.items || rawOrder.itemsSnapshot || [];
    const refund = (refundResult && refundResult.ok && refundResult.data && refundResult.data.rows || []).find(item => item.orderId === id) || null;
    const user = me && me.ok && me.data && me.data.user;
    this.setData({ status: 'ready', order: viewModel(rawOrder, items, refund, isApprovedBusiness(user)), errorText: '' });
  },
  retry() { return this.loadOrder(); },
  confirmAction(options, action) { wx.showModal({ ...options, success: result => { if (result.confirm) action(); } }); },
  cancelOrder() { return this.confirmAction({ title: '取消订单', content: '取消后订单无法恢复，确定继续吗？', confirmText: '取消订单', confirmColor: '#e65353' }, () => this.runAction('cancel', () => orders.cancel({ id: this.data.orderId }), '订单已取消')); },
  confirmReceipt() { return this.confirmAction({ title: '确认收货', content: '请确认商品已经收到。', confirmText: '确认收货' }, () => this.runAction('confirm', () => orders.confirm({ id: this.data.orderId }), '已确认收货')); },
  async runAction(type, request, successText) {
    if (this.data.actionBusy) return;
    this.setData({ actionBusy: type });
    try {
      const result = await request();
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '订单操作失败，请重试', icon: 'none' });
      await this.loadOrder(); wx.showToast({ title: successText, icon: 'success' });
    } finally { this.setData({ actionBusy: '' }); }
  },
  async preparePayment() {
    const order = this.data.order;
    if (!order || this.data.actionBusy) return;
    if (order.paymentMethod === 'demo') return wx.navigateTo({ url: `/package-trade/pages/demo-payment/index?id=${encodeURIComponent(order.id)}` });
    this.setData({ actionBusy: 'pay' });
    try {
      const result = await checkout.preparePayment({ orderId: order.id });
      const params = result && result.ok && result.data && result.data.params;
      if (!params) return wx.showToast({ title: result && result.error && result.error.message || '微信支付暂不可用', icon: 'none' });
      if (typeof wx.requestPayment !== 'function') return wx.showToast({ title: '当前微信版本无法发起支付', icon: 'none' });
      wx.requestPayment({ ...params, success: () => this.loadOrder(), fail: error => { if (!/cancel/i.test(String(error && error.errMsg || ''))) wx.showToast({ title: '支付未完成，请稍后重试', icon: 'none' }); } });
    } finally { this.setData({ actionBusy: '' }); }
  },
  applyAftersale() { wx.navigateTo({ url: `/package-trade/pages/aftersale-apply/index?orderId=${encodeURIComponent(this.data.orderId)}` }); },
  async repurchase() { const me = await auth.getMe(); const user = me && me.ok && me.data && me.data.user; if (!isApprovedBusiness(user)) return wx.showToast({ title: '再次购买仅对企业采购账户开放', icon: 'none' }); wx.navigateTo({ url: `/package-business/pages/repurchase/index?orderId=${encodeURIComponent(this.data.orderId)}` }); },
  reviewOrder() { wx.navigateTo({ url: `/package-member/pages/reviews/index?orderId=${encodeURIComponent(this.data.orderId)}` }); },
  requestInvoice() { wx.navigateTo({ url: `/package-member/pages/invoices/index?orderId=${encodeURIComponent(this.data.orderId)}` }); },
  viewAftersale() { wx.navigateTo({ url: `/package-trade/pages/aftersale-detail/index?id=${encodeURIComponent(this.data.order.refundId || '')}&orderId=${encodeURIComponent(this.data.orderId)}` }); },
  back() { wx.navigateBack(); }
});
