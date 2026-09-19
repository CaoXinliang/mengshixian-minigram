const { auth, membership } = require('../../../services/index');
const { createPointsAccount } = require('../../../modules/points-account');
const { authorizeMemberPage, isCurrentMemberLoad } = require('../../member-auth');
const intentKey = userId => `mengshixian:points-sign-in:v1:${encodeURIComponent(userId)}`;

Page({
  data: { status: 'loading', errorText: '', account: null, profile: null, ledger: [], businessDate: '', signInRule: null, ruleText: '', canSignIn: false, signing: false, signState: 'idle', signText: '' },
  onLoad() {},
  onShow() { return this.load(); },
  onUnload() {
    this._pointsUnloaded = true;
    this._memberAuthRevision = Number(this._memberAuthRevision || 0) + 1;
    if (this._pointsAccount) this._pointsAccount.dispose();
  },
  pointsAccount() {
    if (!this._pointsAccount) this._pointsAccount = createPointsAccount({
      membership,
      intentStore: {
        get: userId => wx.getStorageSync(intentKey(userId)),
        set: (userId, intent) => wx.setStorageSync(intentKey(userId), intent),
        remove: userId => wx.removeStorageSync(intentKey(userId))
      },
      createKey: () => `points-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      onChange: state => { if (!this._pointsUnloaded) this.setData(state); }
    });
    return this._pointsAccount;
  },
  async load() {
    if (this._pointsUnloaded) return;
    const account = this.pointsAccount();
    account.reset();
    const access = await authorizeMemberPage(this, auth, {
      forbiddenText: '请先登录后查看积分账户',
      clear: { account: null, profile: null, ledger: [], signing: false, signText: '' },
      reset: () => account.reset()
    });
    if (!access || this._pointsUnloaded || !isCurrentMemberLoad(this, access)) return;
    return account.load({ userId: access.user._id || access.user.id });
  },
  retry() { return this.load(); },
  signIn() { if (!this._pointsUnloaded) return this.pointsAccount().signIn(); },
  back() { wx.navigateBack(); }
});
