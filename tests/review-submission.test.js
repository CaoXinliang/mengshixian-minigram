const assert = require('assert/strict');
const { createReviewSubmission, reviewStatusText } = require('../miniapp/modules/review-submission');

async function run() {
  const calls = [];
  let secondAttempts = 0;
  const session = createReviewSubmission({
    keyFactory: item => `key-${item.id}`,
    createReview: async payload => {
      calls.push(payload);
      if (payload.orderItemId === 'i2' && secondAttempts++ === 0) return { ok: false, error: { code: 'REQUEST_FAILED', message: '连接中断' } };
      return { ok: true, data: { review: { _id: `review-${payload.orderItemId}`, status: 'pending' } } };
    }
  });
  const draft = { orderId: 'o1', items: [{ id: 'i1' }, { id: 'i2' }], rating: 5, content: '新鲜', mediaIds: [] };
  const partial = await session.submit(draft);
  assert.equal(partial.kind, 'partial');
  assert.equal(partial.items.find(item => item.id === 'i1').submissionStatus, 'succeeded');
  assert.equal(partial.items.find(item => item.id === 'i2').submissionStatus, 'unknown');

  const completed = await session.submit(draft);
  assert.equal(completed.kind, 'completed');
  assert.deepEqual(calls.map(item => item.orderItemId), ['i1', 'i2', 'i2'], 'a successful item must never be submitted again');
  assert.deepEqual(calls.filter(item => item.orderItemId === 'i2').map(item => item.idempotencyKey), ['key-i2', 'key-i2'], 'unknown item retry must reuse its stable key');

  assert.equal(reviewStatusText('pending'), '审核中');
  assert.equal(reviewStatusText('approved'), '已通过');
  assert.equal(reviewStatusText('rejected'), '未通过');
  assert.equal(reviewStatusText('future'), '状态待确认');

  console.log('review submission test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
