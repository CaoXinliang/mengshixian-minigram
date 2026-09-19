const { orders, aftersales } = require('../../../services/index');
const { toOrderRow, orderMatchesFilter, REFUND_SUMMARY_UNKNOWN } = require('../../../modules/order-presentation');
const { createOrderActionSession } = require('../../../modules/order-action-session');
const FILTERS = ['全部订单', '待付款', '待收货', '售后/退款'];
const decodeFilter = (value) => {
  const raw = String(value || '');
  try { return decodeURIComponent(raw); } catch (error) { return raw; }
};

Page({
  data: {
    filters: FILTERS, filter: '全部订单', rows: [], sourceRows: [], loading: true, error: false,
    errorText: '订单加载失败，请稍后重试', emptyTitle: '暂无订单记录', emptyHint: '下单后会在这里显示订单状态和预计送达时间',
    actionBusyId: '', actionBusyType: '', actionRecoveryId: '', actionRecoveryText: '', afterSaleSummaryWarning: false, nextPage: 1, total: 0, hasMore: false, loadingMore: false, loadMoreError: false
  },
  onLoad(query) {
    const filter = decodeFilter(query && query.filter);
    this.setData({ filter: FILTERS.includes(filter) ? filter : '全部订单' }, () => this.loadOrders({ reset: true }));
  },
  async loadOrders(options = {}) {
    const append = Boolean(options && options.append);
    if (append && (!this.data.hasMore || this.data.loadingMore)) return;
    const requestToken = (this._orderLoadSeq || 0) + 1;
    this._orderLoadSeq = requestToken;
    const page = append ? Math.max(2, Number(this.data.nextPage || 2)) : 1;
    this.setData(append ? { loadingMore: true, loadMoreError: false } : { loading: true, error: false, loadMoreError: false });
    const refundPromise = aftersales && typeof aftersales.listAll === 'function' ? aftersales.listAll() : Promise.resolve({ ok: false, error: { code: 'REFUND_SUMMARY_UNAVAILABLE' } });
    const [result, refundResult] = await Promise.all([orders.list({ page, pageSize: 30 }), refundPromise]);
    if (requestToken !== this._orderLoadSeq) return;
    if (!result || !result.ok) {
      if (append) return this.setData({ loadingMore: false, loadMoreError: true });
      return this.setData({ rows: [], sourceRows: [], loading: false, error: true, errorText: result && result.error && result.error.message || '订单加载失败，请稍后重试', hasMore: false, loadingMore: false });
    }
    const refundSummaryState = refundResult && refundResult.ok ? 'known' : REFUND_SUMMARY_UNKNOWN;
    const refundsByOrder = {};
    for (const refund of refundResult && refundResult.ok && refundResult.data && refundResult.data.rows || []) {
      if (!refundsByOrder[refund.orderId]) refundsByOrder[refund.orderId] = refund;
    }
    const loaded = result && result.data && Array.isArray(result.data.rows) ? result.data.rows.map(order => {
      const refund = refundsByOrder[order._id] || null;
      return toOrderRow(order, { summaryState: refundSummaryState, refund });
    }) : [];
    const sourceRows = append ? [...this.data.sourceRows, ...loaded].filter((item, index, all) => all.findIndex((row) => row.id === item.id) === index) : loaded;
    const rows = sourceRows.filter((item) => orderMatchesFilter(item, this.data.filter));
    const total = Math.max(sourceRows.length, Number(result && result.data && result.data.total || 0));
    const hasFilter = this.data.filter !== '全部订单';
    this.setData({
      sourceRows, rows, total, nextPage: page + 1, hasMore: sourceRows.length < total,
      afterSaleSummaryWarning: this.data.filter === '售后/退款' && refundSummaryState === REFUND_SUMMARY_UNKNOWN,
      loading: false, loadingMore: false, loadMoreError: false, error: false,
      emptyTitle: hasFilter ? `暂无${this.data.filter}订单` : '暂无订单记录',
      emptyHint: hasFilter ? '订单状态变化后会显示在这里' : '下单后会在这里显示订单状态和预计送达时间'
    });
  },
  switchFilter(event) {
    const filter = FILTERS.includes(event.currentTarget.dataset.filter) ? event.currentTarget.dataset.filter : '全部订单';
    this.setData({ filter, loading: true, rows: [], sourceRows: [], error: false, hasMore: false, nextPage: 1, loadMoreError: false }, () => this.loadOrders({ reset: true }));
  },
  retry() { this.loadOrders({ reset: true }); },
  loadMore() { this.loadOrders({ append: true }); },
  openDetail(event) {
    const id = event.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: `/package-trade/pages/order-detail/index?id=${encodeURIComponent(id)}` });
  },
  confirmAction(options, onConfirm) {
    if (typeof wx === 'undefined' || typeof wx.showModal !== 'function') return onConfirm();
    wx.showModal({ ...options, success: (result) => { if (result.confirm) onConfirm(); } });
  },
  orderActionSession() {
    if (!this._orderActionSession) this._orderActionSession = createOrderActionSession({
      getOrder: id => orders.get(id),
      cancelOrder: payload => orders.cancel(payload),
      completeOrder: payload => orders.confirm(payload)
    });
    return this._orderActionSession;
  },
  async runOrderAction(id, actionType, successText) {
    if (!id || this.data.actionBusyId) return;
    this.setData({ actionBusyId: id, actionBusyType: actionType });
    try {
      const result = await this.orderActionSession().run(actionType, id);
      if (result.kind !== 'unknown') await this.loadOrders({ reset: true });
      this.setData(result.kind === 'unknown' ? { actionRecoveryId: id, actionRecoveryText: result.text } : { actionRecoveryId: '', actionRecoveryText: '' });
      wx.showToast({ title: result.kind === 'succeeded' ? successText : result.text || '订单操作失败，请稍后重试', icon: result.kind === 'succeeded' ? 'success' : 'none' });
      return result;
    } finally { this.setData({ actionBusyId: '', actionBusyType: '' }); }
  },
  async resolveOrderAction(event) {
    const id = event.currentTarget.dataset.id || this.data.actionRecoveryId;
    if (!id || this.data.actionBusyId) return;
    this.setData({ actionBusyId: id, actionBusyType: 'resolve' });
    try {
      const result = await this.orderActionSession().resolve(id);
      if (result.kind !== 'unknown') {
        this.setData({ actionRecoveryId: '', actionRecoveryText: '' });
        await this.loadOrders({ reset: true });
      } else this.setData({ actionRecoveryId: id, actionRecoveryText: result.text });
      wx.showToast({ title: result.text || '订单状态已刷新', icon: result.kind === 'succeeded' ? 'success' : 'none' });
      return result;
    } finally { this.setData({ actionBusyId: '', actionBusyType: '' }); }
  },
  cancel(event) {
    const id = event.currentTarget.dataset.id;
    return this.confirmAction({ title: '取消订单', content: '取消后本次订单将不能恢复，确定取消吗？', confirmText: '取消订单', confirmColor: '#e65353' }, () => this.runOrderAction(id, 'cancel', '订单已取消'));
  },
  confirm(event) {
    const id = event.currentTarget.dataset.id;
    return this.confirmAction({ title: '确认收货', content: '确认后订单将完成，请确认商品已经收到。', confirmText: '确认收货' }, () => this.runOrderAction(id, 'confirm', '已确认收货'));
  },
  refund(event) {
    const row = this.data.rows.find((item) => item.id === event.currentTarget.dataset.id);
    if (!row) return;
    if (this.data.actionBusyId) return;
    wx.navigateTo({ url: `/package-trade/pages/aftersale-apply/index?orderId=${encodeURIComponent(row.id)}` });
  },
  viewAftersale(event) {
    const row = this.data.rows.find(item => item.id === event.currentTarget.dataset.id);
    if (row && row.afterSaleId) wx.navigateTo({ url: `/package-trade/pages/aftersale-detail/index?id=${encodeURIComponent(row.afterSaleId)}&orderId=${encodeURIComponent(row.id)}` });
  },
  noop() {},
  back() { wx.navigateBack(); }
});
