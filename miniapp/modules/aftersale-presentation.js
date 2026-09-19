const STATUS_LABELS = {
  requested: '等待审核',
  approved: '审核通过',
  awaiting_manual_refund: '等待退款处理',
  channel_pending: '退款渠道处理中',
  processing: '退款处理中',
  succeeded: '退款成功',
  refunded: '退款成功',
  partially_refunded: '部分退款完成',
  rejected: '申请已驳回',
  failed: '退款失败'
};
const COMPLETE_STATUSES = ['succeeded', 'refunded', 'partially_refunded'];
const timeText = value => value ? String(value).replace('T', ' ').slice(0, 16) : '';
const hasMoneyValue = value => value !== undefined && value !== null && String(value).trim() !== '' && Number.isFinite(Number(value));
const money = cents => hasMoneyValue(cents) ? (Number(cents) / 100).toFixed(2) : '--';

function stages(refund) {
  const status = refund.status || 'requested';
  const failed = status === 'failed';
  const rejected = status === 'rejected';
  const reviewDone = status !== 'requested';
  const processing = ['approved', 'awaiting_manual_refund', 'channel_pending', 'processing'].includes(status);
  const completed = COMPLETE_STATUSES.includes(status);
  const events = Array.isArray(refund.statusTimeline) ? refund.statusTimeline : [];
  const eventTime = keys => {
    const event = [...events].reverse().find(item => keys.includes(item.status));
    return event ? timeText(event.at) : '';
  };
  return [
    { key: 'submitted', label: '申请已提交', state: 'done', note: '售后申请已受理', time: eventTime(['requested']) || timeText(refund.createdAt) },
    { key: 'review', label: rejected ? '审核未通过' : '平台审核', state: rejected ? 'error' : reviewDone ? 'done' : 'current', note: rejected ? '请查看审核说明或联系客服' : reviewDone ? '审核已处理' : '等待平台审核', time: eventTime(['approved', 'rejected', 'awaiting_manual_refund', 'succeeded']) },
    { key: 'channel', label: '退款处理', state: failed ? 'error' : completed ? 'done' : processing ? 'current' : '', note: failed ? '退款处理失败，请联系客服' : completed ? '退款处理已完成' : status === 'awaiting_manual_refund' ? '等待运营提交真实退款渠道' : ['channel_pending', 'processing'].includes(status) ? '退款渠道正在处理，请稍候' : '审核通过后进入退款处理', time: eventTime(['channel_pending', 'processing', 'failed', 'succeeded', 'refunded', 'partially_refunded']) }
  ];
}

function mediaView(media) {
  const url = /^https?:\/\//.test(String(media && media.url || '')) || /^wxfile:\/\//.test(String(media && media.url || '')) ? String(media.url) : '';
  return {
    id: media && media._id || '',
    type: media && media.type === 'video' ? 'video' : 'image',
    url,
    canPreview: Boolean(url),
    note: url ? '' : '该凭证已安全保存，当前暂无法生成预览地址。'
  };
}

function toAftersaleDetail(refund, mediaRows = []) {
  const media = (Array.isArray(mediaRows) ? mediaRows : []).map(mediaView);
  const declaredCount = Array.isArray(refund.mediaIds) ? refund.mediaIds.length : 0;
  return {
    id: refund._id || '',
    refundNo: refund.refundNo || '',
    orderId: refund.orderId || '',
    status: refund.status || 'requested',
    statusText: STATUS_LABELS[refund.status] || '处理中',
    isRefundComplete: COMPLETE_STATUSES.includes(refund.status),
    amount: money(refund.amountCent),
    reason: refund.description || refund.reason || '',
    reasonCode: refund.reasonCode || '',
    reviewNote: refund.reviewNote || '',
    channelStatus: refund.channelStatus || '',
    manualRefundRequired: refund.manualRefundRequired === true,
    createdAt: timeText(refund.createdAt),
    updatedAt: timeText(refund.updatedAt),
    items: Array.isArray(refund.items) ? refund.items : [],
    media,
    mediaCount: Math.max(declaredCount, media.length),
    evidenceUnavailableCount: Math.max(0, declaredCount - media.filter(item => item.canPreview).length),
    timeline: stages(refund)
  };
}

module.exports = { STATUS_LABELS, COMPLETE_STATUSES, toAftersaleDetail };
