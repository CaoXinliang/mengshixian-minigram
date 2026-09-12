const { auth, membership } = require('../../../services/index');
const dateText = value => value ? String(value).replace('T', ' ').slice(0, 16) : '';

Page({
  data: { status: 'loading', errorText: '', account: null, profile: null, ledger: [], signing: false },
  onLoad() { return this.load(); },
  async load() {
    this.setData({ status: 'loading', errorText: '' });
    const me = await auth.getMe();
    if (!me || !me.ok || !me.data || !me.data.user) return this.setData({ status: 'forbidden', errorText: '请先登录后查看积分账户' });
    const [accountResult, profileResult, ledgerResult] = await Promise.all([membership.pointsAccount(), membership.profile(), membership.pointsLedger({ page: 1, pageSize: 100 })]);
    const failed = [accountResult, profileResult, ledgerResult].find(item => !item || !item.ok);
    if (failed) return this.setData({ status: 'error', errorText: failed && failed.error && failed.error.message || '积分数据加载失败，请重试' });
    const account = accountResult.data && (accountResult.data.account || accountResult.data) || {};
    const profile = profileResult.data && (profileResult.data.profile || profileResult.data) || {}; const level = profileResult.data && profileResult.data.level || {};
    const rows = ledgerResult.data && ledgerResult.data.rows || [];
    this.setData({ status: 'ready', account: { balance: Number(account.balance || account.points || 0), signedToday: rows.some(row => row.action === 'daily_sign_in' && String(row.createdAt || '').slice(0, 10) === new Date().toISOString().slice(0, 10)), expiring: Number(account.expiringPoints || 0) }, profile: { levelName: level.name || profile.levelName || '普通会员', growthValue: Number(profile.lifetimePoints || account.lifetimeEarned || 0), benefits: Array.isArray(level.benefits) ? level.benefits : [] }, ledger: rows.map(row => ({ ...row, amountText: `${Number(row.change || 0) > 0 ? '+' : ''}${Number(row.change || 0)}`, label: row.description || row.reason || row.action || '积分变动', time: dateText(row.createdAt) })) });
  },
  retry() { return this.load(); },
  async signIn() {
    if (this.data.signing || this.data.account && this.data.account.signedToday) return;
    this.setData({ signing: true });
    try {
      if (!this._signKey) this._signKey = `points-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const result = await membership.signIn({ idempotencyKey: this._signKey });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '签到失败，请重试', icon: 'none' });
      this._signKey = '';
      await this.load();
      wx.showToast({ title: '签到成功', icon: 'success' });
    } finally { this.setData({ signing: false }); }
  },
  back() { wx.navigateBack(); }
});
