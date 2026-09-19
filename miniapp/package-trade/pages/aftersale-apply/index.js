const { orders, aftersales } = require('../../../services/index');
const { ACTIVE_REFUND_STATUSES, isAftersaleEligibleOrder, toAftersaleItem, validateAftersaleDraft, createAftersaleDraftController, createAftersaleSubmission } = require('../../../modules/aftersale-submission');

const REASONS = [
  { code: 'quality_issue', label: '质量问题' },
  { code: 'damaged', label: '商品破损' },
  { code: 'wrong_item', label: '商品错发' },
  { code: 'missing_item', label: '商品少件' },
  { code: 'not_received', label: '未收到商品' },
  { code: 'other', label: '其他原因' }
];
const safeDecode = value => { try { return decodeURIComponent(value || ''); } catch (error) { return ''; } };
const attemptStorageKey = orderId => `mengshixian_aftersale_attempt_${orderId}`;
const readAttempt = orderId => { try { return wx.getStorageSync(attemptStorageKey(orderId)) || null; } catch (error) { return null; } };
const writeAttempt = (orderId, state) => {
  if (!orderId) return;
  if (!state || !state.key || !state.payload) return wx.removeStorageSync(attemptStorageKey(orderId));
  wx.setStorageSync(attemptStorageKey(orderId), { key: state.key, payload: state.payload, unresolved: true });
};

Page({
  data: {
    orderId: '', status: 'loading', errorText: '', orderNo: '', items: [], reasons: REASONS,
    reasonCode: '', reasonLabel: '', description: '', descriptionReady: false, selectedItemCount: 0, evidence: [], submitLocked: false, draftFrozen: false, submitError: '', submissionRecoveryPending: false
  },
  onLoad(query = {}) {
    const orderId = safeDecode(query.orderId);
    const restoredAttempt = readAttempt(orderId);
    this._restoredAttempt = restoredAttempt;
    this._submission = createAftersaleSubmission({
      requestRefund: payload => aftersales.request(payload),
      listRefunds: payload => typeof aftersales.listAll === 'function' ? aftersales.listAll(payload) : aftersales.list(payload),
      initialKey: restoredAttempt && restoredAttempt.key,
      initialPayload: restoredAttempt && restoredAttempt.payload,
      onAttemptState: state => writeAttempt(orderId, state)
    });
    this._draft = createAftersaleDraftController({
      maxEvidenceFiles: aftersales.MAX_EVIDENCE_FILES,
      prepareEvidenceUploads: files => aftersales.prepareEvidenceUploads(files),
      uploadEvidence: item => aftersales.uploadEvidence(item),
      onChange: patch => this.setData(patch)
    });
    this.setData({ orderId });
    return this.loadOrder();
  },
  async loadOrder() {
    const id = this.data.orderId;
    if (!id) return this.setData({ status: 'empty', errorText: '订单编号无效' });
    const token = (this._loadSeq || 0) + 1; this._loadSeq = token;
    this.setData({ status: 'loading', errorText: '' });
    const refundPromise = typeof aftersales.listAll === 'function' ? aftersales.listAll() : aftersales.list({ page: 1, pageSize: 100 });
    const [result, refundResult] = await Promise.all([orders.get(id), refundPromise]);
    if (token !== this._loadSeq) return;
    if (!result || !result.ok || !result.data || !result.data.order) {
      const code = result && result.error && result.error.code;
      return this.setData({ status: code === 'ORDER_NOT_FOUND' ? 'empty' : 'error', errorText: result && result.error && result.error.message || '售后商品暂时无法加载，请重试' });
    }
    const order = result.data.order;
    if (!isAftersaleEligibleOrder(order)) return this.setData({ status: 'empty', errorText: '该订单当前不满足售后申请条件' });
    if (!refundResult || !refundResult.ok) return this.setData({ status: 'error', errorText: refundResult && refundResult.error && refundResult.error.message || '售后状态暂时无法确认，请重试' });
    const activeRefund = (refundResult.data && refundResult.data.rows || []).find(item => item.orderId === id && ACTIVE_REFUND_STATUSES.includes(item.status));
    if (activeRefund) {
      this._submission.clearAttempt();
      return this.setData({ status: 'empty', errorText: '该订单已有处理中售后申请，请从订单详情查看进度' });
    }
    const items = (result.data.items || order.items || order.itemsSnapshot || []).map(item => toAftersaleItem(item, order.afterSaleQuantityByItem || {})).filter(item => item.remainingQuantity > 0);
    if (!items.length) return this.setData({ status: 'empty', errorText: '订单商品信息暂不可用，请稍后重试' });
    this._draft.replaceItems(items);
    if (this._restoredAttempt && this._restoredAttempt.payload) {
      const restored = this._restoredAttempt.payload;
      const reason = REASONS.find(item => item.code === restored.reasonCode);
      this._draft.restorePayload(restored, reason && reason.label || '');
      this._draft.setLocked(true);
      this.setData({ draftFrozen: true, submissionRecoveryPending: true, submitError: '检测到上次结果未确认的售后申请，请先查询提交结果。' });
    }
    this.setData({ status: 'ready', orderNo: order.orderNo || order._id, errorText: '' });
  },
  retry() { return this.loadOrder(); },
  toggleItem(event) {
    this._draft.toggleItem(event.currentTarget.dataset.id);
  },
  changeQuantity(event) {
    const id = event.currentTarget.dataset.id;
    const detail = event.detail || {};
    this._draft.changeQuantity(id, detail, event.currentTarget.dataset.delta || 0);
  },
  selectReason(event) {
    const code = event.currentTarget.dataset.code;
    const reason = REASONS.find(item => item.code === code);
    this._draft.selectReason(reason);
  },
  inputDescription(event) {
    this._draft.inputDescription(event.detail.value);
  },
  chooseEvidence() {
    const remaining = aftersales.MAX_EVIDENCE_FILES - this.data.evidence.length;
    if (remaining < 1) return wx.showToast({ title: `最多选择 ${aftersales.MAX_EVIDENCE_FILES} 个凭证`, icon: 'none' });
    const append = files => this._draft.appendEvidence(files);
    if (typeof wx.chooseMedia === 'function') return wx.chooseMedia({ count: remaining, mediaType: ['image', 'video'], sourceType: ['album', 'camera'], maxDuration: 30, success: result => append(result.tempFiles || []) });
    if (typeof wx.chooseImage === 'function') return wx.chooseImage({ count: remaining, sourceType: ['album', 'camera'], success: result => append((result.tempFilePaths || []).map(path => ({ tempFilePath: path }))) });
    wx.showToast({ title: '当前微信版本无法选择凭证', icon: 'none' });
  },
  removeEvidence(event) {
    this._draft.removeEvidence(event.currentTarget.dataset.id);
  },
  async uploadEvidenceById(id) {
    return this._draft.uploadById(id);
  },
  retryEvidence(event) { return this.uploadEvidenceById(event.currentTarget.dataset.id); },
  validate() {
    return validateAftersaleDraft(this.data);
  },
  async submit() {
    if (this.data.submitLocked) return;
    const validationError = this.validate();
    if (validationError) return this.setData({ submitError: validationError });
    const payload = this._draft.payload(this.data.orderId);
    let keepFrozen = Boolean(this.data.draftFrozen);
    this._draft.setLocked(true);
    this.setData({ submitLocked: true, submitError: '' });
    try {
      await this._draft.uploadPending();
      const failedEvidence = this.data.evidence.filter(item => item.status !== 'uploaded');
      if (failedEvidence.length) return this.setData({ submitError: `${failedEvidence.length} 个凭证上传失败，请重试后提交` });
      const attemptPayload = Object.freeze({ ...payload, mediaIds: this.data.evidence.map(item => item.mediaId).filter(Boolean) });
      const result = await this._submission.submit(attemptPayload);
      if (!['created', 'recovered'].includes(result.kind)) {
        keepFrozen = result.kind === 'unknown';
        return this.setData({ draftFrozen: keepFrozen, submitError: result.text || '售后申请提交失败，请稍后重试', submissionRecoveryPending: result.kind === 'unknown' && !result.canRetry });
      }
      this.setData({ draftFrozen: false, submissionRecoveryPending: false });
      wx.redirectTo({ url: `/package-trade/pages/aftersale-detail/index?id=${encodeURIComponent(result.refund._id)}&orderId=${encodeURIComponent(this.data.orderId)}` });
    } finally { this._draft.setLocked(keepFrozen); this.setData({ submitLocked: false, draftFrozen: keepFrozen }); }
  },
  async querySubmissionResult() {
    if (this.data.submitLocked) return;
    this.setData({ submitLocked: true, submitError: '' });
    try {
      const result = await this._submission.reconcile(this.data.orderId);
      if (result.kind === 'recovered') {
        this.setData({ draftFrozen: false, submissionRecoveryPending: false });
        return wx.redirectTo({ url: `/package-trade/pages/aftersale-detail/index?id=${encodeURIComponent(result.refund._id)}&orderId=${encodeURIComponent(this.data.orderId)}` });
      }
      this.setData({ draftFrozen: true, submissionRecoveryPending: result.kind === 'unknown' && !result.canRetry, submitError: result.text || '售后申请结果仍无法确认' });
      return result;
    } finally { this.setData({ submitLocked: false }); }
  },
  back() { wx.navigateBack(); }
});
