const { auth, inquiries } = require('../../../services/index');
const money = cents => (Number(cents || 0) / 100).toFixed(2);
const statusText = { submitted: '等待报价', quoted: '已报价', accepted: '报价已接受', expired: '报价已过期', rejected: '未报价', cancelled: '已取消' };
function model(data) {
  const inquiry = data.inquiry || data; const quote = data.quote || inquiry.quote || inquiry.latestQuote || (data.quotes || inquiry.quotes || [])[0] || null;
  const expired = Boolean(quote && quote.validUntil && new Date(quote.validUntil).getTime() <= Date.now());
  const draft = Boolean(quote && (quote.temporary === true || quote.source === 'ai_generated'));
  return { id: inquiry._id, inquiryNo: inquiry.inquiryNo || inquiry._id, status: inquiry.status, statusLabel: expired ? '报价已过期' : statusText[inquiry.status] || inquiry.status, description: inquiry.description || '', items: data.items || inquiry.items || [], quote: quote && { ...quote, id: quote._id || quote.quoteId, version: Number(quote.version || 0), validUntilText: quote.validUntil ? String(quote.validUntil).replace('T', ' ').slice(0, 16) : '--', items: (quote.items || []).map(item => ({ ...item, unitPrice: money(item.unitPriceCent), subtotal: money(item.subtotalCent === undefined ? Number(item.unitPriceCent || 0) * Number(item.quantity || 0) : item.subtotalCent) })), temporary: draft, expired }, canAccept: Boolean(quote && !draft && !expired && inquiry.status === 'quoted') };
}
Page({
  data: { inquiryId: '', status: 'loading', errorText: '', detail: null, acceptLocked: false, acceptError: '', acceptResult: null },
  onLoad(query = {}) { let id = query.id || ''; try { id = decodeURIComponent(id); } catch (error) { id = ''; } this.setData({ inquiryId: id }); return this.load(); },
  async load() {
    if (!this.data.inquiryId) return this.setData({ status: 'empty', errorText: '询价编号无效' }); this.setData({ status: 'loading', errorText: '' });
    const me = await auth.getMe(); const user = me && me.ok && me.data && me.data.user;
    if (!user || user.userType !== 'b' || user.businessStatus !== 'approved') return this.setData({ status: 'forbidden', errorText: '询价详情仅对已审核企业采购账户开放' });
    const result = await inquiries.get({ id: this.data.inquiryId });
    if (!result || !result.ok) return this.setData({ status: result && result.error && result.error.code === 'INQUIRY_NOT_FOUND' ? 'empty' : 'error', errorText: result && result.error && result.error.message || '询价详情加载失败，请重试' });
    this.setData({ status: 'ready', detail: model(result.data || {}), acceptError: '' });
  }, retry() { return this.load(); },
  async accept() {
    const quote = this.data.detail && this.data.detail.quote; if (!quote || !this.data.detail.canAccept || this.data.acceptLocked) return;
    const idempotencyKey = this._acceptKey || `accept-${quote.id}-${quote.version}-${Date.now()}`; this._acceptKey = idempotencyKey; this.setData({ acceptLocked: true, acceptError: '' });
    try { const result = await inquiries.accept({ id: this.data.inquiryId, quoteId: quote.id, version: quote.version, idempotencyKey }); if (!result || !result.ok) { if (result && result.error && result.error.code !== 'REQUEST_FAILED') this._acceptKey = ''; return this.setData({ acceptError: result && result.error && result.error.message || '接受报价失败，请重试' }); } this._acceptKey = ''; const data = result.data || {}; this.setData({ acceptResult: { quoteToken: data.acceptedQuoteToken || '', addedItems: data.addedItems || [], invalidItems: data.invalidItems || [], checkoutReady: Boolean(data.acceptedQuoteToken || data.checkoutReady) } }); await this.load(); } finally { this.setData({ acceptLocked: false }); }
  },
  goCart() { wx.reLaunch({ url: '/pages/index/index?tab=cart' }); },
  goCheckout() { if (!this.data.acceptResult || !this.data.acceptResult.quoteToken) return; wx.navigateTo({ url: `/package-trade/pages/checkout/index?acceptedQuoteToken=${encodeURIComponent(this.data.acceptResult.quoteToken)}` }); },
  back() { wx.navigateBack(); }
});
