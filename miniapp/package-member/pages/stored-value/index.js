const { auth, storedValue } = require('../../../services/index');
const { authorizeMemberPage, isCurrentMemberLoad } = require('../../member-auth');
const money = cents => (Number(cents || 0) / 100).toFixed(2);
const dateText = value => value ? String(value).replace('T', ' ').slice(0, 16) : '';

Page({
  data: { status: 'loading', errorText: '', account: null, ledger: [], amount: '', submitting: false, intent: null },
  onLoad() {},
  onShow() { return this.load(); },
  async load() {
    const access = await authorizeMemberPage(this, auth, { forbiddenText: '请先登录后查看储值账户', clear: { account: null, ledger: [], amount: '', submitting: false, intent: null }, reset: () => { this._topupKey = ''; } });
    if (!access) return;
    const [accountResult, ledgerResult] = await Promise.all([storedValue.account(), storedValue.ledger({ page: 1, pageSize: 100 })]);
    if (!isCurrentMemberLoad(this, access)) return;
    const failed = [accountResult, ledgerResult].find(item => !item || !item.ok);
    if (failed) return this.setData({ status: 'error', errorText: failed && failed.error && failed.error.message || '储值账户加载失败，请重试' });
    const source = accountResult.data && (accountResult.data.account || accountResult.data) || {};
    const rows = ledgerResult.data && ledgerResult.data.rows || [];
    this.setData({ status: 'ready', account: { balance: money(source.balanceCent), frozen: money(source.frozenAmountCent), enabled: source.enabled === true || source.status === 'active', topupEnabled: source.topupEnabled === true || source.realRechargeEnabled === true }, ledger: rows.map(row => ({ ...row, amountText: `${Number(row.amountCent || 0) > 0 ? '+' : ''}${money(row.amountCent)}`, label: row.description || '账户变动', time: dateText(row.createdAt) })) });
  },
  retry() { return this.load(); },
  inputAmount(event) { this.setData({ amount: event.detail.value }); },
  async createTopupIntent() {
    if (this.data.submitting || !this.data.account || !this.data.account.topupEnabled) return;
    const amountCent = Math.round(Number(this.data.amount) * 100);
    if (!Number.isInteger(amountCent) || amountCent <= 0) return wx.showToast({ title: '请输入有效充值金额', icon: 'none' });
    this.setData({ submitting: true });
    try {
      if (!this._topupKey) this._topupKey = `topup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const result = await storedValue.topupIntent({ amountCent, idempotencyKey: this._topupKey });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '测试充值意向创建失败', icon: 'none' });
      const intent = result.data && (result.data.intent || result.data);
      this._topupKey = '';
      this.setData({ intent: { id: intent && (intent._id || intent.id) || '', status: intent && intent.status || 'preview_only', amount: money(amountCent) } });
      wx.showModal({ title: '充值通道未开通', content: '本次只生成测试充值意向，不会扣款，也不会增加储值余额。', showCancel: false });
    } finally { this.setData({ submitting: false }); }
  },
  back() { wx.navigateBack(); }
});
