const { auth, coupons } = require('../../../services/index');
const { createCouponWallet } = require('../../../modules/coupon-wallet');
const { authorizeMemberPage, isCurrentMemberLoad } = require('../../../modules/member-auth');

const intentKey = userId => `mengshixian:coupon-claim:v1:${encodeURIComponent(userId)}`;

Page({
  data: {
    status: 'loading', errorText: '', templates: [], coupons: [], busyId: '', claimState: 'idle', claimText: '', selectMode: false
  },
  onLoad(query = {}) { this.setData({ selectMode: query.select === '1' }); },
  onShow() { return this.load(); },
  onUnload() {
    this._couponUnloaded = true;
    this._memberAuthRevision = Number(this._memberAuthRevision || 0) + 1;
    if (this._couponWallet) this._couponWallet.dispose();
  },
  couponWallet() {
    if (!this._couponWallet) this._couponWallet = createCouponWallet({
      coupons,
      intentStore: {
        get: userId => wx.getStorageSync(intentKey(userId)),
        set: (userId, intent) => wx.setStorageSync(intentKey(userId), intent),
        remove: userId => wx.removeStorageSync(intentKey(userId))
      },
      createKey: () => `coupon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      onChange: state => { if (!this._couponUnloaded) this.setData(state); }
    });
    return this._couponWallet;
  },
  async load() {
    if (this._couponUnloaded) return;
    const wallet = this.couponWallet();
    wallet.reset();
    const access = await authorizeMemberPage(this, auth, {
      forbiddenText: '请先登录后查看优惠券',
      clear: { templates: [], coupons: [], busyId: '', claimState: 'idle', claimText: '' },
      reset: () => wallet.reset()
    });
    if (!access || this._couponUnloaded || !isCurrentMemberLoad(this, access)) return;
    return wallet.load({ userId: access.user._id || access.user.id });
  },
  retry() { return this.load(); },
  claim(event) {
    if (this._couponUnloaded) return;
    return this.couponWallet().claim(event.currentTarget.dataset.id);
  },
  choose(event) {
    const item = this.data.coupons.find(row => row.id === event.currentTarget.dataset.id);
    if (!this.data.selectMode || !item || !item.usable) return;
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (channel && channel.emit) channel.emit('couponSelected', { couponId: item.id });
    wx.navigateBack();
  },
  clearSelection() {
    const channel = this.getOpenerEventChannel && this.getOpenerEventChannel();
    if (channel && channel.emit) channel.emit('couponSelected', { couponId: '' });
    wx.navigateBack();
  },
  back() { wx.navigateBack(); }
});
