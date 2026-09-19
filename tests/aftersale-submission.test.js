const assert = require('assert/strict');
const {
  toAftersaleItem,
  isAftersaleEligibleOrder,
  validateAftersaleDraft,
  createAftersaleDraftController,
  createAftersaleSubmission
} = require('../miniapp/modules/aftersale-submission');

async function run() {
  const item = toAftersaleItem({ _id: 'i1', skuId: 's1', productNameSnapshot: '鱼丸', quantity: 2, paidSubtotalCent: 3200 });
  assert.equal(item.orderedQuantity, 2);
  assert.equal(item.refundableAmount, '32.00');
  const remaining = toAftersaleItem({ _id: 'i1', skuId: 's1', productNameSnapshot: '鱼丸', quantity: 3, paidSubtotalCent: 1000 }, { i1: 1 });
  assert.equal(remaining.remainingQuantity, 2);
  assert.equal(remaining.refundableAmount, '6.67', 'remaining display follows the same cumulative floor rule as the server');
  assert.equal(toAftersaleItem({ _id: 'i2', quantity: 1 }, {}).refundableAmount, '--', 'missing money must not be presented as zero');
  assert.equal(toAftersaleItem({ _id: 'i3', quantity: 1, paidSubtotalCent: null }, {}).refundableAmount, '--', 'null money must not be presented as zero');
  assert.equal(toAftersaleItem({ _id: 'i4', quantity: 1, paidSubtotalCent: '' }, {}).paidAmount, '--', 'blank money must not be presented as zero');
  assert.equal(isAftersaleEligibleOrder({ status: 'picking', paymentMethod: 'credit', paymentStatus: 'credit_reserved' }), true);
  assert.equal(isAftersaleEligibleOrder({ status: 'completed', paymentMethod: 'credit', paymentStatus: 'credit_invoiced' }), true);
  assert.equal(isAftersaleEligibleOrder({ status: 'picking', paymentMethod: 'credit', paymentStatus: 'credit_pending' }), false);
  assert.equal(validateAftersaleDraft({ items: [], reasonCode: 'damaged', description: '' }), '请至少选择一个售后商品');
  assert.equal(validateAftersaleDraft({ items: [{ selected: true }], reasonCode: 'other', description: '  ' }), '选择其他原因时请填写问题说明');

  const draftChanges = [];
  const draft = createAftersaleDraftController({
    items: [toAftersaleItem({ _id: 'draft-item', skuId: 'draft-sku', quantity: 2, paidSubtotalCent: 600 })],
    maxEvidenceFiles: 2,
    prepareEvidenceUploads: files => files.map((file, index) => ({ id: `draft-file-${index}`, path: file.path, status: 'pending', mediaId: '' })),
    uploadEvidence: async item => ({ ok: true, data: { mediaId: `media-${item.id}` } }),
    onChange: state => draftChanges.push(state)
  });
  draft.toggleItem('draft-item');
  draft.changeQuantity('draft-item', { source: 'input', valid: true, quantity: 2 });
  draft.selectReason({ code: 'damaged', label: '商品破损' });
  draft.inputDescription('包装破损');
  draft.appendEvidence([{ path: '/tmp/a.jpg' }]);
  draft.setLocked(true);
  draft.toggleItem('draft-item');
  draft.inputDescription('不应写入');
  assert.equal(draft.snapshot().items[0].selected, true, 'locked draft rejects selection changes');
  assert.equal(draft.snapshot().description, '包装破损', 'locked draft rejects text changes');
  await draft.uploadPending();
  assert.equal(draft.snapshot().evidence[0].mediaId, 'media-draft-file-0');
  assert.deepEqual(draft.payload('order-draft').items, [{ orderItemId: 'draft-item', skuId: 'draft-sku', quantity: 2 }]);
  assert(draftChanges.length >= 5, 'draft controller publishes display state after semantic changes');

  const calls = [];
  const success = createAftersaleSubmission({
    keyFactory: () => 'refund-key-1',
    requestRefund: async payload => { calls.push(payload); return { ok: true, data: { refund: { _id: 'r1', orderId: payload.orderId, status: 'requested' } } }; },
    listRefunds: async () => ({ ok: true, data: { rows: [] } })
  });
  const payload = { orderId: 'o1', items: [{ orderItemId: 'i1', quantity: 1 }], reasonCode: 'damaged' };
  const created = await success.submit(payload);
  assert.equal(created.kind, 'created');
  assert.equal(calls[0].idempotencyKey, 'refund-key-1');

  let attempts = 0;
  const recovered = createAftersaleSubmission({
    keyFactory: () => 'stable-key',
    requestRefund: async payload => { attempts += 1; calls.push(payload); return { ok: false, error: { code: 'REQUEST_FAILED', message: '连接中断' } }; },
    listRefunds: async () => ({ ok: true, data: { rows: [{ _id: 'r2', orderId: 'o2', status: 'requested' }] } })
  });
  const restored = await recovered.submit({ ...payload, orderId: 'o2' });
  assert.equal(restored.kind, 'recovered');
  assert.equal(restored.refund._id, 'r2');
  assert.equal(attempts, 1);

  const keys = [];
  const retryBodies = [];
  let listed = 0;
  const retryable = createAftersaleSubmission({
    keyFactory: () => 'same-key',
    requestRefund: async body => { keys.push(body.idempotencyKey); retryBodies.push(body); return keys.length === 1 ? { ok: false, error: { code: 'REQUEST_TIMEOUT', message: '超时' } } : { ok: true, data: { refund: { _id: 'r3', orderId: body.orderId, status: 'requested' } } }; },
    listRefunds: async () => { listed += 1; return { ok: true, data: { rows: [] } }; }
  });
  const unknown = await retryable.submit({ ...payload, orderId: 'o3' });
  assert.equal(unknown.kind, 'unknown');
  assert.equal(unknown.canRetry, true, 'a successful reconciliation with no refund permits the same-key retry');
  const retried = await retryable.submit({ ...payload, orderId: 'o3', reasonCode: 'other', description: 'changed', items: [{ orderItemId: 'changed', quantity: 9 }] });
  assert.equal(retried.kind, 'created');
  assert.deepEqual(keys, ['same-key', 'same-key']);
  assert.deepEqual(retryBodies[1].items, [{ orderItemId: 'i1', skuId: '', quantity: 1 }], 'the module must keep the normalized original intent for a same-key retry');
  assert.equal(retryBodies[1].reasonCode, payload.reasonCode);
  assert.equal(listed, 1);

  let restoredRequests = 0;
  const restoredAttempt = createAftersaleSubmission({
    initialKey: 'restored-key',
    initialPayload: payload,
    initialUnresolved: false,
    requestRefund: async () => { restoredRequests += 1; return { ok: true, data: { refund: { _id: 'restored-refund' } } }; },
    listRefunds: async () => ({ ok: true, data: { rows: [] } })
  });
  const restoredBlocked = await restoredAttempt.submit({ ...payload, description: 'changed' });
  assert.equal(restoredBlocked.kind, 'unknown');
  assert.equal(restoredRequests, 0, 'any restored attempt must reconcile before retry, even if stale storage says unresolved=false');
  const restoredAbsent = await restoredAttempt.reconcile(payload.orderId);
  assert.equal(restoredAbsent.canRetry, true);
  await restoredAttempt.submit({ ...payload, description: 'changed' });
  assert.equal(restoredRequests, 1);

  const blocked = createAftersaleSubmission({
    keyFactory: () => 'blocked-key',
    requestRefund: async () => ({ ok: false, error: { code: 'REQUEST_FAILED', message: '断开' } }),
    listRefunds: async () => ({ ok: false, error: { code: 'REQUEST_FAILED', message: '查询失败' } })
  });
  const unresolved = await blocked.submit({ ...payload, orderId: 'o4' });
  assert.equal(unresolved.kind, 'unknown');
  assert.equal(unresolved.canRetry, false);
  assert.equal(blocked.isUnresolved(), true);
  const stillUnknown = await blocked.reconcile('o4');
  assert.equal(stillUnknown.kind, 'unknown');

  console.log('aftersale submission test: passed');
}

run().catch(error => { console.error(error); process.exit(1); });
