const { auth } = require('../../../services/index');
const { deriveAccountModel } = require('../../../modules/member-presentation');
const { authorizeMemberPage, isCurrentMemberLoad } = require('../../member-auth');

Page({
  data: { status: 'loading', errorText: '', account: null },
  onLoad() {},
  onShow() { return this.load(); },
  async load() {
    const access = await authorizeMemberPage(this, auth, {
      forbiddenText: '请先登录后查看账户信息',
      clear: { account: null }
    });
    if (!access) return;
    if (!isCurrentMemberLoad(this, access)) return;
    this.setData({ status: 'ready', account: deriveAccountModel(access.user) });
  },
  retry() { return this.load(); },
  openMembership() { wx.navigateTo({ url: '/package-member/pages/membership/index' }); },
  openPoints() { wx.navigateTo({ url: '/package-member/pages/points/index' }); },
  openLegal() { wx.navigateTo({ url: '/package-member/pages/legal/index?type=privacy' }); },
  openBusiness() {
    if (!this.data.account) return;
    if (this.data.account.canOpenProcurement) return wx.navigateTo({ url: '/package-business/pages/center/index' });
    if (this.data.account.canApplyBusiness) return wx.reLaunch({ url: '/pages/index/index?tab=mine&utility=businessApplication' });
  },
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后需要重新登录才能查看订单和会员资产。',
      confirmText: '退出',
      confirmColor: '#e65353',
      success: result => { if (result.confirm) wx.reLaunch({ url: '/pages/index/index?tab=mine&logout=1' }); }
    });
  },
  back() { wx.navigateBack(); }
});
