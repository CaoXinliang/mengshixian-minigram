const TRANSPORT_CODES = new Set(['REQUEST_FAILED', 'REQUEST_TIMEOUT', 'NETWORK_ERROR']);
const reviewStatusText = status => ({ pending: '审核中', approved: '已通过', rejected: '未通过' })[status] || '状态待确认';

function createReviewSubmission({ createReview, keyFactory = item => `review-${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}` }) {
  const states = new Map();
  let busy = false;

  function row(item) {
    if (!states.has(item.id)) states.set(item.id, { id: item.id, key: keyFactory(item), status: 'pending', errorText: '' });
    return states.get(item.id);
  }

  function snapshot(items) {
    return (items || []).map(item => ({ ...item, submissionStatus: row(item).status, submissionError: row(item).errorText }));
  }

  async function submit({ orderId, items, rating, content, mediaIds }) {
    if (busy) return { kind: 'busy', items: snapshot(items), text: '评价正在提交，请勿重复点击。' };
    busy = true;
    try {
      let stopped = null;
      for (const item of items || []) {
        const state = row(item);
        if (state.status === 'succeeded') continue;
        state.status = 'submitting'; state.errorText = '';
        let result;
        try {
          result = await createReview({ orderId, orderItemId: item.id, rating, content, mediaIds, idempotencyKey: state.key });
        } catch (error) {
          result = { ok: false, error: { code: 'REQUEST_FAILED', message: error && error.message || '评价提交失败。' } };
        }
        if (result && result.ok && result.data && result.data.review) {
          state.status = 'succeeded'; state.errorText = '';
          continue;
        }
        const error = result && result.error || { code: 'REQUEST_FAILED', message: '评价提交结果暂时无法确认。' };
        state.status = TRANSPORT_CODES.has(error.code) ? 'unknown' : 'failed';
        state.errorText = error.message || '评价提交失败。';
        stopped = { item, error, unknown: state.status === 'unknown' };
        break;
      }
      const rows = snapshot(items);
      const succeeded = rows.filter(item => item.submissionStatus === 'succeeded').length;
      if (succeeded === rows.length) return { kind: 'completed', items: rows, text: '评价已提交，等待审核。' };
      if (succeeded > 0) return { kind: 'partial', items: rows, text: stopped && stopped.unknown ? '部分评价已提交；其余结果暂未确认，可稍后使用原请求继续。' : '部分评价已提交；请修正失败项后继续。' };
      return { kind: stopped && stopped.unknown ? 'unknown' : 'failed', items: rows, text: stopped && stopped.error && stopped.error.message || '评价提交失败，请重试。' };
    } finally { busy = false; }
  }

  return { submit, snapshot, isBusy: () => busy };
}

module.exports = { createReviewSubmission, reviewStatusText };
