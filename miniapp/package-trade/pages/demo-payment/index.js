const { orders } = require('../../../services/index');
const { toOrderRow } = require('../../services/trade-format');
const { testPaymentStateFromOrder } = require('../../../modules/payment-recovery');

Page({
  data: { order: null, orderId: '', loading: true, failed: false, retryable: false, errorText: '订单读取失败，请重试或返回订单页核对。', paymentPresentation: null },
  async onLoad(query) {
    const id = query && typeof query.id === 'string' ? query.id.trim() : '';
    if (!id) return this.setData({ order: null, orderId: '', loading: false, failed: true, retryable: false, errorText: '缺少订单编号，请返回订单页核对。', paymentPresentation: null });
    this.setData({ orderId: id });
    return this.loadOrder(id);
  },
  async loadOrder(id) {
    const orderId = id || this.data.orderId;
    if (!orderId) return this.setData({ order: null, loading: false, failed: true, retryable: false, errorText: '缺少订单编号，请返回订单页核对。' });
    const requestToken = (this._orderLoadSeq || 0) + 1;
    this._orderLoadSeq = requestToken;
    this.setData({ loading: true, failed: false, retryable: false, errorText: '' });
    const result = await orders.get(orderId);
    if (requestToken !== this._orderLoadSeq) return;
    const rawOrder = result && result.ok && result.data && result.data.order;
    if (!rawOrder) {
      const code = result && result.error && result.error.code;
      const retryable = !['ORDER_NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'UNAUTHENTICATED', 'AUTH_ACCOUNT_DISABLED', 'VALIDATION_ERROR'].includes(code);
      return this.setData({ order: null, loading: false, failed: true, retryable, errorText: result && result.error && result.error.message || (retryable ? '订单读取失败，请重试或返回订单页核对。' : '暂时无法查看此订单，请返回订单页核对。'), paymentPresentation: null });
    }
    const items = result.data.items || rawOrder.items || rawOrder.itemsSnapshot || [];
    this.setData({ order: toOrderRow({ ...rawOrder, items }), loading: false, failed: false, retryable: false, errorText: '', paymentPresentation: testPaymentStateFromOrder(rawOrder) });
  },
  retry() { if (this.data.retryable && !this.data.loading) return this.loadOrder(); },
  finish() { wx.redirectTo({ url: '/package-trade/pages/orders/index?filter=全部订单' }); },
  back() { wx.redirectTo({ url: '/package-trade/pages/orders/index?filter=全部订单' }); }
});
