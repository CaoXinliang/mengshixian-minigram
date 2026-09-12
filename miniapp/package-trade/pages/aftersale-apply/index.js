const { orders, aftersales } = require('../../../services/index');

const REASONS = [
  { code: 'quality_issue', label: '质量问题' },
  { code: 'damaged', label: '商品破损' },
  { code: 'wrong_item', label: '商品错发' },
  { code: 'missing_item', label: '商品少件' },
  { code: 'not_received', label: '未收到商品' },
  { code: 'other', label: '其他原因' }
];
const eligible = order => order && order.paymentStatus === 'paid' && ['pending_confirmation', 'picking', 'shipping', 'delivered', 'completed'].includes(order.status);
const safeDecode = value => { try { return decodeURIComponent(value || ''); } catch (error) { return ''; } };
const money = cents => (Number(cents || 0) / 100).toFixed(2);
const itemRow = item => ({
  id: item._id || item.orderItemId || item.skuId,
  orderItemId: item._id || item.orderItemId || '',
  skuId: item.skuId || '',
  name: item.productNameSnapshot || '订单商品',
  spec: [item.specSnapshot, item.packageUnitSnapshot].filter(Boolean).join(' · ') || '暂无规格信息',
  media: item.mediaSnapshot || '',
  orderedQuantity: Math.max(1, Number(item.quantity || 1)),
  paidAmount: money(item.paidSubtotalCent === undefined ? item.subtotalCent : item.paidSubtotalCent),
  refundableAmount: money(item.refundableAmountCent === undefined ? (item.paidSubtotalCent === undefined ? item.subtotalCent : item.paidSubtotalCent) : item.refundableAmountCent),
  requestQuantity: 1,
  selected: false
});

Page({
  data: {
    orderId: '', status: 'loading', errorText: '', orderNo: '', items: [], reasons: REASONS,
    reasonCode: '', reasonLabel: '', description: '', evidence: [], submitLocked: false, submitError: ''
  },
  onLoad(query = {}) { this.setData({ orderId: safeDecode(query.orderId) }); return this.loadOrder(); },
  async loadOrder() {
    const id = this.data.orderId;
    if (!id) return this.setData({ status: 'empty', errorText: '订单编号无效' });
    const token = (this._loadSeq || 0) + 1; this._loadSeq = token;
    this.setData({ status: 'loading', errorText: '' });
    const [result, refundResult] = await Promise.all([orders.get(id), aftersales.list({ page: 1, pageSize: 100 })]);
    if (token !== this._loadSeq) return;
    if (!result || !result.ok || !result.data || !result.data.order) {
      const code = result && result.error && result.error.code;
      return this.setData({ status: code === 'ORDER_NOT_FOUND' ? 'empty' : 'error', errorText: result && result.error && result.error.message || '售后商品暂时无法加载，请重试' });
    }
    const order = result.data.order;
    if (!eligible(order)) return this.setData({ status: 'empty', errorText: '该订单当前不满足售后申请条件' });
    const activeRefund = (refundResult && refundResult.ok && refundResult.data && refundResult.data.rows || []).find(item => item.orderId === id && ['requested', 'approved', 'awaiting_manual_refund', 'processing'].includes(item.status));
    if (activeRefund) return this.setData({ status: 'empty', errorText: '该订单已有处理中售后申请，请从订单详情查看进度' });
    const items = (result.data.items || order.items || order.itemsSnapshot || []).map(itemRow);
    if (!items.length) return this.setData({ status: 'empty', errorText: '订单商品信息暂不可用，请稍后重试' });
    this.setData({ status: 'ready', orderNo: order.orderNo || order._id, items, errorText: '' });
  },
  retry() { return this.loadOrder(); },
  toggleItem(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({ items: this.data.items.map(item => item.id === id ? { ...item, selected: !item.selected } : item), submitError: '' });
  },
  changeQuantity(event) {
    const id = event.currentTarget.dataset.id;
    const delta = Number(event.currentTarget.dataset.delta || 0);
    this.setData({ items: this.data.items.map(item => item.id === id ? { ...item, selected: true, requestQuantity: Math.max(1, Math.min(item.orderedQuantity, item.requestQuantity + delta)) } : item), submitError: '' });
  },
  selectReason(event) {
    const code = event.currentTarget.dataset.code;
    const reason = REASONS.find(item => item.code === code);
    if (reason) this.setData({ reasonCode: reason.code, reasonLabel: reason.label, submitError: '' });
  },
  inputDescription(event) { this.setData({ description: String(event.detail.value || '').slice(0, 500), submitError: '' }); },
  chooseEvidence() {
    const remaining = aftersales.MAX_EVIDENCE_FILES - this.data.evidence.length;
    if (remaining < 1) return wx.showToast({ title: `最多选择 ${aftersales.MAX_EVIDENCE_FILES} 个凭证`, icon: 'none' });
    const append = files => this.setData({ evidence: this.data.evidence.concat(aftersales.prepareEvidenceUploads(files)).slice(0, aftersales.MAX_EVIDENCE_FILES) });
    if (typeof wx.chooseMedia === 'function') return wx.chooseMedia({ count: remaining, mediaType: ['image', 'video'], sourceType: ['album', 'camera'], maxDuration: 30, success: result => append(result.tempFiles || []) });
    if (typeof wx.chooseImage === 'function') return wx.chooseImage({ count: remaining, sourceType: ['album', 'camera'], success: result => append((result.tempFilePaths || []).map(path => ({ tempFilePath: path }))) });
    wx.showToast({ title: '当前微信版本无法选择凭证', icon: 'none' });
  },
  removeEvidence(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({ evidence: this.data.evidence.filter(item => item.id !== id) });
  },
  async uploadEvidenceById(id) {
    const target = this.data.evidence.find(item => item.id === id);
    if (!target || target.status === 'uploaded' || target.status === 'uploading') return target && target.mediaId || '';
    this.setData({ evidence: this.data.evidence.map(item => item.id === id ? { ...item, status: 'uploading', errorText: '' } : item) });
    const result = await aftersales.uploadEvidence(target);
    const mediaId = result && result.ok && result.data && result.data.mediaId || '';
    const errorText = result && result.error && result.error.message || '凭证上传失败，请重试';
    this.setData({ evidence: this.data.evidence.map(item => item.id === id ? { ...item, status: mediaId ? 'uploaded' : 'failed', mediaId, errorText: mediaId ? '' : errorText } : item) });
    return mediaId;
  },
  retryEvidence(event) { return this.uploadEvidenceById(event.currentTarget.dataset.id); },
  validate() {
    const selected = this.data.items.filter(item => item.selected);
    if (!selected.length) return '请至少选择一个售后商品';
    if (selected.length > 20) return '单次售后最多选择 20 个订单项';
    if (!this.data.reasonCode) return '请选择售后原因';
    if (this.data.reasonCode === 'other' && !this.data.description.trim()) return '选择其他原因时请填写问题说明';
    return '';
  },
  async submit() {
    if (this.data.submitLocked) return;
    const validationError = this.validate();
    if (validationError) return this.setData({ submitError: validationError });
    const payloadItems = this.data.items.filter(item => item.selected).map(item => ({ orderItemId: item.orderItemId, skuId: item.skuId, quantity: item.requestQuantity }));
    const idempotencyKey = this._idempotencyKey || `aftersale-${this.data.orderId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this._idempotencyKey = idempotencyKey;
    this.setData({ submitLocked: true, submitError: '' });
    try {
      for (const item of this.data.evidence) {
        if (item.status !== 'uploaded') await this.uploadEvidenceById(item.id);
      }
      const failedEvidence = this.data.evidence.filter(item => item.status !== 'uploaded');
      if (failedEvidence.length) return this.setData({ submitError: `${failedEvidence.length} 个凭证上传失败，请重试后提交` });
      const payload = { orderId: this.data.orderId, idempotencyKey, items: payloadItems, reasonCode: this.data.reasonCode, description: this.data.description.trim(), mediaIds: this.data.evidence.map(item => item.mediaId).filter(Boolean) };
      const result = await aftersales.request(payload);
      if (!result || !result.ok || !result.data || !result.data.refund) {
        const code = result && result.error && result.error.code;
        if (code && code !== 'REQUEST_FAILED') this._idempotencyKey = '';
        return this.setData({ submitError: result && result.error && result.error.message || '售后申请提交失败，请稍后重试' });
      }
      this._idempotencyKey = '';
      wx.redirectTo({ url: `/package-trade/pages/aftersale-detail/index?id=${encodeURIComponent(result.data.refund._id)}&orderId=${encodeURIComponent(this.data.orderId)}` });
    } finally { this.setData({ submitLocked: false }); }
  },
  back() { wx.navigateBack(); }
});
