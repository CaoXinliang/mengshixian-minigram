const assert = require('assert/strict');
const { toAftersaleDetail } = require('../miniapp/modules/aftersale-presentation');

const statuses = {
  requested: ['等待审核', false],
  approved: ['审核通过', false],
  awaiting_manual_refund: ['等待退款处理', false],
  channel_pending: ['退款渠道处理中', false],
  processing: ['退款处理中', false],
  failed: ['退款失败', false],
  rejected: ['申请已驳回', false],
  succeeded: ['退款成功', true],
  partially_refunded: ['部分退款完成', true]
};

for (const [status, [label, complete]] of Object.entries(statuses)) {
  const detail = toAftersaleDetail({ _id: `r-${status}`, status, amountCent: 1600, items: [], mediaIds: [] }, []);
  assert.equal(detail.statusText, label);
  assert.equal(detail.isRefundComplete, complete, `${status} must not be presented as a different money outcome`);
  if (!complete) assert.notEqual(detail.timeline.at(-1).note, '退款处理已完成');
}

const withMedia = toAftersaleDetail({
  _id: 'r1', refundNo: 'R001', status: 'awaiting_manual_refund', amountCent: 1600,
  mediaIds: ['m1', 'm2'], items: [], createdAt: '2026-09-12T08:00:00.000Z'
}, [
  { _id: 'm1', type: 'image', url: 'https://example.test/evidence.jpg' },
  { _id: 'm2', type: 'video', fileId: 'cloud://private/video.mp4' }
]);
assert.equal(withMedia.mediaCount, 2);
assert.equal(withMedia.media[0].canPreview, true);
assert.equal(withMedia.media[1].canPreview, false);
assert.equal(withMedia.media[1].url, '', 'private file ids must not be exposed as preview URLs');
assert.equal(withMedia.evidenceUnavailableCount, 1);
assert.equal(withMedia.manualRefundRequired, false, 'only an explicit server flag marks a manual refund requirement');
assert.equal(toAftersaleDetail({ _id: 'missing-amount', status: 'requested' }, []).amount, '--', 'missing refund amount must not be presented as zero');
assert.equal(toAftersaleDetail({ _id: 'null-amount', status: 'requested', amountCent: null }, []).amount, '--', 'null refund amount must not be presented as zero');
assert.equal(toAftersaleDetail({ _id: 'blank-amount', status: 'requested', amountCent: '' }, []).amount, '--', 'blank refund amount must not be presented as zero');

console.log('aftersale presentation test: passed');
