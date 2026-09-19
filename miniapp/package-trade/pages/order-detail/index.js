const { orders, checkout, aftersales, auth } = require('../../../services/index');
const { toOrderDetail, REFUND_SUMMARY_UNKNOWN } = require('../../../modules/order-presentation');
const { createPaymentRecovery, createWechatPaymentPort } = require('../../../modules/payment-recovery');
const { createOrderActionSession } = require('../../../modules/order-action-session');

const { isApprovedBusiness } = require('../../../modules/identity-state');

Page({
  data: { orderId: '', status: 'loading', errorText: '', order: null, actionBusy: '', actionRecovery: null, paymentRecovery: null },
  onLoad(query = {}) {
    let orderId = query.id || '';
    try { orderId = decodeURIComponent(orderId); } catch (error) { orderId = ''; }
    this._paymentRecovery = createPaymentRecovery({
      preparePayment: payload => checkout.preparePayment(payload),
      invokePayment: createWechatPaymentPort(wx),
      getOrder: id => orders.get(id)
    });
    this._orderActionSession = createOrderActionSession({
      getOrder: id => orders.get(id),
      cancelOrder: payload => orders.cancel(payload),
      completeOrder: payload => orders.confirm(payload)
    });
    this.setData({ orderId });
    return this.loadOrder();
  },
  async loadOrder() {
    const id = this.data.orderId;
    if (!id) return this.setData({ status: 'empty', errorText: '订单编号无效或订单不存在' });
    const token = (this._loadSeq || 0) + 1; this._loadSeq = token;
    this.setData({ status: 'loading', errorText: '' });
    const refundPromise = aftersales && typeof aftersales.listAll === 'function' ? aftersales.listAll() : Promise.resolve({ ok: false, error: { code: 'REFUND_SUMMARY_UNAVAILABLE' } });
    const [result, refundResult, me] = await Promise.all([orders.get(id), refundPromise, auth.getMe()]);
    if (token !== this._loadSeq) return;
    if (!result || !result.ok || !result.data || !result.data.order) {
      const code = result && result.error && result.error.code;
      return this.setData({ status: code === 'ORDER_NOT_FOUND' ? 'empty' : 'error', errorText: result && result.error && result.error.message || '订单详情暂时无法加载，请稍后重试' });
    }
    const rawOrder = result.data.order;
    const items = result.data.items || rawOrder.items || rawOrder.itemsSnapshot || [];
    const refund = refundResult && refundResult.ok ? ((refundResult.data && refundResult.data.rows || []).find(item => item.orderId === id) || null) : REFUND_SUMMARY_UNKNOWN;
    const user = me && me.ok && me.data && me.data.user;
    this.setData({ status: 'ready', order: toOrderDetail(rawOrder, items, refund, isApprovedBusiness(user)), errorText: '' });
  },
  retry() { return this.loadOrder(); },
  confirmAction(options, action) { wx.showModal({ ...options, success: result => { if (result.confirm) action(); } }); },
  cancelOrder() { return this.confirmAction({ title: '取消订单', content: '取消后订单无法恢复，确定继续吗？', confirmText: '取消订单', confirmColor: '#e65353' }, () => this.runAction('cancel', '订单已取消')); },
  confirmReceipt() { return this.confirmAction({ title: '确认收货', content: '请确认商品已经收到。', confirmText: '确认收货' }, () => this.runAction('confirm', '已确认收货')); },
  async runAction(type, successText) {
    if (this.data.actionBusy) return;
    this.setData({ actionBusy: type });
    try {
      const result = await this._orderActionSession.run(type, this.data.orderId);
      if (result.kind !== 'unknown') await this.loadOrder();
      this.setData({ actionRecovery: result.kind === 'unknown' ? result : null });
      wx.showToast({ title: result.kind === 'succeeded' ? successText : result.text || '订单操作失败，请重试', icon: result.kind === 'succeeded' ? 'success' : 'none' });
      return result;
    } finally { this.setData({ actionBusy: '' }); }
  },
  async resolveOrderAction() {
    if (this.data.actionBusy) return;
    this.setData({ actionBusy: 'resolve' });
    try {
      const result = await this._orderActionSession.resolve(this.data.orderId);
      if (result.kind !== 'unknown') {
        this.setData({ actionRecovery: null });
        await this.loadOrder();
      } else this.setData({ actionRecovery: result });
      wx.showToast({ title: result.text || '订单状态已刷新', icon: result.kind === 'succeeded' ? 'success' : 'none' });
      return result;
    } finally { this.setData({ actionBusy: '' }); }
  },
  async preparePayment() {
    const order = this.data.order;
    if (!order || this.data.actionBusy) return;
    if (order.paymentMethod === 'demo') return wx.navigateTo({ url: `/package-trade/pages/demo-payment/index?id=${encodeURIComponent(order.id)}` });
    this.setData({ actionBusy: 'pay', paymentRecovery: { kind: 'processing', text: '正在唤起微信支付', canRetry: false } });
    try {
      const result = await this._paymentRecovery.start(order.id);
      if (['paid', 'closed', 'pending'].includes(result.kind)) await this.loadOrder();
      this.setData({ paymentRecovery: result });
      if (result.kind === 'paid') wx.showToast({ title: '支付结果已确认', icon: 'success' });
      if (result.kind === 'unavailable') wx.showToast({ title: result.text, icon: 'none' });
    } finally { this.setData({ actionBusy: '' }); }
  },
  async queryPaymentResult() {
    const order = this.data.order;
    if (!order || this.data.actionBusy) return;
    this.setData({ actionBusy: 'pay-query', paymentRecovery: { kind: 'processing', text: '正在查询支付结果', canRetry: false } });
    try {
      const result = await this._paymentRecovery.query(order.id);
      if (['paid', 'closed', 'pending'].includes(result.kind)) await this.loadOrder();
      this.setData({ paymentRecovery: result });
      if (result.kind === 'paid') wx.showToast({ title: '支付结果已确认', icon: 'success' });
    } finally { this.setData({ actionBusy: '' }); }
  },
  applyAftersale() { wx.navigateTo({ url: `/package-trade/pages/aftersale-apply/index?orderId=${encodeURIComponent(this.data.orderId)}` }); },
  async repurchase() { const me = await auth.getMe(); const user = me && me.ok && me.data && me.data.user; if (!isApprovedBusiness(user)) return wx.showToast({ title: '再次购买仅对企业采购账户开放', icon: 'none' }); wx.navigateTo({ url: `/package-business/pages/repurchase/index?orderId=${encodeURIComponent(this.data.orderId)}` }); },
  reviewOrder() { wx.navigateTo({ url: `/package-member/pages/reviews/index?orderId=${encodeURIComponent(this.data.orderId)}` }); },
  requestInvoice() { wx.navigateTo({ url: `/package-member/pages/invoices/index?orderId=${encodeURIComponent(this.data.orderId)}` }); },
  viewAftersale() { wx.navigateTo({ url: `/package-trade/pages/aftersale-detail/index?id=${encodeURIComponent(this.data.order.refundId || '')}&orderId=${encodeURIComponent(this.data.orderId)}` }); },
  back() { wx.navigateBack(); }
});
