const ACTIVE_REFUND_STATUSES = ['requested', 'approved', 'awaiting_manual_refund', 'channel_pending', 'processing'];
const TRANSPORT_CODES = new Set(['REQUEST_FAILED', 'REQUEST_TIMEOUT', 'NETWORK_ERROR']);
const hasMoneyValue = value => value !== undefined && value !== null && String(value).trim() !== '' && Number.isFinite(Number(value));
const money = cents => hasMoneyValue(cents) ? (Number(cents) / 100).toFixed(2) : '--';

function isAftersaleEligibleOrder(order) {
  if (!order || !['pending_confirmation', 'picking', 'shipping', 'delivered', 'completed'].includes(order.status)) return false;
  return order.paymentStatus === 'paid' || (order.paymentMethod === 'credit' && ['credit_reserved', 'credit_invoiced'].includes(order.paymentStatus));
}

function toAftersaleItem(item, reservedByItem = {}) {
  const key = item.orderItemId || item._id || item.skuId || '';
  const orderedQuantity = Math.max(1, Number(item.quantity || 1));
  const reservedQuantity = Math.max(0, Math.min(orderedQuantity, Number(reservedByItem && reservedByItem[key] || 0)));
  const remainingQuantity = orderedQuantity - reservedQuantity;
  const refundableValue = item.refundableAmountCent === undefined ? (item.paidSubtotalCent === undefined ? item.subtotalCent : item.paidSubtotalCent) : item.refundableAmountCent;
  const refundableAmountCent = hasMoneyValue(refundableValue) ? Number(refundableValue) : Number.NaN;
  const reservedAmountCent = Number.isFinite(refundableAmountCent) ? Math.floor(refundableAmountCent * reservedQuantity / orderedQuantity) : Number.NaN;
  return {
    id: item._id || item.orderItemId || item.skuId,
    orderItemId: item._id || item.orderItemId || '',
    skuId: item.skuId || '',
    name: item.productNameSnapshot || '订单商品',
    spec: [item.specSnapshot, item.packageUnitSnapshot].filter(Boolean).join(' · ') || '暂无规格信息',
    media: item.mediaSnapshot || '',
    orderedQuantity,
    reservedQuantity,
    remainingQuantity,
    paidAmount: money(item.paidSubtotalCent === undefined ? item.subtotalCent : item.paidSubtotalCent),
    refundableAmount: money(Number.isFinite(refundableAmountCent) ? Math.max(0, refundableAmountCent - reservedAmountCent) : Number.NaN),
    requestQuantity: 1,
    selected: false
  };
}

function validateAftersaleDraft({ items, reasonCode, description }) {
  const selected = (items || []).filter(item => item.selected);
  if (!selected.length) return '请至少选择一个售后商品';
  if (selected.length > 20) return '单次售后最多选择 20 个订单项';
  if (!reasonCode) return '请选择售后原因';
  if (reasonCode === 'other' && !String(description || '').trim()) return '选择其他原因时请填写问题说明';
  return '';
}

function createAftersaleDraftController(options = {}) {
  const maxEvidenceFiles = Math.max(1, Number(options.maxEvidenceFiles || 6));
  const prepareEvidenceUploads = options.prepareEvidenceUploads || (files => files || []);
  const uploadEvidence = options.uploadEvidence || (async () => ({ ok: false, error: { message: '凭证上传能力不可用' } }));
  const onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
  let locked = false;
  let state = {
    items: Array.isArray(options.items) ? options.items : [],
    reasonCode: '', reasonLabel: '', description: '', descriptionReady: false,
    selectedItemCount: 0,
    evidence: Array.isArray(options.evidence) ? options.evidence : [],
    submitError: ''
  };
  const publish = patch => {
    state = { ...state, ...patch };
    onChange(snapshot());
    return snapshot();
  };
  const snapshot = () => ({ ...state, items: state.items.map(item => ({ ...item })), evidence: state.evidence.map(item => ({ ...item })) });
  const selectedCount = items => items.filter(item => item.selected).length;
  return {
    snapshot,
    setLocked(value) { locked = Boolean(value); },
    isLocked() { return locked; },
    replaceItems(items) { return publish({ items: Array.isArray(items) ? items : [], selectedItemCount: 0 }); },
    restorePayload(payload, reasonLabel = '') {
      const chosen = new Map((payload && payload.items || []).map(item => [item.orderItemId || item.skuId, item]));
      const items = state.items.map(item => {
        const selected = chosen.get(item.orderItemId || item.skuId);
        return selected ? { ...item, selected: true, requestQuantity: Math.max(1, Math.min(item.remainingQuantity, Number(selected.quantity || 1))) } : item;
      });
      const description = String(payload && payload.description || '').slice(0, 500);
      const evidence = (payload && payload.mediaIds || []).slice(0, maxEvidenceFiles).map((mediaId, index) => ({ id: `restored-${index}`, mediaId: String(mediaId), status: 'uploaded', type: 'image', path: '', errorText: '' }));
      return publish({ items, selectedItemCount: selectedCount(items), reasonCode: String(payload && payload.reasonCode || ''), reasonLabel, description, descriptionReady: Boolean(description.trim()), evidence, submitError: '' });
    },
    toggleItem(id) {
      if (locked) return snapshot();
      const items = state.items.map(item => item.id === id ? { ...item, selected: !item.selected } : item);
      return publish({ items, selectedItemCount: selectedCount(items), submitError: '' });
    },
    changeQuantity(id, detail = {}, fallbackDelta = 0) {
      if (locked) return snapshot();
      if (detail.valid === false) return publish({ submitError: detail.message || '请输入有效数量' });
      const delta = Number(detail.delta === undefined ? fallbackDelta || 0 : detail.delta);
      const items = state.items.map(item => {
        if (item.id !== id) return item;
        const direct = detail.source === 'input' && detail.valid === true ? Number(detail.quantity) : Number.NaN;
        const quantity = Number.isSafeInteger(direct) ? direct : item.requestQuantity + delta;
        return { ...item, selected: true, requestQuantity: Math.max(1, Math.min(item.remainingQuantity, quantity)) };
      });
      return publish({ items, selectedItemCount: selectedCount(items), submitError: '' });
    },
    selectReason(reason) {
      if (locked || !reason) return snapshot();
      return publish({ reasonCode: reason.code, reasonLabel: reason.label, submitError: '' });
    },
    inputDescription(value) {
      if (locked) return snapshot();
      const description = String(value || '').slice(0, 500);
      return publish({ description, descriptionReady: Boolean(description.trim()), submitError: '' });
    },
    appendEvidence(files) {
      if (locked) return snapshot();
      const remaining = maxEvidenceFiles - state.evidence.length;
      if (remaining < 1) return snapshot();
      const prepared = prepareEvidenceUploads(Array.isArray(files) ? files.slice(0, remaining) : []);
      return publish({ evidence: state.evidence.concat(prepared).slice(0, maxEvidenceFiles), submitError: '' });
    },
    removeEvidence(id) {
      if (locked) return snapshot();
      return publish({ evidence: state.evidence.filter(item => item.id !== id) });
    },
    async uploadById(id) {
      const target = state.evidence.find(item => item.id === id);
      if (!target || target.status === 'uploaded' || target.status === 'uploading') return target && target.mediaId || '';
      publish({ evidence: state.evidence.map(item => item.id === id ? { ...item, status: 'uploading', errorText: '' } : item) });
      const result = await uploadEvidence(target);
      const mediaId = result && result.ok && result.data && result.data.mediaId || '';
      const errorText = result && result.error && result.error.message || '凭证上传失败，请重试';
      publish({ evidence: state.evidence.map(item => item.id === id ? { ...item, status: mediaId ? 'uploaded' : 'failed', mediaId, errorText: mediaId ? '' : errorText } : item) });
      return mediaId;
    },
    async uploadPending() {
      const ids = state.evidence.filter(item => item.status !== 'uploaded').map(item => item.id);
      for (const id of ids) await this.uploadById(id);
      return snapshot();
    },
    payload(orderId) {
      return Object.freeze({
        orderId,
        items: state.items.filter(item => item.selected).map(item => ({ orderItemId: item.orderItemId, skuId: item.skuId, quantity: item.requestQuantity })),
        reasonCode: state.reasonCode,
        description: state.description.trim(),
        mediaIds: state.evidence.map(item => item.mediaId).filter(Boolean)
      });
    }
  };
}

function activeRefund(rows, orderId) {
  return (Array.isArray(rows) ? rows : []).find(item => item && item.orderId === orderId && ACTIVE_REFUND_STATUSES.includes(item.status)) || null;
}

function createAftersaleSubmission({ requestRefund, listRefunds, keyFactory = () => `aftersale-${Date.now()}-${Math.random().toString(16).slice(2)}` }) {
  const options = arguments[0] || {};
  const onAttemptState = typeof options.onAttemptState === 'function' ? options.onAttemptState : () => {};
  const freezePayload = payload => Object.freeze({
    orderId: String(payload && payload.orderId || ''),
    items: Object.freeze((payload && payload.items || []).map(item => Object.freeze({ orderItemId: item.orderItemId || '', skuId: item.skuId || '', quantity: Number(item.quantity || 0) }))),
    reasonCode: String(payload && payload.reasonCode || ''),
    description: String(payload && payload.description || ''),
    mediaIds: Object.freeze((payload && payload.mediaIds || []).map(String))
  });
  let key = String(options.initialKey || '');
  let attemptPayload = options.initialPayload ? freezePayload(options.initialPayload) : null;
  let busy = false;
  let unresolved = Boolean(key && attemptPayload);
  const publishAttempt = () => onAttemptState({ key, payload: attemptPayload, unresolved });
  const clearAttempt = () => { key = ''; attemptPayload = null; unresolved = false; publishAttempt(); };

  async function reconcile(orderId) {
    let listed;
    try { listed = await listRefunds({ page: 1, pageSize: 100 }); } catch (error) { listed = { ok: false, error: { code: 'REQUEST_FAILED', message: error && error.message || '售后状态查询失败。' } }; }
    if (!listed || !listed.ok) return { kind: 'unknown', canRetry: false, text: '售后申请结果暂时无法确认，请不要重复提交，稍后再查询。' };
    const refund = activeRefund(listed.data && listed.data.rows, orderId);
    if (refund) {
      clearAttempt();
      return { kind: 'recovered', refund, canRetry: false, text: '已找到刚才提交的售后申请。' };
    }
    unresolved = false;
    publishAttempt();
    return { kind: 'unknown', canRetry: true, text: '暂未查到售后申请，可使用同一次提交安全重试。' };
  }

  async function submit(payload) {
    if (busy) return { kind: 'busy', canRetry: false, text: '售后申请正在提交，请勿重复点击。' };
    if (unresolved) return { kind: 'unknown', canRetry: false, text: '上一次提交结果仍未确认，请先查询，不要重复提交。' };
    if (!key) {
      key = keyFactory(payload);
      attemptPayload = freezePayload(payload);
      publishAttempt();
    } else if (!attemptPayload) {
      attemptPayload = freezePayload(payload);
      publishAttempt();
    }
    busy = true;
    try {
      let result;
      try { result = await requestRefund({ ...attemptPayload, idempotencyKey: key }); } catch (error) { result = { ok: false, error: { code: 'REQUEST_FAILED', message: error && error.message || '售后申请请求失败。' } }; }
      const refund = result && result.ok && result.data && result.data.refund;
      if (refund && refund._id) {
        clearAttempt();
        return { kind: 'created', refund, canRetry: false, text: '售后申请已提交。' };
      }
      const error = result && result.error || { code: 'REQUEST_FAILED', message: '售后申请提交失败。' };
      if (TRANSPORT_CODES.has(error.code) || error.code === 'REFUND_ALREADY_PENDING') {
        unresolved = true;
        publishAttempt();
        const recovered = await reconcile(attemptPayload.orderId);
        return { ...recovered, error };
      }
      clearAttempt();
      return { kind: 'failed', error, canRetry: true, text: error.message || '售后申请提交失败，请检查后重试。' };
    } finally { busy = false; }
  }

  return { submit, reconcile, clearAttempt, isBusy: () => busy, isUnresolved: () => unresolved, currentKey: () => key, currentPayload: () => attemptPayload };
}

module.exports = { ACTIVE_REFUND_STATUSES, isAftersaleEligibleOrder, toAftersaleItem, validateAftersaleDraft, createAftersaleDraftController, activeRefund, createAftersaleSubmission };
