const { orders } = require('../../../services/index');
const { toOrderRow } = require('../../services/trade-format');

Page({
  data: { order: null, orderId: '', loading: true, failed: false, errorText: '订单读取失败，请重试或返回订单页核对。' },
  async onLoad(query) {
    const id = query && query.id;
    if (!id) return this.setData({ orderId: '', loading: false, failed: true, errorText: '缺少订单编号，请返回订单页核对。' });
    this.setData({ orderId: id });
    return this.loadOrder(id);
  },
  async loadOrder(id) {
    const orderId = id || this.data.orderId;
    if (!orderId) return this.setData({ loading: false, failed: true, errorText: '缺少订单编号，请返回订单页核对。' });
    const requestToken = (this._orderLoadSeq || 0) + 1;
    this._orderLoadSeq = requestToken;
    this.setData({ loading: true, failed: false, errorText: '' });
    const result = await orders.get(orderId);
    if (requestToken !== this._orderLoadSeq) return;
    const rawOrder = result && result.ok && result.data && result.data.order;
    if (!rawOrder) return this.setData({ order: null, loading: false, failed: true, errorText: result && result.error && result.error.message || '订单读取失败，请重试或返回订单页核对。' });
    const items = result.data.items || rawOrder.items || rawOrder.itemsSnapshot || [];
    this.setData({ order: toOrderRow({ ...rawOrder, items }), loading: false, failed: false, errorText: '' });
  },
  retry() { return this.loadOrder(); },
  finish() { wx.redirectTo({ url: '/package-trade/pages/orders/index?filter=全部订单' }); },
  back() { wx.redirectTo({ url: '/package-trade/pages/orders/index?filter=全部订单' }); }
});
