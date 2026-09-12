const { auth, inquiries } = require('../../../services/index');
const statusText = { submitted: '待报价', quoted: '已报价', accepted: '已接受', expired: '已过期', cancelled: '已取消', rejected: '未报价' };
Page({
  data: { status: 'loading', errorText: '', rows: [] },
  onLoad() { return this.load(); }, onShow() { if (this._shown) this.load(); this._shown = true; },
  async load() {
    this.setData({ status: 'loading', errorText: '' });
    const me = await auth.getMe(); const user = me && me.ok && me.data && me.data.user;
    if (!user || user.userType !== 'b' || user.businessStatus !== 'approved') return this.setData({ status: 'forbidden', errorText: '询价仅对已审核企业采购账户开放' });
    const result = typeof inquiries.listAll === 'function' ? await inquiries.listAll() : await inquiries.list({ page: 1, pageSize: 100 });
    if (!result || !result.ok) return this.setData({ status: 'error', errorText: result && result.error && result.error.message || '询价记录加载失败，请重试' });
    const baseRows = result.data && result.data.rows || [];
    const details = await Promise.all(baseRows.map(row => row.latestQuoteId ? inquiries.get({ id: row._id }).catch(() => null) : null));
    const now = Date.now();
    const rows = baseRows.map((row, index) => {
      const quotes = details[index] && details[index].ok && details[index].data && details[index].data.quotes || [];
      const quote = quotes.find(item => item._id === row.latestQuoteId) || quotes[0] || {};
      const expired = Boolean(quote.validUntil && new Date(quote.validUntil).getTime() <= now);
      return { ...row, id: row._id || row.id, inquiryNo: row.inquiryNo || row._id, statusLabel: expired && row.status === 'quoted' ? '已过期' : statusText[row.status] || row.status, quoteVersion: quote.version || row.latestQuoteVersion || '', validUntil: quote.validUntil ? String(quote.validUntil).replace('T', ' ').slice(0, 16) : '', itemCount: Array.isArray(row.itemIds) ? row.itemIds.length : Number(row.itemCount || 0), quoteTemporary: quote.temporary === true || quote.source === 'ai_generated' };
    });
    this.setData({ status: rows.length ? 'ready' : 'empty', rows });
  },
  retry() { return this.load(); }, create() { wx.navigateTo({ url: '/package-business/pages/inquiry-create/index' }); },
  open(event) { wx.navigateTo({ url: `/package-business/pages/inquiry-detail/index?id=${encodeURIComponent(event.currentTarget.dataset.id)}` }); }, back() { wx.navigateBack(); }
});
