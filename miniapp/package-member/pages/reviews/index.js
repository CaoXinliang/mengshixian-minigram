const { auth, reviews } = require('../../../services/index');
const { authorizeMemberPage, isCurrentMemberLoad } = require('../../member-auth');
const MAX_MEDIA = 6;
const fileName = path => String(path || '').split('/').pop() || `review-${Date.now()}.jpg`;
const readBase64 = path => new Promise((resolve, reject) => wx.getFileSystemManager().readFile({ filePath: path, encoding: 'base64', success: result => resolve(result.data), fail: reject }));
const orderLabel = (orderNo, orderId) => {
  const raw = String(orderNo || orderId || '').trim();
  return raw ? `订单尾号 ${raw.slice(-4)}` : '订单';
};

Page({
  data: { status: 'loading', errorText: '', orders: [], mine: [], current: null, rating: 5, content: '', media: [], busy: false },
  onLoad(query = {}) { this._initialOrderId = query.orderId ? decodeURIComponent(query.orderId) : ''; },
  onShow() { return this.load(); },
  async load() {
    const access = await authorizeMemberPage(this, auth, { forbiddenText: '请先登录后评价订单', clear: { orders: [], mine: [], current: null, rating: 5, content: '', media: [], busy: false }, reset: () => { this._eligibleItems = []; this._reviewKeys = {}; } });
    if (!access) return;
    const [eligibleResult, mineResult] = await Promise.all([reviews.eligible({ page: 1, pageSize: 100 }), reviews.mine({ page: 1, pageSize: 100 })]);
    if (!isCurrentMemberLoad(this, access)) return;
    const failed = [eligibleResult, mineResult].find(item => !item || !item.ok);
    if (failed) return this.setData({ status: 'error', errorText: failed && failed.error && failed.error.message || '评价数据加载失败，请重试' });
    const mine = mineResult.data && mineResult.data.rows || []; const eligible = eligibleResult.data && eligibleResult.data.rows || [];
    this._eligibleItems = eligible;
    const orderMap = new Map(); eligible.forEach(item => { if (!orderMap.has(item.orderId)) orderMap.set(item.orderId, { id: item.orderId, orderLabel: orderLabel(item.orderNo, item.orderId), createdAt: String(item.completedAt || '').slice(0, 10) }); });
    const rows = [...orderMap.values()];
    this.setData({ status: 'ready', orders: rows, mine });
    const target = this._initialOrderId || rows[0] && rows[0].id; this._initialOrderId = '';
    if (target && rows.some(item => item.id === target)) await this.selectOrderById(target);
  },
  retry() { return this.load(); },
  selectOrder(event) { return this.selectOrderById(event.currentTarget.dataset.id); },
  async selectOrderById(id) { const items = (this._eligibleItems || []).filter(item => item.orderId === id); if (!items.length) return wx.showToast({ title: '该订单暂无可评价商品', icon: 'none' }); this.setData({ current: { id, orderLabel: orderLabel(items[0].orderNo, id), items: items.map(item => ({ id: item.orderItemId, skuId: item.skuId, name: item.productNameSnapshot || '订单商品', selected: true })) }, rating: 5, content: '', media: [] }); },
  setRating(event) { this.setData({ rating: Number(event.currentTarget.dataset.rating) }); },
  inputContent(event) { this.setData({ content: String(event.detail.value || '').slice(0, 500) }); },
  toggleItem(event) { const id = event.currentTarget.dataset.id; this.setData({ 'current.items': this.data.current.items.map(item => item.id === id ? { ...item, selected: !item.selected } : item) }); },
  chooseMedia() { const remaining = MAX_MEDIA - this.data.media.length; if (remaining < 1) return wx.showToast({ title: `最多上传 ${MAX_MEDIA} 张图片`, icon: 'none' }); wx.chooseMedia({ count: remaining, mediaType: ['image'], sourceType: ['album', 'camera'], success: result => this.setData({ media: this.data.media.concat((result.tempFiles || []).map((item, index) => ({ id: `${Date.now()}-${index}`, path: item.tempFilePath, size: item.size || 0, status: 'pending', mediaId: '', errorText: '' }))).slice(0, MAX_MEDIA) }) }); },
  removeMedia(event) { this.setData({ media: this.data.media.filter(item => item.id !== event.currentTarget.dataset.id) }); },
  async upload(id) { const item = this.data.media.find(row => row.id === id); if (!item || item.status === 'uploaded') return item && item.mediaId; this.setData({ media: this.data.media.map(row => row.id === id ? { ...row, status: 'uploading', errorText: '' } : row) }); try { const contentBase64 = await readBase64(item.path); const result = await reviews.uploadMedia({ type: 'image', fileName: fileName(item.path), mimeType: 'image/jpeg', sizeBytes: item.size, contentBase64 }); const mediaId = result && result.ok && result.data && result.data.mediaId || ''; this.setData({ media: this.data.media.map(row => row.id === id ? { ...row, status: mediaId ? 'uploaded' : 'failed', mediaId, errorText: mediaId ? '' : result && result.error && result.error.message || '图片上传失败' } : row) }); return mediaId; } catch (error) { this.setData({ media: this.data.media.map(row => row.id === id ? { ...row, status: 'failed', errorText: '图片读取或上传失败' } : row) }); return ''; } },
  retryMedia(event) { return this.upload(event.currentTarget.dataset.id); },
  async submit() { if (this.data.busy || !this.data.current) return; const items = this.data.current.items.filter(item => item.selected); if (!items.length) return wx.showToast({ title: '请选择评价商品', icon: 'none' }); if (!this.data.content.trim()) return wx.showToast({ title: '请填写评价内容', icon: 'none' }); this.setData({ busy: true }); try { for (const item of this.data.media) if (item.status !== 'uploaded') await this.upload(item.id); const failed = this.data.media.filter(item => item.status !== 'uploaded'); if (failed.length) return wx.showToast({ title: '有图片上传失败，请重试', icon: 'none' }); if (!this._reviewKeys) this._reviewKeys = {}; for (const item of items) { if (!this._reviewKeys[item.id]) this._reviewKeys[item.id] = `review-${item.id}-${Date.now()}`; const result = await reviews.create({ orderId: this.data.current.id, orderItemId: item.id, rating: this.data.rating, content: this.data.content.trim(), mediaIds: this.data.media.map(media => media.mediaId), idempotencyKey: this._reviewKeys[item.id] }); if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '评价提交失败', icon: 'none' }); delete this._reviewKeys[item.id]; } this.setData({ current: null }); await this.load(); wx.showToast({ title: '评价已提交', icon: 'success' }); } finally { this.setData({ busy: false }); } },
  back() { wx.navigateBack(); }
});
