const { aftersales } = require('../../../services/index');
const { money } = require('../../services/trade-format');

const safeDecode = value => { try { return decodeURIComponent(value || ''); } catch (error) { return ''; } };
const timeText = value => value ? String(value).replace('T', ' ').slice(0, 16) : '';
const labels = { requested: '等待审核', approved: '审核通过', awaiting_manual_refund: '等待退款处理', processing: '退款处理中', succeeded: '退款成功', refunded: '退款成功', partially_refunded: '部分退款完成', rejected: '申请已驳回', failed: '退款失败' };

function stages(status) {
  const failed = status === 'failed';
  const rejected = status === 'rejected';
  const reviewDone = !['requested'].includes(status);
  const processing = ['approved', 'awaiting_manual_refund', 'processing'].includes(status);
  const completed = ['succeeded', 'refunded', 'partially_refunded'].includes(status);
  return [
    { key: 'submitted', label: '申请已提交', state: 'done', note: '售后申请已受理' },
    { key: 'review', label: rejected ? '审核未通过' : '平台审核', state: rejected ? 'error' : reviewDone ? 'done' : 'current', note: rejected ? '请查看审核说明或联系客服' : reviewDone ? '审核已处理' : '等待平台审核' },
    { key: 'channel', label: '退款处理', state: failed ? 'error' : completed ? 'done' : processing ? 'current' : '', note: failed ? '退款处理失败，请联系客服' : completed ? '退款处理已完成' : processing ? '正在处理退款，请稍候' : '审核通过后进入退款处理' }
  ];
}

function viewModel(refund) {
  return {
    id: refund._id || '', refundNo: refund.refundNo || '', orderId: refund.orderId || '', status: refund.status || 'requested',
    statusText: labels[refund.status] || '处理中', amount: money(Number(refund.amountCent || 0) / 100),
    reason: refund.description || refund.reason || '', reasonCode: refund.reasonCode || '', reviewNote: refund.reviewNote || '',
    channelStatus: refund.channelStatus || '', manualRefundRequired: refund.manualRefundRequired === true,
    createdAt: timeText(refund.createdAt), updatedAt: timeText(refund.updatedAt), items: Array.isArray(refund.items) ? refund.items : [],
    mediaCount: Array.isArray(refund.mediaIds) ? refund.mediaIds.length : 0, timeline: stages(refund.status || 'requested')
  };
}

Page({
  data: { orderId: '', refundId: '', status: 'loading', errorText: '', detail: null },
  onLoad(query = {}) { this.setData({ orderId: safeDecode(query.orderId), refundId: safeDecode(query.id) }); return this.loadDetail(); },
  async loadDetail() {
    if (!this.data.orderId && !this.data.refundId) return this.setData({ status: 'empty', errorText: '售后申请编号无效' });
    const token = (this._loadSeq || 0) + 1; this._loadSeq = token;
    this.setData({ status: 'loading', errorText: '' });
    let result;
    if (this.data.refundId) result = await aftersales.get({ id: this.data.refundId });
    else {
      const listed = await aftersales.list({ page: 1, pageSize: 20 });
      const rows = listed && listed.ok && listed.data && listed.data.rows || [];
      const match = rows.find(item => item.orderId === this.data.orderId);
      result = match ? { ok: true, data: { refund: match } } : listed && listed.ok ? { ok: false, error: { code: 'REFUND_NOT_FOUND', message: '该订单暂无售后申请' } } : listed;
    }
    if (token !== this._loadSeq) return;
    const refund = result && result.ok && result.data && (result.data.refund || result.data);
    if (!refund || !refund._id) {
      const code = result && result.error && result.error.code;
      return this.setData({ status: ['REFUND_NOT_FOUND', 'ORDER_NOT_FOUND'].includes(code) ? 'empty' : 'error', errorText: result && result.error && result.error.message || '售后进度暂时无法加载，请稍后重试' });
    }
    this.setData({ status: 'ready', detail: viewModel(refund), errorText: '' });
  },
  retry() { return this.loadDetail(); },
  back() { wx.navigateBack(); }
});
