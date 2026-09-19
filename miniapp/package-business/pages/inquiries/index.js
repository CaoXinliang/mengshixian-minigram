const { auth, inquiries } = require('../../../services/index');
const { authorizeBusinessPage, isCurrentBusinessLoad } = require('../../business-auth');
const statusText = { submitted: '待报价', quoted: '已报价', accepted: '已接受', expired: '已过期', cancelled: '已取消', rejected: '未报价' };
Page({
  data: { status: 'loading', errorText: '', rows: [], canCreateInquiry: false },
  onLoad() {},
  onShow() { return this.load(); },
  async load() {
    this.setData({ canCreateInquiry: false });
    const access = await authorizeBusinessPage(this, auth, { forbiddenText: '询价仅对已审核企业采购账户开放', clear: { rows: [], canCreateInquiry: false } });
    if (!access) return;
    const result = typeof inquiries.listAll === 'function' ? await inquiries.listAll() : await inquiries.list({ page: 1, pageSize: 100 });
    if (!isCurrentBusinessLoad(this, access)) return;
    if (!result || !result.ok) return this.setData({ status: 'error', errorText: result && result.error && result.error.message || '询价记录加载失败，请重试', canCreateInquiry: false });
    const baseRows = result.data && result.data.rows || [];
    const details = await Promise.all(baseRows.map(row => row.latestQuoteId ? inquiries.get({ id: row._id }).catch(() => null) : null));
    if (!isCurrentBusinessLoad(this, access)) return;
    const now = Date.now();
    const rows = baseRows.map((row, index) => {
      const quotes = details[index] && details[index].ok && details[index].data && details[index].data.quotes || [];
      const quote = quotes.find(item => item._id === row.latestQuoteId) || quotes[0] || {};
      const expired = Boolean(quote.validUntil && new Date(quote.validUntil).getTime() <= now);
      return { ...row, id: row._id || row.id, inquiryNo: row.inquiryNo || row._id, statusLabel: expired && row.status === 'quoted' ? '已过期' : statusText[row.status] || '处理中', quoteVersion: quote.version || row.latestQuoteVersion || '', validUntil: quote.validUntil ? String(quote.validUntil).replace('T', ' ').slice(0, 16) : '', itemCount: Array.isArray(row.itemIds) ? row.itemIds.length : Number(row.itemCount || 0), quoteTemporary: quote.temporary === true || quote.source === 'ai_generated' };
    });
    this.setData({ status: rows.length ? 'ready' : 'empty', rows, canCreateInquiry: true });
  },
  retry() { return this.load(); }, create() { if (!this.data.canCreateInquiry) return; wx.navigateTo({ url: '/package-business/pages/inquiry-create/index' }); },
  open(event) { wx.navigateTo({ url: `/package-business/pages/inquiry-detail/index?id=${encodeURIComponent(event.currentTarget.dataset.id)}` }); }, back() { wx.navigateBack(); }
});
