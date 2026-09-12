const { auth, coupons } = require('../../../services/index');
const money = cents => (Number(cents || 0) / 100).toFixed(2);

Page({
  data: { status: 'loading', errorText: '', templates: [], coupons: [], busyId: '', selectMode: false },
  onLoad(query = {}) { this.setData({ selectMode: query.select === '1' }); return this.load(); },
  async load() {
    this.setData({ status: 'loading', errorText: '' });
    const me = await auth.getMe();
    if (!me || !me.ok || !me.data || !me.data.user) return this.setData({ status: 'forbidden', errorText: '请先登录后查看优惠券' });
    const [templatesResult, couponsResult] = await Promise.all([coupons.templates({ page: 1, pageSize: 100 }), coupons.list({ page: 1, pageSize: 100 })]);
    const failed = [templatesResult, couponsResult].find(item => !item || !item.ok);
    if (failed) return this.setData({ status: 'error', errorText: failed && failed.error && failed.error.message || '优惠券加载失败，请重试' });
    const owned = couponsResult.data && couponsResult.data.rows || [];
    const ownedTemplates = new Set(owned.map(item => item.templateId));
    const normalize = item => { const source = item.snapshot ? { ...item.snapshot, ...item } : item; return { ...source, id: item._id, name: source.name || source.title || '优惠券', valueText: source.discountCent ? `¥${money(source.discountCent)}` : source.discountRateBps ? `${Number(source.discountRateBps) / 100}折` : '优惠', thresholdText: Number(source.minSpendCent || 0) > 0 ? `满 ¥${money(source.minSpendCent)} 可用` : '无门槛', validityText: [source.validFrom, source.validTo].filter(Boolean).map(v => String(v).slice(0, 10)).join(' 至 '), statusText: source.statusText || ({ available: '可使用', used: '已使用', expired: '已过期' }[item.status] || item.status || '可使用'), usable: item.status === 'available' }; };
    this.setData({ status: 'ready', templates: (templatesResult.data && templatesResult.data.rows || []).map(item => ({ ...normalize(item), claimed: ownedTemplates.has(item._id) })), coupons: owned.map(normalize) });
  },
  retry() { return this.load(); },
  async claim(event) {
    const id = event.currentTarget.dataset.id; if (!id || this.data.busyId) return;
    this.setData({ busyId: id });
    try {
      if (!this._claimKeys) this._claimKeys = {};
      if (!this._claimKeys[id]) this._claimKeys[id] = `coupon-${id}-${Date.now()}`;
      const result = await coupons.claim({ templateId: id, idempotencyKey: this._claimKeys[id] });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '领取失败，请重试', icon: 'none' });
      delete this._claimKeys[id]; await this.load(); wx.showToast({ title: '领取成功', icon: 'success' });
    } finally { this.setData({ busyId: '' }); }
  },
  choose(event) {
    const item = this.data.coupons.find(row => row.id === event.currentTarget.dataset.id);
    if (!this.data.selectMode || !item || !item.usable) return;
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (channel && channel.emit) channel.emit('couponSelected', { couponId: item.id, coupon: item });
    wx.navigateBack();
  },
  clearSelection() { const channel = this.getOpenerEventChannel && this.getOpenerEventChannel(); if (channel && channel.emit) channel.emit('couponSelected', { couponId: '', coupon: null }); wx.navigateBack(); },
  back() { wx.navigateBack(); }
});
