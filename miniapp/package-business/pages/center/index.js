const { auth, procurement } = require('../../../services/index');
const money = cents => (Number(cents || 0) / 100).toFixed(2);
const dateText = value => value ? String(value).slice(0, 10) : '--';

Page({
  data: { status: 'loading', errorText: '', account: null, receivables: [], statements: [] },
  onLoad() { return this.load(); },
  async load() {
    this.setData({ status: 'loading', errorText: '' });
    const me = await auth.getMe();
    const user = me && me.ok && me.data && me.data.user;
    if (!user || user.userType !== 'b' || user.businessStatus !== 'approved') return this.setData({ status: 'forbidden', errorText: '企业采购中心仅对已审核企业采购账户开放' });
    const [accountResult, receivableResult, statementResult] = await Promise.all([procurement.getAccount(), typeof procurement.listAllReceivables === 'function' ? procurement.listAllReceivables() : procurement.listReceivables({ page: 1, pageSize: 100 }), typeof procurement.listAllStatements === 'function' ? procurement.listAllStatements() : procurement.listStatements({ page: 1, pageSize: 100 })]);
    const failed = [accountResult, receivableResult, statementResult].find(result => !result || !result.ok);
    if (failed) return this.setData({ status: 'error', errorText: failed && failed.error && failed.error.message || '采购账户数据加载失败，请重试' });
    const accountData = accountResult.data || {}; const source = accountData.account || {}; const organization = accountData.organization || {};
    const limit = Number(source.creditLimitCent || source.creditTotalCent || 0); const used = Number(source.creditUsedCent || source.occupiedCent || 0); const receivable = Number(source.receivableCent || 0); const available = source.availableCent === undefined ? Math.max(0, limit - used - receivable) : Number(source.availableCent);
    const account = { organizationName: source.organizationName || organization.name || '企业采购账户', priceLevel: source.priceLevel || organization.priceLevel || user.priceLevel || '--', paymentTerms: source.paymentTerms || (source.paymentTermDays || organization.paymentTermDays ? `${source.paymentTermDays || organization.paymentTermDays} 天` : '以企业协议为准'), creditLimit: money(limit), creditUsed: money(used), receivable: money(receivable), creditAvailable: money(available), configured: Boolean(accountData.account), temporary: source.temporary === true || source.source === 'ai_generated' };
    const receivables = (receivableResult.data && receivableResult.data.rows || []).map(row => ({ ...row, amount: money(row.amountCent || row.outstandingAmountCent), date: dateText(row.dueAt || row.createdAt), label: row.title || row.orderNo || row.type || '应收记录' }));
    const statements = (statementResult.data && statementResult.data.rows || []).map(row => ({ ...row, amount: money(row.amountCent || row.closingBalanceCent), date: dateText(row.periodEnd || row.createdAt), label: row.statementNo || row.period || '对账单' }));
    this.setData({ status: 'ready', account, receivables, statements });
  },
  retry() { return this.load(); },
  openFrequent() { wx.navigateTo({ url: '/package-business/pages/frequent/index' }); },
  openInquiries() { wx.navigateTo({ url: '/package-business/pages/inquiries/index' }); },
  createInquiry() { wx.navigateTo({ url: '/package-business/pages/inquiry-create/index' }); },
  back() { wx.navigateBack(); }
});
