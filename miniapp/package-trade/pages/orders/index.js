const { orders, refunds } = require('../../../services/index');
const { toOrderRow, orderMatchesFilter } = require('../../services/trade-format');
const FILTERS = ['全部订单', '待付款', '待收货', '售后/退款'];
const decodeFilter = (value) => {
  const raw = String(value || '');
  try { return decodeURIComponent(raw); } catch (error) { return raw; }
};

Page({
  data: {
    filters: FILTERS, filter: '全部订单', rows: [], sourceRows: [], loading: true, error: false,
    errorText: '订单加载失败，请稍后重试', emptyTitle: '暂无订单记录', emptyHint: '下单后会在这里显示订单状态和预计送达时间',
    actionBusyId: '', actionBusyType: '', nextPage: 1, total: 0, hasMore: false, loadingMore: false, loadMoreError: false,
    refundFormVisible: false, refundTarget: null, refundReason: ''
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
    const result = await orders.list({ page, pageSize: 30 });
    if (requestToken !== this._orderLoadSeq) return;
    if (!result || !result.ok) {
      if (append) return this.setData({ loadingMore: false, loadMoreError: true });
      return this.setData({ rows: [], sourceRows: [], loading: false, error: true, errorText: result && result.error && result.error.message || '订单加载失败，请稍后重试', hasMore: false, loadingMore: false });
    }
    const loaded = result && result.data && Array.isArray(result.data.rows) ? result.data.rows.map(toOrderRow) : [];
    const sourceRows = append ? [...this.data.sourceRows, ...loaded].filter((item, index, all) => all.findIndex((row) => row.id === item.id) === index) : loaded;
    const rows = sourceRows.filter((item) => orderMatchesFilter(item, this.data.filter));
    const total = Math.max(sourceRows.length, Number(result && result.data && result.data.total || 0));
    const hasFilter = this.data.filter !== '全部订单';
    this.setData({
      sourceRows, rows, total, nextPage: page + 1, hasMore: sourceRows.length < total,
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
  confirmAction(options, onConfirm) {
    if (typeof wx === 'undefined' || typeof wx.showModal !== 'function') return onConfirm();
    wx.showModal({ ...options, success: (result) => { if (result.confirm) onConfirm(); } });
  },
  async runOrderAction(id, actionType, action) {
    if (!id || this.data.actionBusyId) return;
    this.setData({ actionBusyId: id, actionBusyType: actionType });
    try { await action(); } finally { this.setData({ actionBusyId: '', actionBusyType: '' }); }
  },
  cancel(event) {
    const id = event.currentTarget.dataset.id;
    return this.confirmAction({ title: '取消订单', content: '取消后本次订单将不能恢复，确定取消吗？', confirmText: '取消订单', confirmColor: '#e65353' }, () => this.runOrderAction(id, 'cancel', async () => {
      const result = await orders.cancel({ id });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '订单取消失败，请稍后重试', icon: 'none' });
      await this.loadOrders({ reset: true });
      wx.showToast({ title: '订单已取消', icon: 'success' });
    }));
  },
  confirm(event) {
    const id = event.currentTarget.dataset.id;
    return this.confirmAction({ title: '确认收货', content: '确认后订单将完成，请确认商品已经收到。', confirmText: '确认收货' }, () => this.runOrderAction(id, 'confirm', async () => {
      const result = await orders.confirm({ id });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '确认收货失败，请稍后重试', icon: 'none' });
      await this.loadOrders({ reset: true });
      wx.showToast({ title: '已确认收货', icon: 'success' });
    }));
  },
  refund(event) {
    const row = this.data.rows.find((item) => item.id === event.currentTarget.dataset.id);
    if (!row) return;
    if (this.data.actionBusyId) return;
    this.setData({ refundFormVisible: true, refundTarget: row, refundReason: '' });
  },
  closeRefundForm() { this.setData({ refundFormVisible: false, refundTarget: null, refundReason: '' }); },
  onRefundReasonInput(event) { this.setData({ refundReason: String(event.detail && event.detail.value || '').slice(0, 300) }); },
  submitRefund() {
    const row = this.data.refundTarget;
    const reason = String(this.data.refundReason || '').trim();
    if (!row) return this.closeRefundForm();
    if (reason.length < 2) return wx.showToast({ title: '请写明售后原因', icon: 'none' });
    this.closeRefundForm();
    return this.runOrderAction(row.id, 'refund', async () => {
      this._refundKeyMap = this._refundKeyMap || {};
      const key = this._refundKeyMap[row.id] || `mini-refund-${row.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this._refundKeyMap[row.id] = key;
      const result = await refunds.request({ orderId: row.id, idempotencyKey: key, amountCent: row.totalAmountCent, reason });
      if (!result || !result.ok) {
        const code = result && result.error && result.error.code;
        if (code !== 'REQUEST_FAILED') delete this._refundKeyMap[row.id];
        return wx.showToast({ title: result && result.error && result.error.message || '售后申请失败，请稍后重试', icon: 'none' });
      }
      delete this._refundKeyMap[row.id];
      await this.loadOrders({ reset: true });
      wx.showToast({ title: '售后申请已提交', icon: 'success' });
    });
  },
  noop() {},
  back() { wx.navigateBack(); }
});
