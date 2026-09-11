const { orders, refunds } = require('../../../services/index');
const { toOrderRow, orderMatchesFilter } = require('../../services/trade-format');
const FILTERS = ['全部订单', '待付款', '待收货', '售后/退款'];
const decodeFilter = (value) => {
  const raw = String(value || '');
  try { return decodeURIComponent(raw); } catch (error) { return raw; }
};

Page({
  data: { filters: FILTERS, filter: '全部订单', rows: [], loading: true, error: false, errorText: '订单加载失败，请稍后重试', emptyTitle: '暂无订单记录', emptyHint: '下单后会在这里显示订单状态和预计送达时间', actionBusyId: '' },
  onLoad(query) {
    const filter = decodeFilter(query && query.filter);
    this.setData({ filter: FILTERS.includes(filter) ? filter : '全部订单' }, () => this.loadOrders());
  },
  async loadOrders() {
    const requestToken = (this._orderLoadSeq || 0) + 1;
    this._orderLoadSeq = requestToken;
    this.setData({ loading: true, error: false });
    const result = await orders.list({ page: 1, pageSize: 30 });
    if (requestToken !== this._orderLoadSeq) return;
    if (!result || !result.ok) return this.setData({ rows: [], loading: false, error: true, errorText: result && result.error && result.error.message || '订单加载失败，请稍后重试' });
    const allRows = result && result.ok && result.data && Array.isArray(result.data.rows) ? result.data.rows.map(toOrderRow) : [];
    const rows = allRows.filter((item) => orderMatchesFilter(item, this.data.filter));
    const hasFilter = this.data.filter !== '全部订单';
    this.setData({ rows, loading: false, error: false, emptyTitle: hasFilter ? `暂无${this.data.filter}订单` : '暂无订单记录', emptyHint: hasFilter ? '订单状态变化后会显示在这里' : '下单后会在这里显示订单状态和预计送达时间' });
  },
  switchFilter(event) {
    const filter = FILTERS.includes(event.currentTarget.dataset.filter) ? event.currentTarget.dataset.filter : '全部订单';
    // 快速切换筛选时先进入加载态，避免旧筛选数据残留误导
    this.setData({ filter, loading: true, rows: [], error: false }, () => this.loadOrders());
  },
  retry() { this.loadOrders(); },
  async runOrderAction(id, action) {
    if (!id || this.data.actionBusyId) return;
    this.setData({ actionBusyId: id });
    try { await action(); } finally { this.setData({ actionBusyId: '' }); }
  },
  cancel(event) { const id = event.currentTarget.dataset.id; return this.runOrderAction(id, async () => { const result = await orders.cancel({ id }); if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '订单取消失败', icon: 'none' }); await this.loadOrders(); wx.showToast({ title: '订单已取消', icon: 'success' }); }); },
  confirm(event) { const id = event.currentTarget.dataset.id; return this.runOrderAction(id, async () => { const result = await orders.confirm({ id }); if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '确认收货失败', icon: 'none' }); await this.loadOrders(); wx.showToast({ title: '已确认收货', icon: 'success' }); }); },
  refund(event) {
    const row = this.data.rows.find((item) => item.id === event.currentTarget.dataset.id);
    if (!row) return;
    return this.runOrderAction(row.id, async () => {
      // 幂等键按订单复用：网络超时重试不会产生重复售后单（与主包内嵌订单页口径一致）
      this._refundKeyMap = this._refundKeyMap || {};
      const key = this._refundKeyMap[row.id] || `mini-refund-${row.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this._refundKeyMap[row.id] = key;
      const result = await refunds.request({ orderId: row.id, idempotencyKey: key, amountCent: row.totalAmountCent, reason: '客户申请售后' });
      if (!result || !result.ok) {
        const code = result && result.error && result.error.code;
        if (code !== 'REQUEST_FAILED') delete this._refundKeyMap[row.id];
        return wx.showToast({ title: result && result.error && result.error.message || '售后申请失败', icon: 'none' });
      }
      delete this._refundKeyMap[row.id];
      await this.loadOrders();
      wx.showToast({ title: '售后申请已提交', icon: 'success' });
    });
  },
  back() { wx.navigateBack(); }
});
